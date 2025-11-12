import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnneeScolaireCreateComponent } from './annee-scolaire-create.component';

describe('AnneeScolaireCreateComponent', () => {
  let component: AnneeScolaireCreateComponent;
  let fixture: ComponentFixture<AnneeScolaireCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnneeScolaireCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnneeScolaireCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
