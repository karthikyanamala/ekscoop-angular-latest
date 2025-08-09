// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AdminAuthGuard } from './auth/admin-auth.guard'; // Import the guard
import { QuestionResolver } from './community/question.resolver';
import { QuestionDetailComponent } from './community/question-detail/question-detail.component';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { TopQuestionsResolver } from './community/TopQuestionsResolver';
export const routes: Routes = [
  // {
  //   path: 'admin',
  //   loadComponent: () => import('./admin/shop-list/shop-list.component').then(m => m.AdminShopListComponent),
  //   canActivate: [AdminAuthGuard] // 🔒 Guard added here
  // },
  // { path: 'shop-finder', loadComponent: () => import('./shop-list/shop-list.component').then(m => m.ShopListComponent) },
  // { path: 'homepage', loadComponent: () => import('./homecomponent/homecomponent.component').then(m => m.HomecomponentComponent) },
  { path: 'privacy', loadComponent: () => import('./footer-privacy/footer-privacy.component').then(m => m.FooterPrivacyComponent) },
  { path: 'terms-conditions', loadComponent: () => import('./footer-terms-and-conditions/footer-terms-and-conditions.component').then(m => m.FooterTermsAndConditionsComponent) },
  { path: 'product-list', loadComponent: () => import('./product-showcase/product-showcase.component').then(m => m.ProductShowcaseComponent) },
  { path: 'meal-section', loadComponent: () => import('./meal-sections/meal-sections.component').then(m => m.MealSectionsComponent) },
  { path: 'admin-login', loadComponent: () => import('./admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  {path:'partner-with-us',loadComponent:()=>import('./retail_components/partner-with-us/partner-with-us.component').then(m=>m.PartnerWithUsComponent)},
  {path:'about-us',loadComponent:()=>import('./about/about.component').then(m=>m.AboutComponent)},
  {path:'contact-us',loadComponent:()=>import('./contact/contact.component').then(m=>m.ContactComponent)},
 {path:'home',loadComponent:()=>import('./home/homepage/homepage.component').then(m=>m.HomepageComponent)},
{path:'profile',loadComponent:()=>import('./userprofiles/userprofile/userprofile.component').then(m=>m.ProfileComponent)},
{path:'address',loadComponent:()=>import('./userprofiles/address/address.component').then(m=>m.AddressComponent)},
{path:'checkout',loadComponent:()=>import('./payment/checkout/checkout.component').then(m=>m.CheckoutComponent)},
{path:'orders',loadComponent:()=>import('./userprofiles/myorders/myorders.component').then(m=>m.MyOrdersComponent)},
{
  path: 'blog',
  loadComponent: () => import('./blog/blog/blog.component').then(m => m.BlogComponent)
},
{ path: 'blog/:slug', loadComponent: () => import('./blog/blog-detail/blog-detail.component').then(m => m.BlogDetailComponent), data: { renderMode: 'server' }},
{ path: 'comminity', loadComponent: () => import('./community/search-results/search-results.component').then(m => m.SearchResultsComponent),
   resolve: { topQuestions: TopQuestionsResolver },
  data: { renderMode: 'server' }
 },
{
 
    path: 'questions/:slug',
    component: QuestionDetailComponent,
    resolve: { question: QuestionResolver },
    data: { renderMode: 'server' }
  },

  { path: '**', redirectTo: 'home' }
];
