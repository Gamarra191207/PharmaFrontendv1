import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { VentaPorCategoria } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class VentasCategoria implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reporteService = inject(ReporteService);

  protected readonly filtros = this.fb.group({
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });

  protected readonly datos = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Monto mayor para calcular el ancho proporcional de la barra */
  protected readonly montoMayor = computed(() => {
    const items = this.datos();
    if (!items.length) return 1;
    const max = Math.max(...items.map(d => d.montoTotal));
    return max > 0 ? max : 1;
  });

  /** Fila de totales calculados reactivamente */
  protected readonly totalUnidades = computed(() =>
    this.datos().reduce((suma, d) => suma + d.cantidadVendida, 0)
  );

  protected readonly totalMonto = computed(() =>
    redondear(this.datos().reduce((suma, d) => suma + d.montoTotal, 0))
  );

  ngOnInit(): void {
    this.generar();
  }

  porcentajeBarra(monto: number): number {
    const mayor = this.montoMayor();
    return Math.min(100, Math.max(0, redondear((monto / mayor) * 100)));
  }

  generar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.reporteService.ventasPorCategoria(desde, hasta).subscribe({
      next: res => {
        this.datos.set(res);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiar(): void {
    this.filtros.reset();
    this.generar();
  }
}
