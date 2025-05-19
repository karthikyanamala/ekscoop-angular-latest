import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterTermsAndConditionsComponent } from './footer-terms-and-conditions.component';

describe('FooterTermsAndConditionsComponent', () => {
  let component: FooterTermsAndConditionsComponent;
  let fixture: ComponentFixture<FooterTermsAndConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterTermsAndConditionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterTermsAndConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
