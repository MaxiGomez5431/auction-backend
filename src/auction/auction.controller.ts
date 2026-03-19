import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuctionService } from "./auction.service";
import { CreateAuctionDto } from "./dto/create-auction.dto";
import { UpdateAuctionDto } from "./dto/update-auction.dto";
import { AuthenticatedRequest, JwtGuard } from "src/auth/jwt/jwt.guard";

@Controller("auction")
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body() createAuctionDto: CreateAuctionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.auctionService.create(createAuctionDto, {
      id: req.user.id,
      isVerified: req.user.isVerified,
      isAdmin: req.user.isAdmin,
    });
  }

  @Get()
  findAll() {
    return this.auctionService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.auctionService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateAuctionDto: UpdateAuctionDto) {
    return this.auctionService.update(+id, updateAuctionDto);
  }

  @Delete(":id")
  @UseGuards(JwtGuard)
  remove(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.auctionService.remove(+id, {
      id: req.user.id,
      isAdmin: req.user.isAdmin,
    });
  }

  @Patch(":id/finish")
  @UseGuards(JwtGuard)
  finish(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.auctionService.finish(+id, {
      id: req.user.id,
      isAdmin: req.user.isAdmin,
    });
  }
}
