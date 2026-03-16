import { Module } from '@nestjs/common';
import { ArtworkService } from './artwork.service';
import { ArtworkController } from './artwork.controller';

@Module({
  controllers: [ArtworkController],
  providers: [ArtworkService],
})
export class ArtworkModule {}
