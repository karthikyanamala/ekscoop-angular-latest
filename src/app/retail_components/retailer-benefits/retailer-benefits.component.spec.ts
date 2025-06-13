import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailerBenefitsComponent } from './retailer-benefits.component';

describe('RetailerBenefitsComponent', () => {
  let component: RetailerBenefitsComponent;
  let fixture: ComponentFixture<RetailerBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetailerBenefitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetailerBenefitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
