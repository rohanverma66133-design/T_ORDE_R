import { Body, Controller, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleCode, PrescriptionStatus } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrescriptionsService, type PrescriptionFile, type UploadPrescriptionDto } from './prescriptions.service';
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}
  @Get() findAll(@CurrentUser('id') userId: string) { return this.prescriptionsService.findAll(userId); }
  @Post() @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })) upload(@CurrentUser('id') userId: string, @Body() dto: UploadPrescriptionDto, @UploadedFile() file: PrescriptionFile) { return this.prescriptionsService.upload(userId, dto, file); }
  @Get(':id/signed-download') signedDownload(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.prescriptionsService.signedDownload(userId, id); }
  @Get(':id/file') async file(@CurrentUser('id') userId: string, @Param('id') id: string, @Query('expiresAt') expiresAt: string, @Query('signature') signature: string, @Res() res: Response) { const file = await this.prescriptionsService.getFile(userId, id, Number(expiresAt), signature); res.setHeader('Cache-Control', 'private, no-store'); res.type(file.contentType).send(file.body); }
  @Roles(RoleCode.PHARMACY_ADMIN, RoleCode.ADMIN, RoleCode.SUPER_ADMIN) @Patch(':id/verify') verify(@CurrentUser('id') verifierId: string, @Param('id') id: string, @Body() body: { status: PrescriptionStatus; rejectionReason?: string }) { return this.prescriptionsService.verifyPrescription(verifierId, id, body.status, body.rejectionReason); }
}