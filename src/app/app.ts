import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router'; // <-- 1. Adicione o RouterLink aqui

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink], // <-- 2. Coloque ele aqui dentro do array!
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'gestao-acoes-ui';
}
