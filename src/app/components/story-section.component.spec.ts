import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorySectionComponent } from './story-section.component';

describe('StorySectionComponent', () => {
  let component: StorySectionComponent;
  let fixture: ComponentFixture<StorySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorySectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
