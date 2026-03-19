import { Module } from "@nestjs/common";
import { ArtworkService } from "./artwork.service";
import { ArtworkController } from "./artwork.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ArtworkController],
  providers: [ArtworkService],
})
export class ArtworkModule {}
