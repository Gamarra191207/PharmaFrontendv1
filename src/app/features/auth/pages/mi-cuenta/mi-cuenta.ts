import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth-service';
import { Permiso, UsuarioPerfil } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

interface ModuloPermisos {
  nombre: string;
  icono: string;
  permisos: { codigo: Permiso; etiqueta: string }[];
}

@Component({
  selector: 'app-mi-cuenta',
  imports: [DatePipe],
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta implements OnInit {
  protected readonly auth = inject(AuthService);

  protected readonly perfil = signal<UsuarioPerfil | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly modulos: ModuloPermisos[] = [
    {
      nombre: 'Catálogo',
      icono: '💊',
      permisos: [
        { codigo: 'CATALOGO_LEER', etiqueta: 'Lectura de productos y categorías' },
        { codigo: 'CATALOGO_ESCRIBIR', etiqueta: 'Creación, edición y baja en catálogo' },
      ],
    },
    {
      nombre: 'Clientes',
      icono: '👥',
      permisos: [
        { codigo: 'CLIENTES_LEER', etiqueta: 'Consulta de clientes' },
        { codigo: 'CLIENTES_ESCRIBIR', etiqueta: 'Registro y edición de clientes' },
      ],
    },
    {
      nombre: 'Ventas',
      icono: '🧾',
      permisos: [
        { codigo: 'VENTAS_LEER', etiqueta: 'Consulta e impresión de comprobantes' },
        { codigo: 'VENTAS_REGISTRAR', etiqueta: 'Registro y confirmación de ventas' },
      ],
    },
    {
      nombre: 'Reportes',
      icono: '📊',
      permisos: [
        { codigo: 'REPORTES_VER', etiqueta: 'Acceso a estadísticas y reportes gerenciales' },
      ],
    },
    {
      nombre: 'Usuarios y Seguridad',
      icono: '🛡️',
      permisos: [
        { codigo: 'USUARIOS_ADMINISTRAR', etiqueta: 'Administración de usuarios y asignación de roles' },
      ],
    },
  ];

  /** Detecta si los permisos obtenidos del servidor difieren de los guardados en la sesión */
  protected readonly permisosCambiaron = computed(() => {
    const p = this.perfil();
    const s = this.auth.sesion();
    if (!p || !s) return false;
    const pSet = new Set(p.permisos);
    const sSet = new Set(s.permisos);
    if (pSet.size !== sSet.size) return true;
    for (const perm of pSet) {
      if (!sSet.has(perm)) return true;
    }
    return false;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.auth.obtenerPerfil().subscribe({
      next: datos => {
        this.perfil.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  tienePermiso(codigo: Permiso): boolean {
    return this.perfil()?.permisos.includes(codigo) ?? false;
  }
}
