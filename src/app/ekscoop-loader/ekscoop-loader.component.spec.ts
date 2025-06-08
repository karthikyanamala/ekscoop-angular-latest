import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EkscoopLoaderComponent } from './ekscoop-loader.component';

describe('EkscoopLoaderComponent', () => {
  let component: EkscoopLoaderComponent;
  let fixture: ComponentFixture<EkscoopLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EkscoopLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EkscoopLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
