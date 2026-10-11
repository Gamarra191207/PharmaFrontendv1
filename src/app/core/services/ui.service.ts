import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  titulo: string;
  mensaje: string;
  tipo: 'alerta' | 'confirmacion';
  confirmarTexto?: string;
  cancelarTexto?: string;
  alConfirmar?: () => void;
  alCancelar?: () => void;
}

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly dialogActual = signal<DialogOptions | null>(null);

  mostrarConfirmacion(opciones: Omit<DialogOptions, 'tipo'>) {
    this.dialogActual.set({ ...opciones, tipo: 'confirmacion' });
  }

  mostrarAlerta(opciones: Omit<DialogOptions, 'tipo'>) {
    this.dialogActual.set({ ...opciones, tipo: 'alerta' });
  }

  cerrarDialog() {
    this.dialogActual.set(null);
  }
}
