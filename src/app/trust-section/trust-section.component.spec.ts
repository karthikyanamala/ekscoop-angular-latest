import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrustSectionComponent } from './trust-section.component';

describe('TrustSectionComponent', () => {
  let component: TrustSectionComponent;
  let fixture: ComponentFixture<TrustSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrustSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
