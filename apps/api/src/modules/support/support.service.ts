import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateTicketDto {
  subject: string;
  category?: string;
  message: string;
  orderId?: string;
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      messages: t.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        message: m.message,
        createdAt: m.createdAt,
      })),
    }));
  }

  async createTicket(userId: string, dto: CreateTicketDto) {
    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: dto.subject,
        category: dto.category || 'General Enquiry',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.MEDIUM,
        messages: {
          create: {
            senderId: userId,
            message: dto.message,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return ticket;
  }

  async addMessage(userId: string, ticketId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const msg = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: SupportTicketStatus.IN_PROGRESS },
    });

    return msg;
  }
}
