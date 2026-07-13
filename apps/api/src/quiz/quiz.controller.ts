import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  OnModuleInit,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsObject } from 'class-validator';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SubmitQuizDto {
  @IsObject()
  answers!: Record<string, number>;
}

type AuthRequest = Request & { user: { userId: string } };

@Controller('quizzes')
export class QuizController implements OnModuleInit {
  constructor(private readonly quizService: QuizService) {}

  async onModuleInit() {
    try {
      await this.quizService.ensureSeedQuizzes();
    } catch {
      // DB may be offline during local UI-only work
    }
  }

  @Get()
  list() {
    return this.quizService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.quizService.getForPlay(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizService.submit(id, req.user.userId, dto.answers);
  }
}
