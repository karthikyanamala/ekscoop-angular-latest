import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerBenefitsComponent } from './partner-benefits.component';

describe('PartnerBenefitsComponent', () => {
  let component: PartnerBenefitsComponent;
  let fixture: ComponentFixture<PartnerBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerBenefitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerBenefitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
