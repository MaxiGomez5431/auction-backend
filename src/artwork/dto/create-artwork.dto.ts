import { IsString, IsOptional } from "class-validator";

export class CreateArtworkDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
