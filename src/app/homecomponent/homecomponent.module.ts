import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomecomponentComponent } from './homecomponent.component';

import { HerosectionComponent } from '../hero-section/hero-section.component';
import { AboutproductComponent } from '../about-products/about-products.component';
import { HowitworksComponent } from '../how-it-works/how-it-works.component';
import { ForshopownersComponent } from '../for-shop-owners/for-shop-owners.component';
import { WhyproteinmattersComponent } from '../why-protien-matters/why-protien-matters.component';



@NgModule({
    

  imports: [
    CommonModule,
    HomecomponentComponent,
    HerosectionComponent,
    AboutproductComponent,
    HowitworksComponent,
    ForshopownersComponent,
    WhyproteinmattersComponent
  ],exports: [HomecomponentComponent]
})
export class HomepageModule { }
