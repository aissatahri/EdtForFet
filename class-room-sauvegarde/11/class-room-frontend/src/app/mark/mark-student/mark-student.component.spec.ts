import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkStudentComponent } from './mark-student.component';

describe('MarkStudentComponent', () => {
  let component: MarkStudentComponent;
  let fixture: ComponentFixture<MarkStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkStudentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MarkStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
