import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { AuthStore } from '../auth.store';
import { safeReturnUrl } from '../auth.interceptor';

@Component({selector:'app-login-page',standalone:true,imports:[CommonModule,ReactiveFormsModule],templateUrl:'./login-page.html',styleUrl:'./login-page.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class LoginPageComponent implements OnInit {
  @ViewChild('errorBox') errorBox?:ElementRef<HTMLElement>;
  readonly form=new FormGroup({username:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(64)]}),password:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.maxLength(128)]})});
  readonly passwordVisible=signal(false); readonly pending=signal(false); readonly preparing=signal(true); readonly message=signal(''); readonly success=signal(false);
  private returnUrl='/dashboard';
  constructor(private readonly auth:AuthService,private readonly store:AuthStore,private readonly route:ActivatedRoute,private readonly router:Router){}
  ngOnInit():void{
    this.returnUrl=safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    if(this.route.snapshot.queryParamMap.get('reason')==='expired') this.message.set('Sua sessão expirou. Entre novamente para continuar.');
    this.auth.fetchCsrf().pipe(finalize(()=>this.preparing.set(false))).subscribe({error:()=>this.message.set('Não foi possível preparar o acesso. Tente novamente.')});
  }
  togglePassword():void{this.passwordVisible.update(value=>!value);}
  submit():void{
    if(this.pending())return;
    this.message.set('');this.success.set(false);
    if(this.form.invalid){this.form.markAllAsTouched();this.message.set('Informe usuário e senha para continuar.');this.focusError();return;}
    this.pending.set(true);const {username,password}=this.form.getRawValue();
    this.auth.login(username,password).pipe(finalize(()=>this.pending.set(false))).subscribe({
      next:session=>{this.store.setAuthenticated(session);this.success.set(true);setTimeout(()=>void this.router.navigateByUrl(this.returnUrl),250);},
      error:error=>{this.form.controls.password.setValue('');this.message.set(error?.status===429?'Acesso temporariamente indisponível. Aguarde alguns minutos e tente novamente.':'Não foi possível entrar. Verifique os dados ou tente novamente mais tarde.');this.focusError();}
    });
  }
  private focusError():void{setTimeout(()=>this.errorBox?.nativeElement.focus());}
}
