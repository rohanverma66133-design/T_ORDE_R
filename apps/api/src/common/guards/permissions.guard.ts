import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const userId = request.user?.sub;
    const userRoles = request.user?.roles ?? [];

    // Super Admins automatically bypass permission checks
    if (userRoles.includes('SUPER_ADMIN' as any)) {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Authentication required for permission check',
      });
    }

    // Query user permissions from database
    const userPermissions = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const grantedCodes = new Set<string>();
    for (const ur of userPermissions) {
      for (const rp of ur.role.permissions) {
        grantedCodes.add(rp.permission.code);
      }
    }

    const hasAllRequired = requiredPermissions.every((perm) => grantedCodes.has(perm));
    if (!hasAllRequired) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `Missing required permission: ${requiredPermissions.join(', ')}`,
      });
    }

    return true;
  }
}
