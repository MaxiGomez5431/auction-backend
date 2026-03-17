import { Module } from "@nestjs/common";
import { BidService } from "./bid.service";
import { BidController } from "./bid.controller";
import { AuthModule } from "src/auth/auth.module";
import { PrismaModule } from "src/prisma/prisma.module";

@Module({
  imports: [
    AuthModule, // ← Esto da acceso a los guards de autenticación
    PrismaModule,
  ],
  controllers: [BidController],
  providers: [BidService],
})
export class BidModule {}
