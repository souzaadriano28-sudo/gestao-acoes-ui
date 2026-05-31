import { Routes } from '@angular/router';
import { CarteiraComponent } from './components/carteira/carteira';
import { CorretoraComponent } from './components/corretora/corretora';
import { AcaoComponent } from './components/acao/acao';

export const routes: Routes = [
  // Rota padrão (quando abrir o localhost:4200 cai na carteira)
  { path: '', redirectTo: '/carteira', pathMatch: 'full' },

  // Nossas 3 rotas principais
  { path: 'carteira', component: CarteiraComponent },
  { path: 'corretoras', component: CorretoraComponent },
  { path: 'acoes', component: AcaoComponent }
];
