import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [JudgeController],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {}
