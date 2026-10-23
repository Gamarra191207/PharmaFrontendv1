import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Permiso, Sesion, UsuarioPerfil } from './auth.model';

/** Clave con la que se guarda la sesión en sessionStorage. */
const CLAVE_SESION = 'pharmasoft.sesion';

/**
 * Única fuente de verdad sobre la sesión del usuario.
 *
 * - La sesión vive en un signal: el menú, el encabezado y los guards
 *   reaccionan solos cuando cambia.
 * - Se guarda en sessionStorage para sobrevivir a una recarga (F5), pero
 *   se borra al cerrar el navegador: la botica usa computadoras compartidas.
 * - Un temporizador cierra la sesión cuando el token vence.
 * - Un contador por segundo alerta cuando faltan 120 segundos o menos.
 */
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private intervaloContador?: ReturnType<typeof setInterval>;

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

  readonly segundosRestantes = signal<number>(0);
  readonly avisoOculto = signal<boolean>(false);
  readonly porVencer = computed(() =>
    this.autenticado() && this.segundosRestantes() > 0 && this.segundosRestantes() <= 120
  );

  constructor() {
    const sesion = this.sesionActual();
    if (sesion) {
      this.programarExpiracion(sesion);
      this.iniciarContador(sesion);
    }
  }

  /** Envía las credenciales; si son correctas, guarda la sesión. */
  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      map(r => ({
        token: r.token,
        expiraEn: Date.now() + r.expiraEnSegundos * 1000,
        username: r.username,
        nombreCompleto: r.nombreCompleto,
        roles: r.roles,
        permisos: r.permisos,
      })),
      tap(sesion => this.iniciar(sesion)),
    );
  }

  /** Obtiene los datos del usuario autenticado desde el servidor (GET /auth/me). */
  obtenerPerfil(): Observable<UsuarioPerfil> {
    return this.http.get<UsuarioPerfil>(`${this.url}/me`);
  }

  /**
   * Cierra la sesión y vuelve al login.
   * Si la causa es la expiración, el login lo avisa y, tras entrar de nuevo,
   * regresa a la página donde estaba el usuario.
   */
  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    clearTimeout(this.temporizador);
    clearInterval(this.intervaloContador);
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesionActual.set(null);
    this.segundosRestantes.set(0);
    this.avisoOculto.set(false);

    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    if (volverA && volverA !== '/login') queryParams['returnUrl'] = volverA;
    this.router.navigate(['/login'], { queryParams });
  }

  /** Oculta el aviso de expiración hasta la siguiente sesión. */
  ocultarAviso(): void {
    this.avisoOculto.set(true);
  }

  /** Token vigente o null si no hay sesión o ya venció. */
  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  /** true si el usuario tiene el permiso (lee un signal: es reactivo). */
  tienePermiso(permiso: Permiso): boolean {
    return this.sesionActual()?.permisos.includes(permiso) ?? false;
  }

  private iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionActual.set(sesion);
    this.avisoOculto.set(false);
    this.programarExpiracion(sesion);
    this.iniciarContador(sesion);
  }

  private iniciarContador(sesion: Sesion): void {
    clearInterval(this.intervaloContador);
    const actualizar = () => {
      const seg = Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000));
      this.segundosRestantes.set(seg);
    };
    actualizar();
    this.intervaloContador = setInterval(actualizar, 1000);
  }

  private programarExpiracion(sesion: Sesion): void {
    clearTimeout(this.temporizador);
    const restante = sesion.expiraEn - Date.now();
    this.temporizador = setTimeout(
      () => this.cerrarSesion('expirada', this.router.url),
      Math.max(restante, 0),
    );
  }

  /** Recupera la sesión tras recargar la página; descarta la vencida o dañada. */
  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion = JSON.parse(texto) as Sesion;
      if (!sesion.token || Date.now() >= sesion.expiraEn) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}
