import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CorretoraService } from './corretora';

describe('CorretoraService', () => {
  let service: CorretoraService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CorretoraService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista e cadastra corretoras pelo contrato atual', () => {
    service.listar().subscribe(value => expect(value.length).toBe(1));
    const list = http.expectOne('/api/corretoras');
    expect(list.request.method).toBe('GET');
    list.flush([{ id: 1, cnpj: '11222333000181' }]);

    service.salvar('11.222.333/0001-81', '01001000').subscribe();
    const create = http.expectOne('/api/corretoras');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ cnpj: '11.222.333/0001-81', cep: '01001000' });
    create.flush({ id: 1, cnpj: '11222333000181' }, { status: 201, statusText: 'Created' });
  });
});
