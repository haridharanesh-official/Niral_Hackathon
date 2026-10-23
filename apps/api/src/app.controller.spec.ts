import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { APP_NAME } from '@hackos/shared';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return platform info', () => {
      const info = appController.getInfo();
      expect(info.name).toBe(APP_NAME);
      expect(info.status).toBe('production-ready-scaffold');
    });
  });
});
