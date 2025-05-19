import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhyProtienMattersComponent } from './why-protien-matters.component';

describe('WhyProtienMattersComponent', () => {
  let component: WhyProtienMattersComponent;
  let fixture: ComponentFixture<WhyProtienMattersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhyProtienMattersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhyProtienMattersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
