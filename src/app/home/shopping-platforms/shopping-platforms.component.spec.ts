import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShoppingPlatformsComponent } from './shopping-platforms.component';

describe('ShoppingPlatformsComponent', () => {
  let component: ShoppingPlatformsComponent;
  let fixture: ComponentFixture<ShoppingPlatformsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingPlatformsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShoppingPlatformsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
