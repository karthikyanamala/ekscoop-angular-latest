import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformCompareComponent } from './platform-compare.component';

describe('PlatformCompareComponent', () => {
  let component: PlatformCompareComponent;
  let fixture: ComponentFixture<PlatformCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformCompareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatformCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
