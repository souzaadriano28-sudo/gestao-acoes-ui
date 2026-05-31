import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Acao } from './acao';

describe('Acao', () => {
  let component: Acao;
  let fixture: ComponentFixture<Acao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Acao],
    }).compileComponents();

    fixture = TestBed.createComponent(Acao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
