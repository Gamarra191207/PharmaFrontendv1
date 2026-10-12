# Informe de Hallazgos y Experiencia de Usuario — Sesión 9

**Proyecto:** PharmaSoft (Frontend Angular 22 & Backend Spring Boot 4)  
**Autor:** Gamarra  
**Curso:** Lenguaje de Programación II  
**Rama:** `feature/pruebas-reporte-ventas-gamarra`  
**Fecha:** Octubre 2026  

---

## C1. Resumen Ejecutivo de Pruebas

Se ejecutó una batería de **21 casos de prueba** (17 casos base establecidos en la guía y 4 casos propios) para verificar la robustez del flujo transaccional cabecera–detalle en ventas, los cálculos reactivos, las validaciones de stock, los mecanismos de confirmación, la consistencia de datos y el reporte comparativo por categoría.

### Resultados por Grupo de Prueba

| Grupo | Casos Ejecutados | Casos que Pasan | Casos que Fallan | % Éxito |
|---|:---:|:---:|:---:|:---:|
| **Buscadores** | 3 (B-01, B-02, P-01) | 3 | 0 | 100% |
| **Cálculos** | 5 (C-01, C-02, C-03, C-04, P-02) | 5 | 0 | 100% |
| **Validaciones** | 6 (V-01, V-02, V-03, V-04, V-05, P-03) | 5 | 1 | 83.3% |
| **Confirmación** | 3 (F-01, F-02, P-04) | 3 | 0 | 100% |
| **Mensajes & Concurrencia** | 2 (M-01, M-02) | 2 | 0 | 100% |
| **Impresión** | 1 (I-01) | 1 | 0 | 100% |
| **Consistencia de Datos** | 1 (X-01) | 1 | 0 | 100% |
| **TOTAL** | **21** | **20** | **1** | **95.2%** |

---

## C2. Ficha de Hallazgo (Bugs y Vulnerabilidades Encontradas)

### Ficha de Hallazgo H-01 (Caso V-05)

- **Identificador:** H-01
- **Caso relacionado:** V-05 (Validaciones)
- **Título:** La API de ventas permite registrar el mismo producto repetido en múltiples líneas de detalle sin consolidar ni rechazar.
- **Severidad:** Media (Integridad de datos y legibilidad de comprobantes).
- **Entorno:** Backend REST (`POST /api/ventas`).
- **Descripción del problema:**  
  Al emitir una solicitud HTTP directa a través de Postman enviando un cuerpo JSON donde el mismo `productoId` se repite en dos o más objetos del arreglo `detalles` (por ejemplo: `[{ "productoId": 1, "cantidad": 1 }, { "productoId": 1, "cantidad": 2 }]`), el backend acepta la transacción con código `201 Created`. Como resultado, se generan múltiples registros de detalle independientes en la base de datos para el mismo producto y se descuenta el stock en dos instrucciones separadas en lugar de consolidar la cantidad a 3.
- **Evidencia:** `V-05_postman.png` — Respuesta `201 Created` con dos objetos en `detalles` para el mismo identificador de producto.
- **Causa probable (Archivo y Método):**  
  - **Archivo:** `pe.edu.upeu.PharmaBackend.service.impl.VentaServiceImpl.java`
  - **Método:** `registrar(VentaRequestDTO request)`
  - **Explicación:** El servicio itera directamente sobre la lista de detalles sin verificar si existen identificadores duplicados (`productoId`) dentro de la colección enviada en el request.
- **Corrección propuesta en la capa correcta (Backend):**  
  En `VentaServiceImpl`, antes de abrir el bucle transaccional de descuento de stock, validar que no existan duplicados o agruparlos mediante Streams:
  ```java
  Set<Long> idsUnicos = new HashSet<>();
  for (DetalleVentaRequestDTO d : request.getDetalles()) {
      if (!idsUnicos.add(d.getProductoId())) {
          throw new ReglaNegocioException("No se permite registrar el mismo producto en líneas separadas. Consolide las cantidades.");
      }
  }
  ```

---

## C3. Preguntas de Análisis

### 1. ¿Por qué el total que calcula la SPA es solo un «total estimado»? ¿Qué ocurriría si el backend aceptara el total enviado por el navegador?
El total que calcula la SPA es catalogado como «total estimado» porque el navegador web es un cliente no seguro y manipulable por el usuario final (mediante DevTools, scripts inyectados o clientes HTTP como Postman). Su función en la SPA es puramente informativa para orientar al cajero antes de confirmar. Si el backend aceptara ciegamente el total calculado y enviado por el navegador, se crearía una vulnerabilidad crítica de alteración de precios (*tampering*): cualquier usuario malintencionado podría enviar un total arbitrario (por ejemplo, S/ 0.10 por productos de S/ 100.00) y el servidor registraría una venta legalmente válida por un importe falso, generando pérdidas económicas directas y descuadre contable. Por principio de seguridad *Zero Trust*, el backend siempre debe calcular de forma autoritativa el total y los subtotales consultando el precio vigente de cada producto en la base de datos.

### 2. En V-05, ¿debería la API aceptar el mismo producto en dos líneas? Justifica tu respuesta pensando en el descuento de stock y en el comprobante.
No, la API no debería aceptar el mismo producto en dos líneas independientes. Por un lado, a nivel de **comprobante y experiencia contable**, una boleta o factura de venta no debe fragmentar el mismo artículo en filas separadas, ya que confunde al cliente, dificulta las devoluciones y duplica innecesariamente los renglones de impresión. Por otro lado, a nivel de **descuento de stock y concurrencia**, procesar dos líneas del mismo producto en una única transacción ejecuta dos sentencias `UPDATE` sucesivas sobre la misma fila de la tabla `producto`. Esto provoca contención de bloqueos (*row locking*), eleva el riesgo de *deadlocks* en entornos de alta concurrencia y duplica el costo computacional frente a descontar la suma total consolidada en una sola operación atómica. Por tanto, la API debe rechazar el payload con `400 Bad Request` o consolidar internamente los detalles antes de persistirlos.

### 3. ¿Qué mejora de experiencia de usuario aplicarías después del 409 de M-01 para que el cajero no pierda tiempo?
Tras recibir el error `409 Conflict` (originado porque otra caja vendió las últimas unidades disponibles mientras el cajero confirmaba), la SPA actualmente desbloquea el formulario y muestra la alerta de texto. Para optimizar la experiencia de usuario y reducir el tiempo de atención en ventanilla, se deberían implementar tres acciones inmediatas:
1. **Refresco selectivo y transparente:** Consultar en segundo plano el nuevo stock real del producto en conflicto sin recargar toda la página ni reiniciar el cliente seleccionado.
2. **Resaltado contextual:** Marcar con un color de advertencia (naranja o amarillo) únicamente la fila del producto que se quedó sin existencias, indicando un mensaje claro como: *«Stock actualizado: solo queda 1 unidad disponible»* o *«Producto agotado»*.
3. **Acción de ajuste con un clic:** Mostrar un botón directo «Ajustar al stock disponible» que reduzca automáticamente la cantidad ingresada al saldo existente en ese momento (o elimine la línea si el stock llegó a 0), permitiendo que el cajero proceda a reconfirmar la venta en un solo segundo sin tener que consultar manualmente al sistema.

### 4. El reporte devuelve una lista sin paginación. ¿Por qué es razonable en este caso y no en la consulta de ventas?
Es completamente razonable no paginar el reporte de ventas por categoría debido a la naturaleza finita y acotada de los datos agregados. En un negocio farmacéutico o botica, el catálogo de categorías es una entidad de configuración que rara vez excede unas cuantas decenas de registros (típicamente entre 10 y 30 categorías activas). Como el reporte es un resumen agrupado (`GROUP BY categoria`), el servidor devolverá como máximo tantas filas como categorías existan, resultando en un payload minúsculo (pocos kilobytes) que el navegador puede renderizar de forma instantánea. Además, para calcular visualmente las barras comparativas proporcionales (`[style.width.%]`) respecto al monto más alto y sumar el total general de la empresa, el frontend necesita conocer el universo completo de los datos del período. 

Por el contrario, la consulta de ventas (`/ventas/buscar`) es transaccional y crece de manera ilimitada (cientos o miles de boletas por día). Traer todas las ventas sin paginar saturaría la memoria del servidor, consumiría un ancho de banda descomunal y congelaría el árbol DOM del navegador, haciendo indispensable la paginación servida desde la base de datos.
