import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterProtienGuidComponent } from './footer-protien-guid.component';

describe('FooterProtienGuidComponent', () => {
  let component: FooterProtienGuidComponent;
  let fixture: ComponentFixture<FooterProtienGuidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterProtienGuidComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterProtienGuidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
