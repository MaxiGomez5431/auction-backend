import { IsNumber, IsPositive, IsDateString, Min } from "class-validator";

export class CreateAuctionDto {
  @IsNumber()
  @Min(1)
  artworkId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  startingPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  minimumIncrement: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
