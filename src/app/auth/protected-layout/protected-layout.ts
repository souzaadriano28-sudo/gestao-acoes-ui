import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { AuthStore } from '../auth.store';

@Component({selector:'app-protected-layout',standalone:true,imports:[RouterOutlet,RouterLink,RouterLinkActive],templateUrl:'./protected-layout.html',styleUrl:'./protected-layout.css'})
export class ProtectedLayoutComponent {
  loggingOut=false;
  constructor(readonly store:AuthStore,private readonly auth:AuthService,private readonly router:Router){}
  logout():void{if(this.loggingOut)return;this.loggingOut=true;this.auth.logout().pipe(finalize(()=>this.loggingOut=false)).subscribe({next:()=>{this.store.setAnonymous();void this.router.navigate(['/login']);},error:()=>{this.store.setAnonymous();void this.router.navigate(['/login']);}});}
}
