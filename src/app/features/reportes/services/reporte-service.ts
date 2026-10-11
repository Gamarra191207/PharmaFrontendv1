import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaPorCategoria } from '../models/reporte.model';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  ventasPorCategoria(desde: string | null, hasta: string | null): Observable<VentaPorCategoria[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<VentaPorCategoria[]>(`${this.url}/ventas-por-categoria`, { params }).pipe(
      map(lista =>
        (lista || []).map(item => ({
          categoriaId: item.categoriaId,
          categoriaNombre: item.categoriaNombre || item.categoria || 'Sin categoría',
          cantidadVendida: Number(item.cantidadVendida ?? item.cantidad ?? 0),
          montoTotal: Number(item.montoTotal ?? item.total ?? 0),
        }))
      )
    );
  }
}
