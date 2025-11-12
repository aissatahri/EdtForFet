import { TestBed } from '@angular/core/testing';

import { DevoirEleveService } from './devoir-eleve.service';

describe('DevoirEleveService', () => {
  let service: DevoirEleveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevoirEleveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
