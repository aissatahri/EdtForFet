import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaInstallButtonComponent } from './pwa-install-button.component';

describe('PwaInstallButtonComponent', () => {
  let component: PwaInstallButtonComponent;
  let fixture: ComponentFixture<PwaInstallButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaInstallButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PwaInstallButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
