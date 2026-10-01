import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Public()
  @Get()
  findAll(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    return this.storesService.findAll(userLat, userLng);
  }
}
