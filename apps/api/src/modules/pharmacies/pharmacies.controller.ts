import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/auth.decorators';
import { PharmaciesService } from './pharmacies.service';

@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  @Public()
  @Get()
  findAll(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    return this.pharmaciesService.findAll(userLat, userLng);
  }
}
