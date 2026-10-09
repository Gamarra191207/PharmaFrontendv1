import { Component, computed, inject, input, OnInit, signal, effect } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { UiService } from '../../../../core/services/ui.service';
import { mensajeError } from '../../../../core/utils/http-error';
import { normalizar } from '../../../../core/utils/texto';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly ui = inject(UiService);

  readonly categoriaId = input<string>();

  // Datos originales
  protected readonly productosData = signal<(Producto & { categoriaNombre?: string })[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);

  // Filtros
  protected readonly buscarControl = new FormControl('', { nonNullable: true });
  private readonly buscarTexto = toSignal(this.buscarControl.valueChanges, { initialValue: '' });
  protected readonly categoriaFiltro = signal<number | null>(null);

  protected readonly categoriaBuscadaNombre = computed(() => {
    const id = this.categoriaFiltro();
    if (!id) return '';
    const cat = this.categorias().find(c => c.id === id);
    return cat ? cat.nombre : '';
  });

  // Ordenamiento
  protected readonly ordenarPor = signal<keyof Producto>('id');
  protected readonly direccion = signal<'asc' | 'desc'>('desc');

  // Paginación
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);

  // Estados UI
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Derivados: aplicar filtros y nombre de categoría
  protected readonly productos = computed(() => {
    const filtro = this.categoriaFiltro();
    const lista = this.productosData();
    // Añadir el nombre de la categoría a cada producto para mostrarlo en el HTML
    const categorias = this.categorias();
    const mapeados = lista.map(p => {
      const cat = categorias.find(c => c.id === p.id_categoria);
      return { ...p, id: p.id || p.Id!, categoriaNombre: cat ? cat.nombre : 'Desconocida' };
    });

    if (filtro === null) return mapeados;
    return mapeados.filter(p => p.id_categoria === filtro);
  });

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.buscarTexto());
    let lista = this.productos();

    if (texto) {
      lista = lista.filter(p =>
        normalizar(p.nombre).includes(texto) ||
        normalizar(p.categoriaNombre || '').includes(texto)
      );
    }

    const campo = this.ordenarPor();
    const asc = this.direccion() === 'asc' ? 1 : -1;

    return lista.sort((a, b) => {
      const valA = a[campo];
      const valB = b[campo];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * asc;
      }
      if (valA < valB) return -1 * asc;
      if (valA > valB) return 1 * asc;
      return 0;
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.ceil(this.filtrados().length / this.tamanio())
  );

  protected readonly productosPaginados = computed(() => {
    const inicio = this.pagina() * this.tamanio();
    return this.filtrados().slice(inicio, inicio + this.tamanio());
  });

  constructor() {
    // Resetear a página 0 si cambian los filtros
    effect(() => {
      this.buscarTexto();
      this.categoriaFiltro();
      this.pagina.set(0);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const catIdStr = this.categoriaId();
    if (catIdStr) {
      this.categoriaFiltro.set(Number(catIdStr));
      this.tamanio.set(100);
    }

    // Cargar todo (el backend de productos no página)
    forkJoin({
      prods: this.productoService.listarTodo(),
      cats: this.categoriaService.listar(0, 100),
    }).subscribe({
      next: ({ prods, cats }) => {
        this.productosData.set(prods);
        this.categorias.set(cats.contenido);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  filtrarPorCategoria(idStr: string): void {
    this.categoriaFiltro.set(idStr ? Number(idStr) : null);
  }

  cambiarTamanio(tamanio: string): void {
    this.tamanio.set(Number(tamanio));
    this.pagina.set(0);
  }

  ordenar(campo: keyof Producto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.set(this.direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
  }

  indicadorOrden(campo: keyof Producto): string {
    if (this.ordenarPor() !== campo) return '';
    return this.direccion() === 'asc' ? '↑' : '↓';
  }

  irA(pagina: number): void {
    this.pagina.set(pagina);
  }

  eliminar(producto: Producto): void {
    this.ui.confirmar(`¿Dar de baja el producto "${producto.nombre}"?`, () => {
      this.productoService.eliminar(producto.id).subscribe({
        next: () => {
          this.productosData.update(lista =>
            lista.map(p => p.id === producto.id ? { ...p, estado: false } : p)
          );
          this.ui.mostrarToast('Producto dado de baja');
        },
        error: (err: HttpErrorResponse) => this.ui.mostrarToast(mensajeError(err), true),
      });
    });
  }
}
