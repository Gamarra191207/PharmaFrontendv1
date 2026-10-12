import { Routes } from '@angular/router';
import { VentasCategoria } from './pages/ventas-categoria/ventas-categoria';

export const REPORTES_ROUTES: Routes = [
  { path: '', redirectTo: 'ventas-por-categoria', pathMatch: 'full' },
  { path: 'ventas-por-categoria', component: VentasCategoria, title: 'Reporte de ventas por categoría' },
];
