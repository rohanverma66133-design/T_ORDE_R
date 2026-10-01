import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupportService, type CreateTicketDto } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  findAllTickets(@CurrentUser('id') userId: string) {
    return this.supportService.findAllTickets(userId);
  }

  @Post('tickets')
  createTicket(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(userId, dto);
  }

  @Post('tickets/:id/messages')
  addMessage(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
    @Body() body: { message: string },
  ) {
    return this.supportService.addMessage(userId, ticketId, body.message);
  }
}
