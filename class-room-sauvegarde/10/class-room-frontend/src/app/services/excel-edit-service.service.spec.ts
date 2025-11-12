import { TestBed } from '@angular/core/testing';

import { ExcelEditServiceService } from './excel-edit-service.service';

describe('ExcelEditServiceService', () => {
  let service: ExcelEditServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelEditServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
