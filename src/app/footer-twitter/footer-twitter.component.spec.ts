import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterTwitterComponent } from './footer-twitter.component';

describe('FooterTwitterComponent', () => {
  let component: FooterTwitterComponent;
  let fixture: ComponentFixture<FooterTwitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterTwitterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterTwitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
