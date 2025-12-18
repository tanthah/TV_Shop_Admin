import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get() {
    const data = await this.settingsService.get();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Body() body: UpdateSettingsDto) {
    const data = await this.settingsService.update(body as any);
    return { success: true, data };
  }
}
