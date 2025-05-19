import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutProductsComponent } from './about-products.component';

describe('AboutProductsComponent', () => {
  let component: AboutProductsComponent;
  let fixture: ComponentFixture<AboutProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
