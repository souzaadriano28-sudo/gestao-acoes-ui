import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CorretoraService } from './corretora';

describe('CorretoraService', () => {
  let service: CorretoraService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(CorretoraService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());

  it('preserva listagem e expõe os três contratos do cadastro progressivo', () => {
    service.listar().subscribe(value => expect(value.length).toBe(1));
    const list = http.expectOne('/api/corretoras'); expect(list.request.method).toBe('GET'); list.flush([{ id: 1, cnpj: '11222333000181' }]);
    service.consultarCnpj('11.222.333/0001-81').subscribe();
    const cnpj = http.expectOne('/api/corretoras/consultas/cnpj'); expect(cnpj.request.body).toEqual({ cnpj: '11.222.333/0001-81' }); cnpj.flush({});
    service.consultarCep('01001-000').subscribe();
    const cep = http.expectOne('/api/corretoras/consultas/cep'); expect(cep.request.body).toEqual({ cep: '01001-000' }); cep.flush({});
    service.salvar({ cnpj: '11222333000181', cep: '01001000', numero: '10' }).subscribe();
    const create = http.expectOne('/api/corretoras'); expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ cnpj: '11222333000181', cep: '01001000', numero: '10' }); create.flush({ id: 1, cnpj: '11222333000181' });
  });
});
