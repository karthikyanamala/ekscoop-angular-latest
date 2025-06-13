// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AdminAuthGuard } from './auth/admin-auth.guard'; // Import the guard

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/shop-list/shop-list.component').then(m => m.AdminShopListComponent),
    canActivate: [AdminAuthGuard] // 🔒 Guard added here
  },
  { path: 'shop-finder', loadComponent: () => import('./shop-list/shop-list.component').then(m => m.ShopListComponent) },
  { path: 'home', loadComponent: () => import('./homecomponent/homecomponent.component').then(m => m.HomecomponentComponent) },
  { path: 'contact-us', loadComponent: () => import('./footer-contact/footer-contact.component').then(m => m.FooterContactComponent) },
  { path: 'privacy', loadComponent: () => import('./footer-privacy/footer-privacy.component').then(m => m.FooterPrivacyComponent) },
  { path: 'terms-conditions', loadComponent: () => import('./footer-terms-and-conditions/footer-terms-and-conditions.component').then(m => m.FooterTermsAndConditionsComponent) },
  { path: 'product-list', loadComponent: () => import('./product-showcase/product-showcase.component').then(m => m.ProductShowcaseComponent) },
  { path: 'meal-section', loadComponent: () => import('./meal-sections/meal-sections.component').then(m => m.MealSectionsComponent) },
  { path: 'admin-login', loadComponent: () => import('./admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  {path:'partner-with-us',loadComponent:()=>import('./retail_components/partner-with-us/partner-with-us.component').then(m=>m.PartnerWithUsComponent)},
  { path: '**', redirectTo: 'home' }
];
