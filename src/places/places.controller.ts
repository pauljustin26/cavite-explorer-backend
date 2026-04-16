import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PlacesService } from './places.service';
import { JwtAuthGuard } from '../auth/auth.guard';
// import { AdminGuard } from '../auth/admin.guard'; // Uncomment when you add your AdminGuard!

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // Allow anyone (even players on the mobile app) to get the list of places
  @Get()
  getAllPlaces() {
    return this.placesService.findAll();
  }

  // ONLY Admins can add a new place!
  @UseGuards(JwtAuthGuard) 
  @Post()
  addPlace(@Body() placeData: any) {
    console.log('Received new place from Admin UI:', placeData);
    return this.placesService.create(placeData);
  }
}