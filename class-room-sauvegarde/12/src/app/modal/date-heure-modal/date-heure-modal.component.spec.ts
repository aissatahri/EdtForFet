import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateHeureModalComponent } from './date-heure-modal.component';

describe('DateHeureModalComponent', () => {
  let component: DateHeureModalComponent;
  let fixture: ComponentFixture<DateHeureModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateHeureModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DateHeureModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
