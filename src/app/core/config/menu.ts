export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
}

export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '🏠' },
  { etiqueta: 'Categorías', ruta: '/categorias', border: false, icono: '📁' },
  { etiqueta: 'Clientes', ruta: '/clientes', border: false, icono: '👥' },
  { etiqueta: 'Productos', ruta: '/productos', border: false, icono: '💊' },
  { etiqueta: 'Ventas', ruta: '/ventas', border: false, icono: '🧾' },
];
