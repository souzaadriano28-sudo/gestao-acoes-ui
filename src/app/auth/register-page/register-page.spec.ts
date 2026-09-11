import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterPageComponent } from './register-page';

describe('RegisterPageComponent',()=>{
  let http:HttpTestingController;
  beforeEach(async()=>{await TestBed.configureTestingModule({imports:[RegisterPageComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]}).compileComponents();http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('exige o aceite dos termos antes de enviar o cadastro',()=>{
    const fixture=TestBed.createComponent(RegisterPageComponent);fixture.detectChanges();http.expectOne('/api/auth/csrf').flush({token:'x',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});
    const component=fixture.componentInstance;component.form.setValue({username:'atlas',email:'atlas@example.test',password:'valid-test-password',passwordConfirmation:'valid-test-password',termsAccepted:false});component.submit();
    expect(component.message()).toContain('Preencha');http.expectNone('/api/auth/register');
  });
  it('envia cadastro protegido por CSRF e apresenta erro generico',()=>{
    const fixture=TestBed.createComponent(RegisterPageComponent);fixture.detectChanges();http.expectOne('/api/auth/csrf').flush({token:'x',headerName:'X-CSRF-TOKEN',parameterName:'_csrf'});
    const component=fixture.componentInstance;component.form.setValue({username:'atlas',email:'atlas@example.test',password:'valid-test-password',passwordConfirmation:'valid-test-password',termsAccepted:true});component.submit();
    const register=http.expectOne('/api/auth/register');expect(register.request.body).toEqual(component.form.getRawValue());register.flush({code:'AUTHENTICATION_FAILED',message:'generic'},{status:401,statusText:'Unauthorized'});
    expect(component.message()).toBe('generic');expect(component.form.controls.password.value).toBe('');expect(component.form.controls.passwordConfirmation.value).toBe('');
  });
});
