import { TestBed } from '@angular/core/testing';

import { EtablissementprofesseurService } from './etablissementprofesseur.service';

describe('EtablissementprofesseurService', () => {
  let service: EtablissementprofesseurService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EtablissementprofesseurService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
