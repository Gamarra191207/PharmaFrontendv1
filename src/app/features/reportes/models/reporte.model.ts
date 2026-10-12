export interface VentaPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  cantidadVendida: number;
  montoTotal: number;
  // Propiedades opcionales para compatibilidad con la serialización del backend record
  categoria?: string;
  cantidad?: number;
  total?: number;
}
