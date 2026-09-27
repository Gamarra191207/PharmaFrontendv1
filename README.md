# PharmaSoft — Frontend (Sesión 7, LP II · UPeU)

SPA en Angular 22 que consume **PharmaBackend** real (Spring Boot 4 + Oracle). Implementa el
**Reto 01** (layout + navegación + CRUD de Categorías) y el **Reto 02** (módulo Clientes,
misma arquitectura).

## 1. Ajustes hechos contra tu backend real

Al revisar tu `PharmaBackend_final__2_.zip` se detectaron dos diferencias frente a lo que
describe la guía (que asume una versión "actualizada" con `/api/v1` y CORS por `application-dev.yaml`),
así que el frontend se ajustó a lo que tu backend **realmente** expone:

1. **Prefijo de la API**: tus controladores usan `@RequestMapping("/api/categorias")`,
   `"/api/clientes"`, etc. (sin `/v1`). `environment.ts` quedó en
   `apiUrl: 'http://localhost:8080/api'`.
2. **Validación de `nombre` en Categoría**: `CategoriaRequestDTO` exige `@Size(min = 5, max = 50)`
   (la guía decía 3). El formulario reactivo se ajustó a `minLength(5)`.
3. **Bug de CORS en tu backend**: `CorsConfig.java` tenía `allowedOrigins("https://localhost:4200")`
   (con **https**). El navegador sirve la SPA por **http**, así que todas las peticiones
   habrían sido bloqueadas por CORS. Se corrigió a `http://localhost:4200` (ver sección 2).

El resto del backend (`CategoriaController`, `CategoriaServiceImpl`, `GlobalExceptionHandler`,
`ErrorResponseDTO`) ya coincide exactamente con lo que el frontend espera: mismo shape de error
(`timestamp, status, error, message, path, validationErrors`), mismos códigos (404, 409, 400).

## 2. Requisitos previos

- Node.js 22.22.3 o 24.15 (LTS) — `node -v`
- Angular CLI 22.x — `ng version`
- PharmaBackend corregido (carpeta hermana entregada junto a este zip) corriendo en
  `http://localhost:8080`, con Oracle activo en `localhost:1522/FREEPDB1`.

## 3. Instalación

```bash
npm install
ng serve -o
```

La aplicación se abre en `http://localhost:4200`.

## 4. Estructura del proyecto

```
src/app/
├── core/              # config/menu.ts, models/error-response.ts, utils/http-error.ts
├── shared/pages/no-encontrado/
├── layout/            # header, sidebar, main-layout
├── features/
│   ├── inicio/
│   ├── categorias/    # models, services, pages (list/form), categorias.routes.ts
│   └── clientes/      # models, services, pages (list/form), clientes.routes.ts
├── app.config.ts
├── app.routes.ts
└── app.ts
```

- **core**: piezas únicas para toda la app (menú, modelo de error, utilidad de mensajes de error HTTP).
- **layout**: marco visual fijo (encabezado, sidebar, main-layout con `<router-outlet />`).
- **features**: un módulo por tabla de negocio, con sus propias rutas (`loadChildren`) y su propio
  servicio HTTP — agregar Clientes no tocó ni una línea de Categorías, que es justo la pregunta
  que abre la guía ("¿cómo organizarías la SPA para que agregar un módulo nuevo no obligue a
  reescribir los que ya funcionan?").

## 5. Módulo Categorías

- `CategoriaService` concentra las 5 operaciones HTTP contra `/api/categorias`.
- `CategoriaList`: estado en `signal` (datos, cargando, error, filtro) y un `computed` para el
  buscador; maneja carga, vacío y error; elimina con confirmación.
- `CategoriaForm`: nombre 5–50 caracteres, descripción ≤200 (igual que `CategoriaRequestDTO`);
  atiende registro y edición con el mismo componente.

## 6. Módulo Clientes (Reto 02)

Construido con la misma arquitectura, contra `/api/clientes` y replicando exactamente las
validaciones de `ClienteRequestDTO`:

- `dni`: obligatorio, 8 dígitos.
- `nombres` / `apellidos`: obligatorios, 2–100 caracteres.
- `email`: obligatorio, formato válido, máx. 150.
- `telefono`: opcional, si se llena debe tener 9 dígitos.
- `direccion`: opcional, máx. 250 caracteres.
- `estado`: booleano (Activo/Inactivo).

`ClienteService` concentra las 5 operaciones HTTP; `ClienteList` filtra por nombres, apellidos o
DNI; `ClienteForm` reutiliza el mismo patrón de errores de servidor (`erroresServidor`) para
mostrar, por ejemplo, un futuro 409 por DNI duplicado si tu `ClienteServiceImpl` lo valida.

## 7. Informe técnico sugerido (para el Reto 02)

1. **Organización de módulos**: un feature por tabla (`categorias`, `clientes`), cada uno con su
   `*.routes.ts`, su `*-service.ts` y sus `pages/*-list`, `*-form`.
2. **Rutas**: `app.routes.ts` solo conoce `loadChildren` hacia cada feature; cada feature define
   sus 3 rutas internas (`''`, `nuevo`, `':id/editar'`).
3. **Menú**: una entrada más en el arreglo `MENU` (`core/config/menu.ts`); el sidebar no cambió.
4. **Responsabilidades**: los componentes de página no llaman `HttpClient` directamente — solo
   sus servicios; `core/utils/http-error.ts` centraliza la traducción de errores HTTP para ambos
   módulos.

## 8. Pruebas sugeridas (paso 11 de la guía, ahora también para Clientes)

Con PharmaBackend y `ng serve` activos, abrir DevTools (F12) → pestaña Red, y verificar para
cada módulo: navegación, listado desde la API, filtro sin peticiones nuevas, validaciones de
formulario, error 409 al duplicar (nombre de categoría / si se valida DNI de cliente), alta,
edición, baja, error de conexión al detener el backend, ruta 404, y el botón ☰.
