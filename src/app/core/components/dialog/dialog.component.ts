import { Component, inject } from '@angular/core';
import { UiService, DialogOptions } from '../../services/ui.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  template: `
    @if (ui.dialogActual(); as dialog) {
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>{{ dialog.titulo }}</h3>
          <p [innerHTML]="dialog.mensaje"></p>
          <div class="modal-acciones">
            @if (dialog.tipo === 'confirmacion') {
              <button class="btn" (click)="cancelar(dialog)">{{ dialog.cancelarTexto || 'Cancelar' }}</button>
            }
            <button class="btn btn-primary" [class.btn-peligro]="dialog.tipo === 'confirmacion'" (click)="confirmar(dialog)">
              {{ dialog.confirmarTexto || 'Aceptar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DialogComponent {
  ui = inject(UiService);

  cancelar(dialog: DialogOptions) {
    if (dialog.alCancelar) dialog.alCancelar();
    this.ui.cerrarDialog();
  }

  confirmar(dialog: DialogOptions) {
    if (dialog.alConfirmar) dialog.alConfirmar();
    this.ui.cerrarDialog();
  }
}
