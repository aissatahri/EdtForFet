import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAbsenceComponent } from './list-absence.component';

describe('ListAbsenceComponent', () => {
  let component: ListAbsenceComponent;
  let fixture: ComponentFixture<ListAbsenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListAbsenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListAbsenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
