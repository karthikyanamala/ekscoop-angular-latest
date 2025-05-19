import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CornerBadgeComponent } from './corner-badge.component';

describe('CornerBadgeComponent', () => {
  let component: CornerBadgeComponent;
  let fixture: ComponentFixture<CornerBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CornerBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CornerBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
