import { Address, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        name: string;
        email: string;
        role: Role;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        addresses: Address[];
      };
    }
  }
}
