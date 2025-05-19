import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterFacebookComponent } from './footer-facebook.component';

describe('FooterFacebookComponent', () => {
  let component: FooterFacebookComponent;
  let fixture: ComponentFixture<FooterFacebookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterFacebookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterFacebookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
