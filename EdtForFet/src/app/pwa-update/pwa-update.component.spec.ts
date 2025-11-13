import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaUpdateComponent } from './pwa-update.component';

describe('PwaUpdateComponent', () => {
  let component: PwaUpdateComponent;
  let fixture: ComponentFixture<PwaUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaUpdateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PwaUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
