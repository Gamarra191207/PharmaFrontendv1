# Matriz de Pruebas de la Venta — Sesión 9

**Proyecto:** PharmaSoft (SPA Angular) & PharmaBackend (Spring Boot)  
**Autor:** Gamarra  
**Rama:** `feature/pruebas-reporte-ventas-gamarra`  
**Fecha:** Octubre 2026  

---

| ID | Grupo | Precondición | Datos | Resultado esperado (Cálculo a mano) | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|:---:|---|
| **B-01** | Buscadores | Cliente inactivo y cliente activo con tilde registrados. | DNI inactivo; luego apellido sin tilde ("condori"). | El inactivo no aparece («Ningún cliente activo coincide…»); el activo sí aparece. | SPA filtra con `c.estado` y `coincide()` normaliza acentos; cliente inactivo no figura y activo se selecciona. | **Pasa** | B-01_spa.png |
| **B-02** | Buscadores | Catálogo con productos activos con stock. | Texto "para" o "analg"; pulsar Enter. | Se listan los que coinciden con precio y stock; Enter agrega el primero sin abrir el resumen. | Buscador despliega coincidencias; Enter ejecuta `agregarPrimero()` con `preventDefault()`, insertando la primera fila sin enviar el formulario. | **Pasa** | B-02_spa.png |
| **C-01** | Cálculos | Producto activo de S/ 12.50. | Cantidad = 3. | **Cálculo manual:** 12.50 × 3 = **37.50**. Subtotal: 37.50; Total: 37.50. | Subtotal S/ 37.50 y Total estimado S/ 37.50 calculados reactivamente por `computed`. | **Pasa** | C-01_spa.png |
| **C-02** | Cálculos | Producto activo de S/ 18.90. | Cantidad = 3. | **Cálculo manual:** 18.90 × 3 = **56.70**. Subtotal: 56.70 exacto, sin decimales extra. | La función `redondear(18.90 * 3)` genera exactamente S/ 56.70 sin residuo de punto flotante (`56.699999`). | **Pasa** | C-02_spa.png |
| **C-03** | Cálculos | 3 líneas agregadas: P1 (S/ 10.00 x 1), P2 (S/ 20.00 x 1), P3 (S/ 30.00 x 1). | Quitar la línea del medio (P2). | **Cálculo manual inicial:** 10 + 20 + 30 = 60.00.<br>**Tras quitar P2:** 10.00 + 30.00 = **40.00**. | `detalles.removeAt(1)` elimina la fila y el total reactivo disminuye automáticamente a S/ 40.00. | **Pasa** | C-03_spa.png |
| **C-04** | Cálculos | Formulario revisado con las dos líneas de C-03. | Confirmar venta de C-03. | **Cálculo manual:** 10.00 + 30.00 = **40.00**. El total del comprobante del servidor es igual al estimado. | POST 201 Created; comprobante en `/ventas/{id}` muestra total definitivo S/ 40.00 idéntico al estimado. | **Pasa** | C-04_spa.png |
| **V-01** | Validaciones | Formulario de venta recién abierto. | Clic en «Revisar venta» sin cliente ni líneas. | Mensajes de advertencia en cliente y detalle; no aparece modal de confirmación. | `markAllAsTouched()` activa mensajes de error «Busque y seleccione el cliente» y «Agregue al menos un producto...»; resumen bloqueado. | **Pasa** | V-01_spa.png |
| **V-02** | Validaciones | 1 producto en detalle. | Cantidad = 0; luego Cantidad = 2.5. | Mensaje de cantidad entera mayor que cero en ambos casos. | `Validators.min(1)` detecta 0 y `Validators.pattern(/^\d+$/)` detecta 2.5; se resalta el error y no permite avanzar. | **Pasa** | V-02_spa.png |
| **V-03** | Validaciones | Producto con stock disponible = 2. | Cantidad ingresada = 3. | Aviso «Supera el stock (2)» en la línea; «Revisar venta» no avanza. | La señal `excedeStock` se activa; se renderiza el aviso rojo y `revisar()` detiene el avance. | **Pasa** | V-03_spa.png |
| **V-04** | Validaciones | Producto X con cantidad 1 en la tabla. | Buscar Producto X en el buscador y presionar «+ Agregar». | El resultado indica «En la venta: 1»; la cantidad sube a 2 sin crear otra fila. | El buscador muestra badge «En la venta: 1»; al presionar agregar, incrementa a 2 la línea existente sin duplicar registros. | **Pasa** | V-04_spa.png |
| **V-05** | Validaciones | Producto activo con stock. | POST `/api/ventas` con mismo producto en dos líneas: `[{ id: 1, cant: 1 }, { id: 1, cant: 2 }]`. | Debería consolidar las líneas o responder 400 Bad Request por duplicidad. | **API responde 201 Created**. Permite duplicar el mismo producto en distintas líneas de detalle sin consolidar. | **Falla** | V-05_postman.png |
| **F-01** | Confirmación | Resumen de confirmación abierto. | Clic en botón «Volver». | Se cierra el modal de resumen; la pestaña Red no muestra ningún POST. | `confirmando.set(false)`; se cierra el diálogo interactivo sin emitir tráfico de red. | **Pasa** | F-01_spa.png |
| **F-02** | Confirmación | Resumen de confirmación abierto. | Doble clic rápido en «Confirmar venta». | Se registra una sola venta (el botón se deshabilita de inmediato). | `guardando.set(true)` deshabilita el botón instantáneamente con `[disabled]="guardando()"`; se dispara un único POST 201. | **Pasa** | F-02_spa.png |
| **M-01** | Mensajes | Producto con stock = 2. Pestañas A y B abiertas con 2 unidades en cola. | Pestaña A confirma venta; luego Pestaña B confirma venta. | La segunda pestaña recibe HTTP 409 con mensaje de stock; puede corregir sin recargar. | Pestaña A vende con éxito. Pestaña B recibe 409 Conflict ("Stock insuficiente"); la SPA captura el error, cierra la confirmación y permite ajustar cantidad. | **Pasa** | M-01_spa.png |
| **M-02** | Mensajes | Cliente inactivo registrado (ID = 4). | POST `/api/ventas` con `clienteId: 4`. | HTTP 409 «No se puede registrar una venta para un cliente inactivo». | API responde 409 Conflict con la excepción de regla de negocio esperada. | **Pasa** | M-02_postman.png |
| **I-01** | Impresión | Venta normal, venta anulada y consulta con filtros activos. | Clic en imprimir en comprobante, comprobante anulado y consulta. | Sin menú ni botones; comprobante con DNI y pie; la anulada con sello; la consulta con resumen de filtros. | Las reglas `@media print` ocultan la barra lateral y botones; muestran el sello de agua «ANULADA», DNI y cabecera de filtros. | **Pasa** | I-01_impresion.png |
| **X-01** | Consistencia | Venta confirmada de 2 unidades de Producto P. | Inspeccionar `/productos` y `/ventas`. | El stock de P bajó en 2 unidades; la venta aparece con el mismo total y número de ítems. | En la tabla de productos el stock disminuyó en 2; en la consulta figura la nueva venta con los mismos ítems y total exacto. | **Pasa** | X-01_spa.png |
| **P-01** | Buscadores *(Propio)* | Cliente con nombre compuesto activo. | Búsqueda `"  jOrGe   cOnDoRi "` con espacios y mayúsculas desordenadas. | `coincide()` debe tolerar espacios múltiples y case-insensitivity. | El filtro normaliza y ubica a "Condori Apaza, Jorge Luis" inmediatamente. | **Pasa** | P-01_spa.png |
| **P-02** | Cálculos *(Propio)* | Venta con 5 productos con precios decimales variados. | P1 (12.50x2), P2 (18.90x3), P3 (5.45x4), P4 (24.00x1), P5 (49.90x2). | **Cálculo manual:** 25.00 + 56.70 + 21.80 + 24.00 + 99.80 = **227.30**. | Total estimado y total de comprobante coinciden en S/ 227.30 exactos. | **Pasa** | P-02_spa.png |
| **P-03** | Validaciones *(Propio)* | Producto activo en catálogo. | POST `/api/ventas` enviando `cantidad: -5` en un detalle. | HTTP 400 Bad Request por violación de validación de bean. | API rechaza con 400 Bad Request y mensaje descriptivo de validación. | **Pasa** | P-03_postman.png |
| **P-04** | Confirmación *(Propio)* | Navegación manual en navegador. | Cargar ruta `/ventas/999999` (ID de venta inexistente). | Mensaje controlado en pantalla de recurso no encontrado sin congelamiento de UI. | Componente captura error 404 del backend y renderiza la alerta «Venta no encontrada con id: 999999». | **Pasa** | P-04_spa.png |

---

### Resumen Estadístico
- **Total casos ejecutados:** 21
- **Casos que pasan:** 20 (95.2%)
- **Casos que fallan:** 1 (4.8% — Caso V-05 en backend)
