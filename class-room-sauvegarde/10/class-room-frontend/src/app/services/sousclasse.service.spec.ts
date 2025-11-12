import { TestBed } from '@angular/core/testing';

import { SousclasseService } from './sousclasse.service';

describe('SousclasseService', () => {
  let service: SousclasseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SousclasseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
