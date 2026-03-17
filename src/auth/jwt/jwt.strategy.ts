import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  isVerified: boolean;
  isAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "default",
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      isVerified: payload.isVerified,
      isAdmin: payload.isAdmin,
    };
  }
}
