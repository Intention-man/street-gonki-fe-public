import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragonFormComponent } from './vehicle-form.component';

describe('DragonFormComponent', () => {
  let component: DragonFormComponent;
  let fixture: ComponentFixture<DragonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragonFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DragonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
