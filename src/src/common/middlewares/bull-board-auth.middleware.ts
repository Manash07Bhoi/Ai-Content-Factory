import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../enums/role.enum';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.Authentication || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const decoded = this.jwtService.verify(token);

      if (decoded.role === Role.SUPER_ADMIN || decoded.role === Role.ADMIN) {
        next();
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
