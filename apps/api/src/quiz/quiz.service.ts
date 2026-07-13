import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizCategory, QuizDifficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.quiz.findMany({
      where: { isActive: true },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForPlay(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            prompt: true,
            options: true,
            points: true,
            order: true,
          },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async submit(
    quizId: string,
    userId: string,
    answers: Record<string, number>,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    let score = 0;
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    for (const question of quiz.questions) {
      if (answers[question.id] === question.correctIndex) {
        score += question.points;
      }
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        maxScore,
        answers,
      },
    });

    const xpGain = Math.round((score / Math.max(maxScore, 1)) * quiz.xpReward);
    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpGain } },
    });

    return { attempt, xpGain, score, maxScore };
  }

  async ensureSeedQuizzes() {
    const count = await this.prisma.quiz.count();
    if (count > 0) return;

    await this.prisma.quiz.create({
      data: {
        title: 'IoT Fundamentals',
        description: 'Sensors, protocols, and edge basics',
        category: QuizCategory.IOT,
        difficulty: QuizDifficulty.EASY,
        timeLimit: 300,
        xpReward: 40,
        questions: {
          create: [
            {
              prompt: 'Which protocol is common for constrained IoT devices?',
              options: ['MQTT', 'FTP', 'SMTP', 'SSH'],
              correctIndex: 0,
              points: 10,
              order: 0,
            },
            {
              prompt: 'What does ADC convert?',
              options: [
                'Analog to Digital',
                'Audio to Data',
                'Address to Device',
                'Amp to Decibel',
              ],
              correctIndex: 0,
              points: 10,
              order: 1,
            },
            {
              prompt: 'A DHT22 primarily measures:',
              options: [
                'Temperature & Humidity',
                'Distance',
                'Current',
                'Magnetism',
              ],
              correctIndex: 0,
              points: 10,
              order: 2,
            },
          ],
        },
      },
    });

    await this.prisma.quiz.create({
      data: {
        title: 'AI Quickfire',
        description: 'Model basics for hackathon builders',
        category: QuizCategory.AI,
        difficulty: QuizDifficulty.MEDIUM,
        timeLimit: 360,
        xpReward: 60,
        questions: {
          create: [
            {
              prompt: 'What does inference mean?',
              options: [
                'Running a trained model on new data',
                'Collecting training labels',
                'Tuning hyperparameters only',
                'Compressing datasets',
              ],
              correctIndex: 0,
              points: 10,
              order: 0,
            },
            {
              prompt: 'Edge AI typically prioritizes:',
              options: [
                'Latency & power',
                'Maximum cluster size',
                'Infinite context only',
                'Offline printers',
              ],
              correctIndex: 0,
              points: 10,
              order: 1,
            },
          ],
        },
      },
    });
  }
}
