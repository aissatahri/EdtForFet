import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteStudentComponent } from './note-student.component';

describe('NoteStudentComponent', () => {
  let component: NoteStudentComponent;
  let fixture: ComponentFixture<NoteStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NoteStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
