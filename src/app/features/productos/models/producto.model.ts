export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  estado: boolean;
  id_categoria: number; // backend uses id_categoria
  fecha_creacion: string;
  fecha_modificacion: string | null;
}

export interface ProductoRequest {
  nombre: string;
  precio: number;
  stock: number;
  estado: boolean;
  id_categoria: number; // backend uses id_categoria
}

/** Campos que el backend acepta en ordenarPor. */
export type OrdenProducto = 'id' | 'nombre' | 'precio' | 'stock';
export type Direccion = 'asc' | 'desc';
