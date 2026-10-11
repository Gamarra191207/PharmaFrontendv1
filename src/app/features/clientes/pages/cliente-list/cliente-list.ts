import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { UiService } from '../../../../core/services/ui.service';
import { mensajeError, mostrarError } from '../../../../core/utils/http-error';
import { PaginaResponse } from '../../../../core/models/pagina-response';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly ui = inject(UiService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  
  // PaginaciÃ³n y Orden
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');
  
  // Metadatos de la pÃ¡gina
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

  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter(c => {
      const nombreCompleto = `${c.nombres} ${c.apellidos}`.toLowerCase();
      return c.dni.includes(texto) || nombreCompleto.includes(texto);
    });
  });

  ngOnInit(): void {}

  cargar(pagina: number, tamanio: number, ordenarPor: string, direccion: 'asc' | 'desc'): void {
    this.cargando.set(true);
    this.error.set(null);
    
    this.clienteService.listar(pagina, tamanio, ordenarPor, direccion).subscribe({
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

          this.clientes.set(arr.slice(inicio, fin));
          this.totalElementos.set(arr.length);
          this.totalPaginas.set(Math.ceil(arr.length / tamanio) || 1);
          this.ultima.set(fin >= arr.length);
        } else {
          this.clientes.set(datos.contenido || []);
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

  eliminar(cliente: Cliente): void {
    this.ui.mostrarConfirmacion({
      titulo: 'Confirmar eliminaciÃ³n',
      mensaje: 'Â¿EstÃ¡s seguro de que deseas eliminar al cliente <strong>' + cliente.nombres + ' ' + cliente.apellidos + '</strong>?',
      confirmarTexto: 'SÃ­, eliminar',
      alConfirmar: () => {
        this.clienteService.eliminar(cliente.id).subscribe({
          next: () => this.cargar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion()),
          error: (err: HttpErrorResponse) => mostrarError(this.error, err)
        });
      }
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

