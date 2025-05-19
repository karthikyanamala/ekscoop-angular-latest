import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlipPosterCardComponent } from './flip-poster-card.component';

describe('FlipPosterCardComponent', () => {
  let component: FlipPosterCardComponent;
  let fixture: ComponentFixture<FlipPosterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlipPosterCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlipPosterCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
