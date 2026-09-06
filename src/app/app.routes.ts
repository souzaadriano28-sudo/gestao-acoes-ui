import { Routes } from '@angular/router';
import { AcaoComponent } from './components/acao/acao';
import { CarteiraComponent } from './components/carteira/carteira';
import { CorretoraComponent } from './components/corretora/corretora';
import { LoginPageComponent } from './auth/login-page/login-page';
import { authGuard } from './auth/auth.guard';
import { ProtectedLayoutComponent } from './auth/protected-layout/protected-layout';
import { FoundationPageComponent } from './shared/pages/foundation-page/foundation-page';
import { NotFoundComponent } from './shared/pages/not-found/not-found';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Acesso | Atlas Carteira' },
  {
    path: '', component: ProtectedLayoutComponent, canActivate: [authGuard], canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard', component: FoundationPageComponent, title: 'Dashboard | Atlas Carteira',
        data: {
          title: 'Dashboard',
          description: 'A visão consolidada será construída em uma próxima etapa, consumindo exclusivamente o read model do backend.',
          link: '/carteira', linkLabel: 'Ir para Carteira'
        }
      },
      { path: 'carteira', component: CarteiraComponent, title: 'Carteira | Atlas Carteira' },
      { path: 'acoes', component: AcaoComponent, title: 'Ações | Atlas Carteira' },
      { path: 'corretoras', component: CorretoraComponent, title: 'Corretoras | Atlas Carteira' },
      {
        path: 'operacoes', component: FoundationPageComponent, title: 'Operações | Atlas Carteira',
        data: {
          title: 'Operações',
          description: 'O fluxo de registros simulados permanecerá separado do Dashboard e será migrado em uma próxima etapa.'
        }
      },
      { path: '**', component: NotFoundComponent, title: 'Página não encontrada | Atlas Carteira' }
    ]
  }
];
