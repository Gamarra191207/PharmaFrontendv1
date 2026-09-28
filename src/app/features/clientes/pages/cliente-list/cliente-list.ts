import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { PaginaResponse } from '../../../../core/models/pagina-response';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  
  // Paginación y Orden
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');
  
  // Metadatos de la página
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly ultima = signal(true);

  constructor() {
    effect(() => {
      // Registrar las dependencias para que el effect vuelva a ejecutar cuando cambien
      const p = this.pagina();
      const t = this.tamanio();
      const o = this.ordenarPor();
      const d = this.direccion();
      
      this.cargar(p, t, o, d);
    });
  }

  protected readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter(c => {
      const nombreCompleto = `${c.nombres} ${c.apellidos}`.toLowerCase();
      return c.dni.includes(texto) || nombreCompleto.includes(texto);
    });
  });

  ngOnInit(): void {
    // La carga inicial se hace en el effect(), o podríamos forzarla aquí.
    // El effect() ya se gatillará inicialmente.
  }

  cargar(pagina: number, tamanio: number, ordenarPor: string, direccion: 'asc' | 'desc'): void {
    // Como effect() ya tiene tracking de los signals, es buena idea usar setTimeout o
    // usar untracked() si modificamos signals acá, pero al llamar set() no hay problema.
    this.cargando.set(true);
    this.error.set(null);
    
    this.clienteService.listar(pagina, tamanio, ordenarPor, direccion).subscribe({
      next: (datos: PaginaResponse<Cliente>) => {
        this.clientes.set(datos.contenido);
        this.totalElementos.set(datos.totalElementos);
        this.totalPaginas.set(datos.totalPaginas);
        this.ultima.set(datos.ultima);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  eliminar(cliente: Cliente): void {
    if (!confirm(`¿Dar de baja al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => {
        // Al ser baja lógica recargamos la página completa en lugar de quitarlo del arreglo
        this.cargar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion());
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  cambiarTamanio(nuevoTamanio: number): void {
    this.tamanio.set(nuevoTamanio);
    this.pagina.set(0);
  }

  ordenar(campo: string): void {
    if (this.ordenarPor() === campo) {
      this.direccion.set(this.direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
  }

  paginaAnterior(): void {
    if (this.pagina() > 0) {
      this.pagina.update(p => p - 1);
    }
  }

  paginaSiguiente(): void {
    if (!this.ultima()) {
      this.pagina.update(p => p + 1);
    }
  }
}
