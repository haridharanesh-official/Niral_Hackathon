import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '@hackos/shared';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
