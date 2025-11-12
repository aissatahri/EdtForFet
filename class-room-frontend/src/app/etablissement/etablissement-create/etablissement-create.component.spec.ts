import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtablissementCreateComponent } from './etablissement-create.component';

describe('EtablissementCreateComponent', () => {
  let component: EtablissementCreateComponent;
  let fixture: ComponentFixture<EtablissementCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtablissementCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EtablissementCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
