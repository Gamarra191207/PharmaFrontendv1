export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
}

export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: 'ðŸ ' },
  { etiqueta: 'CategorÃ­as', ruta: '/categorias', icono: 'ðŸ—‚ï¸' },
  { etiqueta: 'Clientes', ruta: '/clientes', icono: 'ðŸ‘¥' },
  { etiqueta: 'Productos', ruta: '/productos', icono: '💊' },
];


