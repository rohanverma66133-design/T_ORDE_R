import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrescriptionStatus, StorageObjectKind } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AuditService } from '../audit/audit.service';
export interface UploadPrescriptionDto { orderId?: string; }
export interface PrescriptionFile { originalname: string; mimetype: string; size: number; buffer: Buffer; }
const allowed: Record<string, string[]> = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly storage: StorageService) {}
  async findAll(userId: string) { const records = await this.prisma.prescription.findMany({ where: { customerId: userId }, orderBy: { uploadedAt: 'desc' }, include: { order: { select: { id: true, orderNumber: true } } } }); return records.map((r) => ({ id: r.id, fileKey: r.fileKey, status: r.status, uploadedAt: r.uploadedAt, orderNumber: r.order?.orderNumber })); }
  async upload(userId: string, dto: UploadPrescriptionDto, file: PrescriptionFile) {
    const extension = file?.originalname?.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
    if (!file?.buffer?.length || !extension || !allowed[file.mimetype]?.includes(extension) || file.size > 5 * 1024 * 1024) throw new BadRequestException({ code: 'INVALID_PRESCRIPTION_FILE', message: 'Upload a PDF, JPG, PNG, or WebP file up to 5MB' });
    const key = `private/prescriptions/${userId}/${randomUUID()}${extension}`;
    await this.storage.put({ key, body: file.buffer, contentType: file.mimetype });
    const object = await this.prisma.storageObject.create({ data: { kind: StorageObjectKind.PRESCRIPTION, key, contentType: file.mimetype, byteSize: file.size } });
    return this.prisma.prescription.create({ data: { customerId: userId, orderId: dto.orderId || null, storageObjectId: object.id, fileKey: key, status: PrescriptionStatus.UNDER_REVIEW } });
  }
  async signedDownload(userId: string, id: string) { const rx = await this.prisma.prescription.findFirst({ where: { id, customerId: userId } }); if (!rx) throw new NotFoundException('Prescription not found'); const expiresAt = Date.now() + 300000; return { expiresAt, signature: this.storage.sign(rx.fileKey, expiresAt) }; }
  async getFile(userId: string, id: string, expiresAt: number, signature: string) { const rx = await this.prisma.prescription.findFirst({ where: { id, customerId: userId }, include: { storageObject: true } }); if (!rx) throw new NotFoundException('Prescription not found'); this.storage.assertSignature(rx.fileKey, expiresAt, signature); return { body: await this.storage.get(rx.fileKey), contentType: rx.storageObject?.contentType || 'application/octet-stream' }; }
  async verifyPrescription(verifierId: string, prescriptionId: string, status: PrescriptionStatus, rejectionReason?: string) { const prescription = await this.prisma.prescription.findUnique({ where: { id: prescriptionId } }); if (!prescription) throw new NotFoundException({ code: 'PRESCRIPTION_NOT_FOUND', message: 'Prescription not found' }); const updated = await this.prisma.prescription.update({ where: { id: prescriptionId }, data: { status } }); await this.prisma.prescriptionVerification.create({ data: { prescriptionId, verifierId, status, rejectionReason } }); this.audit.record({ actorId: verifierId, action: 'SECURITY_PRESCRIPTION_VERIFIED', entityType: 'Prescription', entityId: prescriptionId, metadata: { status, rejectionReason } }); return updated; }
}