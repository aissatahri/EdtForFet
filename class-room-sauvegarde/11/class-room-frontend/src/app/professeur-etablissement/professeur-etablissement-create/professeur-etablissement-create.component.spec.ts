import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfesseurEtablissementCreateComponent } from './professeur-etablissement-create.component';

describe('ProfesseurEtablissementCreateComponent', () => {
  let component: ProfesseurEtablissementCreateComponent;
  let fixture: ComponentFixture<ProfesseurEtablissementCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesseurEtablissementCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfesseurEtablissementCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
