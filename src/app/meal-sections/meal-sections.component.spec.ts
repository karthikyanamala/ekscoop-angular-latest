import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealSectionsComponent } from './meal-sections.component';

describe('MealSectionsComponent', () => {
  let component: MealSectionsComponent;
  let fixture: ComponentFixture<MealSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
