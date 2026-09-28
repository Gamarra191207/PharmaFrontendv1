# Informe Técnico de Arquitectura: Módulo Clientes en PharmaSoft

## B1. Estructura del proyecto
La estructura de archivos dentro de `src/app` es la siguiente:
```text
src/app/
├── app.config.ts
├── app.routes.ts
├── app.ts
├── core/
│   ├── config/ (menu.ts)
│   ├── models/ (error-response.ts, pagina-response.ts)
│   └── utils/ (http-error.ts)
├── features/
│   ├── categorias/ (Módulo Categorías)
│   ├── clientes/ (Módulo Clientes)
│   │   ├── clientes.routes.ts
│   │   ├── models/ (cliente.model.ts)
│   │   ├── pages/
│   │   │   ├── cliente-form/ (cliente-form.ts, .html, .css)
│   │   │   └── cliente-list/ (cliente-list.ts, .html, .css)
│   │   └── services/ (cliente-service.ts)
│   └── inicio/
├── layout/
│   ├── header/
│   ├── main-layout/
│   └── sidebar/
└── shared/
    └── pages/ (no-encontrado/)
```
**Explicación de la arquitectura:**
- **`core/`**: Aloja las configuraciones globales, utilidades comunes y modelos genéricos (como `pagina-response.ts`) que se usan en toda la app.
- **`shared/`**: Almacena componentes o vistas transversales reutilizables, como la página de error 404.
- **`layout/`**: Define el esqueleto visual de la aplicación. Contiene el encabezado, el menú lateral y el layout principal que los une.
- **`features/`**: Separa la lógica de negocio por módulos independientes (Categorías, Clientes). Cada feature es autónomo y contiene sus propias rutas, modelos, vistas y servicios, facilitando escalar el sistema.

## B2. Mapa de rutas
| Ruta (URL) | Componente | ¿Ruta padre? | Tipo de carga | Título |
| :--- | :--- | :--- | :--- | :--- |
| `/inicio` | Inicio | MainLayout | loadComponent (diferida) | Inicio |
| `/categorias` | CategoriaList | MainLayout | loadChildren (diferida) | Categorías |
| `/categorias/nuevo` | CategoriaForm | MainLayout | component (directa en feature) | Nueva categoría |
| `/categorias/:id/editar` | CategoriaForm | MainLayout | component (directa en feature) | Editar categoría |
| `/clientes` | ClienteList | MainLayout | loadChildren (diferida) | Clientes |
| `/clientes/nuevo` | ClienteForm | MainLayout | component (directa en feature) | Nuevo cliente |
| `/clientes/:id/editar`| ClienteForm | MainLayout | component (directa en feature) | Editar cliente |
| `/**` | NoEncontrado | N/A | loadComponent (diferida) | Página no encontrada |

## B3. Responsabilidades
| Pieza | Tipo | Responsabilidad | Qué no hace |
| :--- | :--- | :--- | :--- |
| **ClienteService** | Servicio | Comunicarse con `/api/v1/clientes` y devolver Observables tipados. | No muestra mensajes al usuario ni manipula la navegación entre páginas o el estado UI. |
| **ClienteList** | Componente | Mostrar la tabla paginada de clientes, solicitar la baja lógica y manejar signals (cargando, errores). | No realiza peticiones `fetch` o `http` directamente; no edita ni crea clientes. |
| **ClienteForm** | Componente | Renderizar el formulario, capturar los datos, validarlos y pasarlos a `ClienteService` para crear/editar. | No gestiona la lógica de acceso a BD; no maneja listados ni paginación. |
| **Sidebar** | Componente | Iterar sobre `menu.ts` para mostrar los enlaces de navegación y marcar la ruta activa. | No define cuáles son las rutas de la aplicación ni controla el ruteo interno. |
| **MainLayout** | Componente | Estructurar el cascarón de la SPA (Grid) combinando Header, Sidebar y un `RouterOutlet`. | No dicta el contenido del módulo de negocio; solo actúa como marco. |

## B4. Flujo de una operación ("Registrar Cliente")
1. **Usuario**: Ingresa los datos en la UI y hace clic en "Registrar" en `ClienteForm`.
2. **ClienteForm (Componente)**: Verifica las validaciones locales. Si es válido, recopila el `ClienteRequest` y llama a `this.clienteService.crear(dto)`.
3. **ClienteService (Servicio)**: Inyecta `HttpClient` y realiza un `POST` a la API (`/api/v1/clientes`).
4. **Respuesta 201 (Éxito)**: El servicio devuelve el Observable resolviendo la respuesta. `ClienteForm` atrapa el `next`, detiene el signal de carga y usa `router.navigate(['/clientes'])` para regresar a la lista.
5. **Respuesta 409 (Duplicado - Variante)**: El backend responde con un error de conflicto (ej. DNI repetido). El Observable cae en `error`. `ClienteForm` procesa el `HttpErrorResponse` y actualiza el signal `error` y `erroresServidor`, mostrando inmediatamente el texto del backend en la pantalla.

## B5. Preguntas de revisión
1. **¿Cuántos archivos existentes tuviste que modificar para agregar el módulo Clientes? Nómbralos.**
   Solamente **dos (2)** archivos: `app.routes.ts` (para vincular las rutas de Clientes vía `loadChildren`) y `core/config/menu.ts` (para agregar el enlace visual en la barra lateral). Esto demuestra una excelente separación de preocupaciones; agregar nuevas funciones no rompe el código anterior.
2. **¿Por qué el componente de listado no usa HttpClient directamente? ¿Qué pasaría si mañana cambia la URL de la API?**
   Por el Principio de Responsabilidad Única. Si el listado usara `HttpClient`, la lógica de red estaría acoplada a la vista. Si mañana la URL cambia a `/api/v2/clientes`, solo modificamos `ClienteService`, dejando los componentes completamente intactos.
3. **¿Qué ventaja concreta tiene cargar Clientes con loadChildren?**
   Mejora drásticamente el tiempo de carga inicial de la SPA (Lazy Loading). En lugar de descargar todo el código del módulo Clientes en el paquete inicial de Javascript, Angular crea un *chunk* separado que el navegador solo descarga si el usuario efectivamente visita la ruta `/clientes`.
4. **¿Por qué el encabezado y el sidebar no se vuelven a dibujar al pasar de Categorías a Clientes?**
   Porque ambos residen dentro de `MainLayout`, el cual es el componente padre estático en el sistema de enrutamiento. Al cambiar de módulo, únicamente cambia el componente inyectado dentro del `<router-outlet />` del layout principal; el cascarón exterior permanece en memoria sin recargarse.
5. **Si en la sesión 11 algunos usuarios no deben ver «Clientes», ¿en qué archivo harías el cambio y por qué bastaría con ese punto?**
   Haría el cambio en `core/config/menu.ts`. Ya que el `Sidebar` dibuja las opciones iterando este archivo de manera dinámica, simplemente filtrando este arreglo según el rol del usuario sería suficiente para esconder el acceso sin modificar el HTML.
6. **¿Qué parte del código de Categorías y Clientes está duplicada? Propón una forma de reutilizarla.**
   Gran parte de la lógica de peticiones CRUD y control de paginación/signals está repetida en los servicios y componentes listado. Una forma de reutilizarlo sería creando un `GenericService<T>` que implemente los métodos `GET/POST/PUT/DELETE` genéricos y extenderlo.
7. **El buscador de Clientes solo filtra la página actual. Explica por qué ocurre y qué tendría que cambiar en el backend y en ClienteService para buscar entre todos los clientes.**
   Ocurre porque estamos usando un `computed` de Angular en el frontend para filtrar el arreglo en memoria que devolvió la API (el cual solo trae los 10 clientes de la página actual). Para buscar en la totalidad de datos reales, el Backend debe estar preparado para recibir un parámetro de búsqueda (`?filtro=texto`) en su Endpoint paginado, y el `ClienteService` tendría que añadir este valor en sus `HttpParams` al llamar a `listar()`.
