import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { NeonGuard } from '../auth/neon.guard';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  getAllPlaces() {
    return this.placesService.findAll();
  }

  @UseGuards(NeonGuard) 
  @Post()
  addPlace(@Body() placeData: any) {
    return this.placesService.create(placeData);
  }

  // NEW: The Edit Route!
  @UseGuards(NeonGuard)
  @Put(':id')
  updatePlace(@Param('id') id: string, @Body() placeData: any) {
    return this.placesService.update(id, placeData);
  }
}