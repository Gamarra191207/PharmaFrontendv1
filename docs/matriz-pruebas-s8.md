# Matriz de Pruebas de Dependencias

| ID | Operación y datos | Resultado esperado según regla | Resultado obtenido (SPA y HTTP) | Estado | Evidencia |
|---|---|---|---|---|---|
| A-01 | Registrar producto válido en una categoría activa. | 201; aparece en listado. | SPA envía petición correctamente, API responde 201 Created. | Pasa | A-01_spa.png |
| A-02 | Registrar producto sin elegir categoría. | SPA bloquea. Por API: 400. | SPA bloquea. Por API: 400 Bad Request con validationErrors. | Pasa | A-02_postman.png |
| A-03 | Registrar producto con categoriaId 999. | 404 «Categoria no encontrada...» | API responde 404 Not Found con mensaje correcto. | Pasa | A-03_postman.png |
| A-04 | Registrar producto en una categoría inactiva. | SPA no lo ofrece. Por API: 409. | SPA oculta categoría. Por API: **201 Created**. Permite registro. | **Falla** | A-04_postman.png |
| A-05 | Registrar producto con un nombre existente. | 409 «Ya existe un producto...» | API responde 409 Conflict. | Pasa | A-05_postman.png |
| A-06 | Registrar producto con precio 0 y stock -1. | SPA bloquea. API: 400. | SPA bloquea. Por API: **201 Created**. Backend no valida. | **Falla** | A-06_postman.png |
| C-01 | Cambiar categoría a otra activa. | 200; listado muestra nueva cat. | SPA lo permite. API: 200 OK. | Pasa | C-01_spa.png |
| C-02 | Cambiar categoría a una inactiva. | SPA impide. API: 409. | SPA impide con mensaje. API: **200 OK**. Permite el cambio. | **Falla** | C-02_postman.png |
| C-03 | Desactivar una categoría que tiene productos activos. | Debería impedir o advertir. | SPA y API permiten desactivarla sin validar (200 OK). | **Falla** | C-03_spa.png |
| C-04 | Dos pestañas (race condition) registrar prod en cat desactivada. | Producto no debe quedar inactivo. | SPA envía, API acepta (201). El producto queda en cat inactiva. | **Falla** | C-04_spa.png |
| B-01 | Dar de baja un producto activo. | 204; pasa a Inactivo. | SPA envía DELETE, API responde 204. | Pasa | B-01_spa.png |
| B-02 | Dar de baja otra vez el mismo producto. | 409 «ya se encuentra inactivo». | API responde **204 No Content**. Lo "vuelve" a dar de baja. | **Falla** | B-02_postman.png |
| B-03 | Eliminar una categoría sin productos. | 204; desaparece. | SPA envía DELETE, API responde 204. | Pasa | B-03_spa.png |
| B-04 | Eliminar una categoría con todos sus productos dados de baja. | Debería rechazar 409. | API rechaza con 409 Conflict (existsByCategoriaId). | Pasa | B-04_postman.png |
| **P-01** | **(Propio) Registrar con precio negativo** | SPA bloquea. API: 400. | API permite registro con 201 Created (precio < 0). | **Falla** | P-01_postman.png |
| **P-02** | **(Propio) Cambiar estado de activo a activo** | 409 "Ya está activo". | API devuelve 200 OK. | **Falla** | P-02_postman.png |
| **P-03** | **(Propio) Eliminar (DELETE) una categoría con id inexistente** | 404 Not Found. | API devuelve 404 Not Found. | Pasa | P-03_postman.png |
| **P-04** | **(Propio) Modificar nombre de un producto a vacío** | SPA bloquea. API: 400. | SPA bloquea. API 400 con validationErrors. | Pasa | P-04_postman.png |
