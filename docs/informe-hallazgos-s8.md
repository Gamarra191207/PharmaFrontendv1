# Informe de Hallazgos - Sesión 8

## B1. Resumen de la ejecución
- **Casos ejecutados:** 18
- **Casos que pasan:** 8
- **Casos que fallan:** 10

**Por grupo:**
- **Altas:** 7 ejecutados (3 Pasan, 4 Fallan)
- **Cambios:** 5 ejecutados (1 Pasa, 4 Fallan)
- **Bajas:** 6 ejecutados (4 Pasan, 2 Fallan)

---

## B2. Fichas por hallazgo

### Hallazgo H-01
- **Caso relacionado:** A-04 y C-02
- **Descripción:** La API permite registrar o cambiar un producto hacia una categoría inactiva (200/201).
- **Severidad:** Alta. Genera inconsistencias de datos críticos.
- **Causa probable:** En ProductoServiceImpl, los métodos create y update no validan el estado de la categoría vinculada.
- **Corrección propuesta:** En el backend, inyectar el repositorio/servicio de Categoría y validar:
  `java
  Categoria cat = categoriaRepository.findById(dto.getId_categoria()).orElseThrow(...);
  if(!cat.getEstado()) throw new ReglaNegocioException("La categoría está inactiva");
  `

### Hallazgo H-02
- **Caso relacionado:** A-06 y P-01
- **Descripción:** La API permite registrar productos con precio 0, negativo y stock negativo (201 Created).
- **Severidad:** Alta. Pérdida económica e inventarios irreales.
- **Causa probable:** Faltan las anotaciones de validación mínima en ProductoRequestDTO (@Positive o @Min).
- **Corrección propuesta:** En ProductoRequestDTO (Backend), agregar @Min(0) a stock y @DecimalMin("0.01") a precio.

### Hallazgo H-03
- **Caso relacionado:** C-03 y C-04
- **Descripción:** La API permite desactivar una categoría que aún tiene productos activos en su haber.
- **Severidad:** Media-Alta. Deja productos huérfanos de su contexto y ocultos para la venta.
- **Causa probable:** En CategoriaServiceImpl.update(), no se revisa la existencia de productos activos al cambiar estado a false.
- **Corrección propuesta:** En update de Categoría:
  `java
  if (!dto.getEstado() && categoria.getEstado() && productoRepository.existsByCategoriaIdAndEstadoTrue(id)) {
      throw new ReglaNegocioException("No puede desactivar una categoría con productos activos");
  }
  `

### Hallazgo H-04
- **Caso relacionado:** B-02 y P-02
- **Descripción:** La API permite dar de baja un producto que ya estaba inactivo (204) o reactivarlo redundantemente.
- **Severidad:** Baja.
- **Causa probable:** En ProductoServiceImpl.delete(), no se valida si el estado ya era falso.
- **Corrección propuesta:** Lanzar un 409 ReglaNegocioException("El producto ya se encuentra inactivo") antes del save().

---

## B3. Cobertura de reglas
| Regla de dependencia | Dónde se valida hoy |
|---|---|
| Existencia de la categoría | API y SPA (Selectores y DTO Validation) |
| Categoría activa (para nuevo prod) | **Solo SPA** |
| Nombre único | API y SPA (Angular Forms Validator asíncrono no existe, pero API retorna 409) |
| No eliminar categoría con productos | API (existsByCategoriaId) |
| Baja lógica | API (UPDATE) |

---

## B4. Recomendación sobre el filtro por categoría
El filtro del listado de productos trabaja únicamente en la página actual sobre los datos cargados (	his.productosData). Si hay productos de la categoría buscada en la página 2, el usuario no los verá.
**Cambio propuesto:**
- **Endpoint:** GET /api/productos?categoriaId=X&pagina=0&tamanio=10
- **Spring Data (Repository):** Page<Producto> findByCategoriaId(Long id, Pageable p)
- **Frontend (Service):** Recibir categoriaId?: number como parámetro en listar() e inyectarlo en los HttpParams. Esto permite que la API aplique el WHERE real y devuelva la cuenta exacta de registros paginados.

---

## B5. Preguntas de análisis

**1. ¿Por qué no basta con que la SPA oculte las categorías inactivas? Relaciónalo con tus casos A-04 y C-02.**
La SPA actúa únicamente del lado del cliente. Un usuario avanzado puede inyectar peticiones manipuladas vía Postman (como en A-04 y C-02), o dos pestañas abiertas podrían crear una condición de carrera (C-04). Si el backend no valida la inactividad de la categoría (CategoriaServiceImpl), la base de datos se corromperá.

**2. Cuando se desactiva una categoría con productos activos (C-03), ¿qué debería pasar con esos productos?**
Debería impedirse la desactivación de la categoría, retornando un error (409 Conflict) o advirtiendo. Pensando en las ventas, desactivar los productos en cascada automáticamente podría ser peligroso, ya que detendría bruscamente las ventas de stock valioso. Forzar al usuario a reasignar los productos o desactivarlos manualmente es la política más segura.

**3. En B-04, el backend cuenta también los productos dados de baja al decidir si una categoría se puede eliminar. ¿Estás de acuerdo?**
Estoy totalmente de acuerdo. Los productos inactivos siguen existiendo en el historial y en las tablas transaccionales de ventas de meses pasados. Si se permitiera hacer un borrado físico de su categoría, se romperían las dependencias en la base de datos o los reportes históricos perderían la información de clasificación de aquellos productos.

**4. ¿Qué revela el caso C-04 sobre el momento en que se validan las dependencias? ¿Qué capa es la única que puede resolverlo?**
Revela que la SPA valida la información con los datos "del pasado" (los que tenía en memoria cuando cargó la pantalla). En un entorno concurrente, la única capa que tiene la autoridad y los datos transaccionales en tiempo real para hacer la validación final, justa y segura, es el Backend (Base de Datos / Servicios Spring Boot).

**5. Si mañana el backend corrige el hallazgo de A-04, ¿qué tendría que cambiar en la SPA? ¿Y qué seguiría igual?**
En la SPA no tendría que cambiar el diseño visual: seguiría ocultando la categoría en el selector (ya lo hace bien). Lo único que se añadiría es que, si llegase a ocurrir el escenario de C-04, el interceptor de la SPA atraparía elegantemente el error 409 del backend y usaría nuestro UiService para mostrar el mensaje "La categoría está inactiva" de forma amigable.
