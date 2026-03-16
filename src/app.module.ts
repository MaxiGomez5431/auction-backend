import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ArtworkModule } from './artwork/artwork.module';

@Module({
  imports: [PrismaModule, ArtworkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
