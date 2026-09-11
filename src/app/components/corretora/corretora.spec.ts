import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CorretoraComponent } from './corretora';

describe('CorretoraComponent empty evidence state', () => {
  it('disables CVM revalidation without brokers and does not call the API', async () => {
    await TestBed.configureTestingModule({
      imports: [CorretoraComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    const fixture = TestBed.createComponent(CorretoraComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/corretoras').flush([]);
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('button')]
      .find((item: HTMLButtonElement) => item.textContent?.includes('Revalidar situação na CVM')) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-describedby')).toBe('refresh-evidence-description');
    expect(fixture.nativeElement.querySelector('#refresh-evidence-description')?.textContent)
      .toContain('situação regulatória das corretoras cadastradas');
    fixture.componentInstance.refreshEvidence();
    http.expectNone('/api/corretoras/evidencia-regulatoria/atualizar');
    http.verify();
  });
});

describe('CorretoraComponent', () => {
  let fixture: ComponentFixture<CorretoraComponent>; let http: HttpTestingController;
  const company = { cnpj: '11222333000181', razaoSocial: 'Corretora Teste', nomeFantasia: 'Teste',
    situacaoEmpresarial: 'ATIVA', cepSugerido: '01001000', cnaeCompativel: true, autorizadaPelaCvm: true,
    situacaoCvm: 'Em funcionamento normal', categoriaCvm: 'CORRETORAS', consultadaEm: '2026-09-07T15:00:00Z', mensagemCvm: null };
  const address = { cep: '01001000', logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CorretoraComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    fixture = TestBed.createComponent(CorretoraComponent); http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); http.expectOne('/api/corretoras').flush([]); fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('mantém labels, foco e etapas acessíveis', () => {
    expect(fixture.nativeElement.querySelector('label[for="broker-cnpj"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[aria-label="Etapas do cadastro"]')).toBeTruthy();
    const input = fixture.nativeElement.querySelector('#broker-cnpj') as HTMLInputElement; input.focus();
    expect(document.activeElement).toBe(input);
    expect(fixture.nativeElement.textContent).toContain('Nenhuma corretora cadastrada');
  });

  it('aplica máscara e bloqueia CNPJ inválido sem chamada', () => {
    const input = fixture.nativeElement.querySelector('#broker-cnpj') as HTMLInputElement;
    input.value = '11222333000181'; input.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(input.value).toBe('11.222.333/0001-81');
    fixture.componentInstance.form.controls.cnpj.setValue('123'); fixture.componentInstance.consultarCnpj();
    expect(fixture.componentInstance.form.controls.cnpj.hasError('format')).toBe(true);
  });

  it('executa o fluxo completo, usa sugestão somente após escolha e impede duplo envio', () => {
    const component = fixture.componentInstance;
    component.form.controls.cnpj.setValue('11.222.333/0001-81'); component.consultarCnpj();
    const cnpj = http.expectOne('/api/corretoras/consultas/cnpj'); expect(cnpj.request.body).toEqual({ cnpj: '11222333000181' }); cnpj.flush(company); fixture.detectChanges();
    expect(component.form.controls.cep.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Instituição autorizada pela CVM');
    component.usarCepSugerido(); expect(component.form.controls.cep.value).toBe('01001-000');
    component.consultarCep(); const cep = http.expectOne('/api/corretoras/consultas/cep'); expect(cep.request.body).toEqual({ cep: '01001000' }); cep.flush(address); fixture.detectChanges();
    component.form.controls.numero.setValue('10'); component.form.controls.complemento.setValue('Sala 2');
    component.adicionarCorretora(); component.adicionarCorretora();
    const creates = http.match('/api/corretoras'); expect(creates).toHaveLength(1);
    expect(creates[0].request.body).toEqual({ cnpj: '11222333000181', cep: '01001000', numero: '10', complemento: 'Sala 2' });
    creates[0].flush({ id: 1, cnpj: '11222333000181' }, { status: 201, statusText: 'Created' });
    http.expectOne('/api/corretoras').flush([]); expect(component.mensagemSucesso).toContain('validação empresarial');
  });

  it('invalida endereço consultado quando o CEP muda', () => {
    const component = fixture.componentInstance; component.form.controls.cnpj.setValue('11222333000181'); component.consultarCnpj();
    http.expectOne('/api/corretoras/consultas/cnpj').flush(company); component.form.controls.cep.setValue('01001-000'); component.consultarCep();
    http.expectOne('/api/corretoras/consultas/cep').flush(address); expect(component.podeCadastrar).toBe(true);
    const input = document.createElement('input'); input.value = '20040002'; component.onCepInput({ target: input } as unknown as Event);
    expect(component.endereco).toBeNull(); expect(component.podeCadastrar).toBe(false);
  });

  it('não libera endereço nem exibe afirmação de autorização quando CVM reprova', () => {
    const component = fixture.componentInstance; component.form.controls.cnpj.setValue('11222333000181'); component.consultarCnpj();
    http.expectOne('/api/corretoras/consultas/cnpj').flush({ ...company, autorizadaPelaCvm: false, situacaoCvm: 'Não localizada', categoriaCvm: null, mensagemCvm: 'CNPJ não localizado.' });
    fixture.detectChanges(); expect(component.podeConsultarCep).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('✓ Instituição autorizada pela CVM');
    expect(fixture.nativeElement.querySelector('#broker-cep')).toBeNull();
  });

  it('mantém erro consultável e botão de nova tentativa', () => {
    const component = fixture.componentInstance; component.form.controls.cnpj.setValue('11222333000181'); component.consultarCnpj();
    http.expectOne('/api/corretoras/consultas/cnpj').flush({ message: 'CVM indisponível' }, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]'); expect(alert.textContent).toContain('CVM indisponível');
    expect(alert.querySelector('button').textContent).toContain('Tentar novamente');
  });

  it.each(['NOT_CHECKED','VERIFIED','NOT_FOUND','INACTIVE','INCOMPATIBLE','STALE','UNAVAILABLE'] as const)('apresenta estado regulatório %s', status => {
    expect(fixture.componentInstance.evidenceLabel(status)).toBeTruthy();
  });
});
