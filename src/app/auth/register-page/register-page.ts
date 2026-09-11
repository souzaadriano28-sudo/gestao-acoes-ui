import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { AuthStore } from '../auth.store';
import { safeReturnUrl } from '../auth.interceptor';

@Component({selector:'app-register-page',standalone:true,imports:[CommonModule,ReactiveFormsModule,RouterLink],templateUrl:'./register-page.html',styleUrl:'./register-page.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class RegisterPageComponent implements OnInit {
  @ViewChild('errorBox') errorBox?:ElementRef<HTMLElement>;
  readonly form=new FormGroup({
    username:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(3),Validators.maxLength(64)]}),
    email:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.email,Validators.maxLength(255)]}),
    password:new FormControl('',{nonNullable:true,validators:[Validators.required,Validators.minLength(12),Validators.maxLength(128)]}),
    passwordConfirmation:new FormControl('',{nonNullable:true,validators:[Validators.required]}),
    termsAccepted:new FormControl(false,{nonNullable:true,validators:[Validators.requiredTrue]})
  });
  readonly passwordVisible=signal(false); readonly pending=signal(false); readonly preparing=signal(true); readonly message=signal(''); readonly success=signal(false);
  private returnUrl='/dashboard';
  constructor(private readonly auth:AuthService,private readonly store:AuthStore,private readonly route:ActivatedRoute,private readonly router:Router){}
  ngOnInit():void{
    this.returnUrl=safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    this.auth.fetchCsrf().pipe(finalize(()=>this.preparing.set(false))).subscribe({error:()=>this.message.set('Não foi possível preparar o acesso. Tente novamente.')});
  }
  togglePassword():void{this.passwordVisible.update(value=>!value);}
  submit():void{
    if(this.pending())return;
    this.message.set('');this.success.set(false);
    if(this.form.invalid){this.form.markAllAsTouched();this.message.set('Preencha os campos obrigatórios corretamente.');this.focusError();return;}
    if(this.form.value.password !== this.form.value.passwordConfirmation){this.message.set('As senhas não coincidem.');this.focusError();return;}
    this.pending.set(true);const value=this.form.getRawValue();
    this.auth.register(value).pipe(finalize(()=>this.pending.set(false))).subscribe({
      next:session=>{this.store.setAuthenticated(session);this.success.set(true);setTimeout(()=>void this.router.navigateByUrl(this.returnUrl),250);},
      error:error=>{this.form.controls.password.setValue('');this.form.controls.passwordConfirmation.setValue('');this.message.set(error?.error?.message || 'Não foi possível criar a conta. Verifique os dados ou tente novamente mais tarde.');this.focusError();}
    });
  }
  private focusError():void{setTimeout(()=>this.errorBox?.nativeElement.focus());}
}
