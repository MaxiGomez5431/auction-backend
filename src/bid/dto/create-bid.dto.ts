import { IsNumber, IsPositive } from "class-validator";

export class CreateBidDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  auctionId: number;

  @IsNumber()
  userId: number;
}
