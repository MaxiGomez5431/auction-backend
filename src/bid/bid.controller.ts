import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { BidService } from "./bid.service";
import { CreateBidDto } from "./dto/create-bid.dto";
import { JwtGuard } from "src/auth/jwt/jwt.guard";

@Controller("bid")
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createBidDto: CreateBidDto, @Req() req: Request) {
    return this.bidService.create(createBidDto, req);
  }
}
