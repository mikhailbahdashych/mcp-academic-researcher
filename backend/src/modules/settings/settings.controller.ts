import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ProviderProbeDto } from './dto/provider-probe.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  ModelsResult,
  ProviderTestResult,
  SettingsService,
  SettingsView,
} from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(): Promise<SettingsView> {
    return this.service.get();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto): Promise<SettingsView> {
    return this.service.update(dto);
  }

  // 200, not 201: these probe a provider, they do not create anything.
  @Post('models')
  @HttpCode(200)
  models(@Body() dto: ProviderProbeDto): Promise<ModelsResult> {
    return this.service.listModels(dto);
  }

  @Post('test')
  @HttpCode(200)
  test(@Body() dto: ProviderProbeDto): Promise<ProviderTestResult> {
    return this.service.test(dto);
  }
}
