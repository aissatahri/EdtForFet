import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfesseurCreateComponent } from './professeur-create.component';

describe('ProfesseurCreateComponent', () => {
  let component: ProfesseurCreateComponent;
  let fixture: ComponentFixture<ProfesseurCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesseurCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfesseurCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
