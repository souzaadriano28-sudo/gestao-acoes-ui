import { TestBed } from '@angular/core/testing';

import { Acao } from './acao';

describe('Acao', () => {
  let service: Acao;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Acao);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
