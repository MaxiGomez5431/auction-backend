import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ArtworkModule } from "./artwork/artwork.module";
import { AuctionModule } from "./auction/auction.module";

@Module({
  imports: [PrismaModule, ArtworkModule, AuctionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
