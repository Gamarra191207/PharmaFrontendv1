import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError, mostrarError } from '../../../../core/utils/http-error';
import { UiService } from '../../../../core/services/ui.service';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly ui = inject(UiService);

  // Estado de la consulta paginada
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenProducto>('nombre');
  protected readonly direccion = signal<Direccion>('asc');

  protected readonly productosData = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  // Metadatos de la página
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly ultima = signal(true);

  constructor() {
    effect(() => {
      const p = this.pagina();
      const t = this.tamanio();
      const o = this.ordenarPor();
      const d = this.direccion();
      
      this.cargar(p, t, o, d);
    });
  }

  /** Filtra por categoría los productos de la página actual. */
  protected readonly productos = computed(() => {
    const filtro = this.categoriaFiltro();
    const lista = this.productosData();
    return filtro === null ? lista : lista.filter(p => p.categoriaId === filtro);
  });

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: datos => this.categorias.set(datos),
      error: (err: HttpErrorResponse) => mostrarError(this.error, err),
    });
  }

  cargar(pagina: number, tamanio: number, ordenarPor: OrdenProducto, direccion: Direccion): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService
      .listar(pagina, tamanio, ordenarPor, direccion)
      .subscribe({
        next: (datos: any) => {
          if (Array.isArray(datos)) {
            let arr = [...datos];
            
            arr.sort((a: any, b: any) => {
              const vA = (a[ordenarPor] || '').toString().toLowerCase();
              const vB = (b[ordenarPor] || '').toString().toLowerCase();
              if (vA < vB) return direccion === 'asc' ? -1 : 1;
              if (vA > vB) return direccion === 'asc' ? 1 : -1;
              return 0;
            });

            const inicio = pagina * tamanio;
            const fin = inicio + tamanio;

            this.productosData.set(arr.slice(inicio, fin));
            this.totalElementos.set(arr.length);
            this.totalPaginas.set(Math.ceil(arr.length / tamanio) || 1);
            this.ultima.set(fin >= arr.length);
          } else {
            this.productosData.set(datos.contenido || []);
            this.totalElementos.set(datos.totalElementos || 0);
            this.totalPaginas.set(datos.totalPaginas || 1);
            this.ultima.set(datos.ultima ?? true);
          }
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          mostrarError(this.error, err);
          this.cargando.set(false);
        },
      });
  }

  irA(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas()) {
      this.pagina.set(pagina);
    }
  }

  cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));
    this.pagina.set(0);
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.pagina.set(0);
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaFiltro.set(valor ? Number(valor) : null);
  }

  darDeBaja(producto: Producto): void {
    this.ui.mostrarConfirmacion({
      titulo: 'Confirmar eliminación',
      mensaje: '¿Estás seguro de que deseas dar de baja el producto <strong>' + producto.nombre + '</strong>?',
      confirmarTexto: 'Sí, dar de baja',
      alConfirmar: () => {
        this.productoService.darDeBaja(producto.id).subscribe({
          next: () => this.cargar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion()),
          error: (err: HttpErrorResponse) => mostrarError(this.error, err)
        });
      }
    });
  }
}
