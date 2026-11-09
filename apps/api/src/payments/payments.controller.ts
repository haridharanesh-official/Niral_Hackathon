import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PaymentOrderDto, PaymentSettingsDto } from './payments.dto';
import { UpiService } from './upi/upi.service';
import { GmailReconciliationService } from './upi/gmail-reconciliation.service';
import {
  GmailCompleteDto,
  UpiClaimDto,
  UpiCreditVerificationDto,
  UpiDecisionDto,
  UpiExportDto,
  UpiRefundCompleteDto,
  UpiRefundRequestDto,
  UtrSearchDto,
} from './upi/upi.dto';
type AuthRequest = Request & { user: { userId: string } };
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly upi: UpiService,
  ) {}
  @Get('config') config() {
    return this.payments.publicConfig();
  }
  @UseGuards(JwtAuthGuard)
  @Post('orders')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Req() req: AuthRequest, @Body() dto: PaymentOrderDto) {
    return this.upi.create(req.user.userId, dto.enrollmentId);
  }
  @UseGuards(JwtAuthGuard) @Get('me') mine(@Req() req: AuthRequest) {
    return this.payments.mine(req.user.userId);
  }
  @UseGuards(JwtAuthGuard) @Get('orders/:id/status') status(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.payments.status(id, req.user.userId);
  }
  @UseGuards(JwtAuthGuard) @Post('orders/:id/refresh') refresh(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.payments.status(id, req.user.userId);
  }
  @UseGuards(JwtAuthGuard) @Get('upi/:id') detail(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.upi.detail(req.user.userId, id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('upi/:id/checkout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  checkout(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.upi.checkout(req.user.userId, id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('upi/:id/claim')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  claim(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpiClaimDto,
  ) {
    return this.upi.claim(req.user.userId, id, dto.utr);
  }
  @UseGuards(JwtAuthGuard)
  @Get(':id/receipt')
  async receipt(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const html = await this.payments.receipt(id, req.user.userId);
    response
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="niral-payment-receipt.html"',
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      })
      .send(html);
  }
}
@Controller('master')
@UseGuards(JwtAuthGuard)
export class MasterPaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly upi: UpiService,
    private readonly gmail: GmailReconciliationService,
  ) {}
  @Get('payments') list(@Req() req: AuthRequest) {
    return this.payments.masterList(req.user.userId);
  }
  @Get('payments/summary') summary(@Req() req: AuthRequest) {
    return this.payments.summary(req.user.userId);
  }
  @Patch('events/:id/payment-settings') settings(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: PaymentSettingsDto,
  ) {
    return this.payments.updateSettings(req.user.userId, id, dto);
  }
  @Get('upi') queue(@Req() req: AuthRequest) {
    return this.upi.queue(req.user.userId);
  }
  @Post('upi/export')
  export(@Req() req: AuthRequest, @Body() dto: UpiExportDto) {
    return this.upi.exportPage(
      req.user.userId,
      dto.kind,
      dto.cursor,
      dto.cutoff,
    );
  }
  @Post('upi/search') search(
    @Req() req: AuthRequest,
    @Body() dto: UtrSearchDto,
  ) {
    return this.upi.queue(req.user.userId, dto.utr);
  }
  @Post('upi/:id/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verify(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpiCreditVerificationDto,
  ) {
    return this.upi.verify(req.user.userId, id, dto);
  }
  @Post('upi/:id/reject')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  reject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpiDecisionDto,
  ) {
    return this.upi.reject(req.user.userId, id, dto.reason);
  }
  @Post('upi/:id/refunds')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refund(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpiRefundRequestDto,
  ) {
    return this.upi.requestRefund(req.user.userId, id, dto.reason, dto.confirm);
  }
  @Post('upi/:id/refunds/complete')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refundComplete(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpiRefundCompleteDto,
  ) {
    return this.upi.completeRefund(req.user.userId, id, dto);
  }
  @Get('upi/gmail/status') gmailStatus(@Req() req: AuthRequest) {
    return this.gmail.status(req.user.userId);
  }
  @Post('upi/gmail/connect') connect(@Req() req: AuthRequest) {
    return this.gmail.start(req.user.userId);
  }
  @Post('upi/gmail/complete') complete(
    @Req() req: AuthRequest,
    @Body() dto: GmailCompleteDto,
  ) {
    return this.gmail.complete(req.user.userId, dto.code, dto.state);
  }
  @Post('upi/gmail/poll')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  poll(@Req() req: AuthRequest) {
    return this.gmail.poll(req.user.userId);
  }
  @Post('upi/gmail/:id/disconnect') disconnect(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.gmail.disconnect(req.user.userId, id);
  }
  @Post('upi/gmail/:id/health')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  gmailHealth(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.gmail.health(req.user.userId, id);
  }
  @Post('upi/gmail/:id/labels')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  gmailLabels(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.gmail.labels(req.user.userId, id);
  }
}
