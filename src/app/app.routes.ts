import { Routes } from '@angular/router';
import { LoginPageComponent } from './auth/login-page/login-page';
import { authGuard } from './auth/auth.guard';
import { ProtectedLayoutComponent } from './auth/protected-layout/protected-layout';
import { AcaoComponent } from './components/acao/acao';
import { CarteiraComponent } from './components/carteira/carteira';
import { CorretoraComponent } from './components/corretora/corretora';
import { DashboardComponent } from './components/dashboard/dashboard';
import { OperacoesComponent } from './components/operacoes/operacoes';
import { NotFoundComponent } from './shared/pages/not-found/not-found';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Acesso | Atlas Carteira' },
  {
    path: '', component: ProtectedLayoutComponent, canActivate: [authGuard], canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | Atlas Carteira' },
      { path: 'carteira', component: CarteiraComponent, title: 'Carteira | Atlas Carteira' },
      { path: 'acoes', component: AcaoComponent, title: 'Ações | Atlas Carteira' },
      { path: 'corretoras', component: CorretoraComponent, title: 'Corretoras | Atlas Carteira' },
      { path: 'operacoes', component: OperacoesComponent, title: 'Operações | Atlas Carteira' },
      { path: '**', component: NotFoundComponent, title: 'Página não encontrada | Atlas Carteira' }
    ]
  }
];
