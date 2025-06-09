import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAuth } from 'firebase/auth';

export const AdminAuthGuard: CanActivateFn = () => {
  // ✅ Move this inside to ensure it's called only after Firebase is initialized
  const auth = getAuth();
  const user = auth.currentUser;
  const router = inject(Router);

  if (user) {
    return true;
  } else {
    return router.createUrlTree(['/admin-login']);
  }
};
