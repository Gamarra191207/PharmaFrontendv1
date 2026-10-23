import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-aviso-sesion',
  imports: [],
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css',
})
export class AvisoSesion {
  protected readonly auth = inject(AuthService);

  protected readonly tiempoFormateado = computed(() => {
    const s = this.auth.segundosRestantes();
    const minutos = Math.floor(s / 60);
    const segundos = s % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  });
}
