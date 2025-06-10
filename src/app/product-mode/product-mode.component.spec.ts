import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductModeComponent } from './product-mode.component';

describe('ProductModeComponent', () => {
  let component: ProductModeComponent;
  let fixture: ComponentFixture<ProductModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
