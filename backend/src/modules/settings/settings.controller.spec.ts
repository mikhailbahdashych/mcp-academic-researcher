import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: {
    get: jest.Mock;
    update: jest.Mock;
    listModels: jest.Mock;
    test: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      get: jest.fn().mockResolvedValue({ llmProvider: 'ollama' }),
      update: jest.fn().mockResolvedValue({ llmProvider: 'anthropic' }),
      listModels: jest.fn().mockResolvedValue({ models: [] }),
      test: jest.fn().mockResolvedValue({ ok: true }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: service }],
    }).compile();

    controller = moduleRef.get<SettingsController>(SettingsController);
  });

  it('returns the current settings view', async () => {
    await expect(controller.get()).resolves.toEqual({ llmProvider: 'ollama' });
    expect(service.get).toHaveBeenCalled();
  });

  it('forwards the update dto', async () => {
    const dto = { llmProvider: 'anthropic' as const };

    await expect(controller.update(dto)).resolves.toEqual({
      llmProvider: 'anthropic',
    });
    expect(service.update).toHaveBeenCalledWith(dto);
  });

  it('forwards the probe dto to listModels', async () => {
    const dto = { provider: 'ollama' as const };

    await expect(controller.models(dto)).resolves.toEqual({ models: [] });
    expect(service.listModels).toHaveBeenCalledWith(dto);
  });

  it('forwards the probe dto to test', async () => {
    const dto = { provider: 'anthropic' as const, apiKey: 'sk-ant-test' };

    await expect(controller.test(dto)).resolves.toEqual({ ok: true });
    expect(service.test).toHaveBeenCalledWith(dto);
  });
});
