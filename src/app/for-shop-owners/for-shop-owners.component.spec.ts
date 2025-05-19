import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForShopOwnersComponent } from './for-shop-owners.component';

describe('ForShopOwnersComponent', () => {
  let component: ForShopOwnersComponent;
  let fixture: ComponentFixture<ForShopOwnersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForShopOwnersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForShopOwnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
