import { Routes } from '@angular/router';
import { CarteiraComponent } from './components/carteira/carteira';
import { CorretoraComponent } from './components/corretora/corretora';
import { AcaoComponent } from './components/acao/acao';
import { LoginPageComponent } from './auth/login-page/login-page';
import { authGuard } from './auth/auth.guard';
import { ProtectedLayoutComponent } from './auth/protected-layout/protected-layout';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Acesso | Atlas Carteira' },
  {
    path: '', component: ProtectedLayoutComponent, canActivate: [authGuard], canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'carteira', pathMatch: 'full' },
      { path: 'carteira', component: CarteiraComponent, title: 'Carteira | Atlas Carteira' },
      { path: 'corretoras', component: CorretoraComponent, title: 'Corretoras | Atlas Carteira' },
      { path: 'acoes', component: AcaoComponent, title: 'Ações | Atlas Carteira' }
    ]
  },
  { path: '**', redirectTo: '/carteira' }
];
