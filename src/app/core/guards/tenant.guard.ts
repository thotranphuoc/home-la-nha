import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

/** Blocks tenant from editing when is_locked; allows admin always. */
export const tenantEditGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (tenantService.isLocked()) {
    router.navigate(['/tenant']);
    return false;
  }
  return true;
};
