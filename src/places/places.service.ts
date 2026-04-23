import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.landmark.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch historical places.');
    }
  }

  // UPDATED: Now accepts images array and badgeImage
  async create(placeData: any) {
    const { name, municipality, description, latitude, longitude, images, badgeImage } = placeData;

    try {
      return await this.prisma.landmark.create({
        data: {
          name, municipality, description, latitude, longitude,
          images: images || [], // Default to empty array if none provided
          badgeImage: badgeImage || '', 
        },
      });
    } catch (error) {
      console.error('Database Insert Error:', error);
      throw new InternalServerErrorException('Failed to save the location.');
    }
  }

  // NEW: Update an existing place!
  async update(id: string, placeData: any) {
    const { name, municipality, description, latitude, longitude, images, badgeImage } = placeData;

    try {
      return await this.prisma.landmark.update({
        where: { id }, // Find the row by its ID
        data: {
          name, municipality, description, latitude, longitude,
          images: images || [], 
          badgeImage: badgeImage || '',
        },
      });
    } catch (error) {
      console.error('Database Update Error:', error);
      throw new InternalServerErrorException('Failed to update the location.');
    }
  }
}