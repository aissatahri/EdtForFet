import { TestBed } from '@angular/core/testing';

import { ClasseeleveService } from './classeeleve.service';

describe('ClasseeleveService', () => {
  let service: ClasseeleveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClasseeleveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
