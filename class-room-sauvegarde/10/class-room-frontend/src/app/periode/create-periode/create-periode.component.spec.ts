import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePeriodeComponent } from './create-periode.component';

describe('CreatePeriodeComponent', () => {
  let component: CreatePeriodeComponent;
  let fixture: ComponentFixture<CreatePeriodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePeriodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreatePeriodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
