import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsenceStudentComponent } from './absence-student.component';

describe('AbsenceStudentComponent', () => {
  let component: AbsenceStudentComponent;
  let fixture: ComponentFixture<AbsenceStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbsenceStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AbsenceStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
