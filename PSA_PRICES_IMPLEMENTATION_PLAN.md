# TCG Wallet — Plan de implementación de precios PSA

Documento técnico de trabajo para incorporar precios de cartas Pokémon graduadas por PSA sin alterar los precios normales actuales.

## Objetivo

Mantener separados los dos mercados:

- Precios normales actuales: `card_prices`.
- Precios graduados: `graded_card_prices`.
- Empresa de grading: `PSA` dentro de `grading_companies`.

El sistema no debe calcular ni inventar un precio PSA a partir del precio normal, de otro grado o de otra empresa. Si no existe un precio PSA exacto, la interfaz debe mostrar que el dato no está disponible.

## Situación actual

Avance de esta implementación: PSA ya está registrado en la base de datos mediante una migration idempotente y los gráficos del frontend aplican la ventana de un año con fallback histórico. La obtención automática de precios PSA continúa bloqueada hasta seleccionar una fuente autorizada.

- La sincronización de Pokémon TCG API procesa precios normales.
- El backend ya tiene endpoints para listar, consultar, agregar e importar precios graded.
- La importación batch existente es `POST /api/sync/graded-prices` y requiere permisos de administrador.
- La base de datos contiene la empresa fixture de desarrollo, la empresa PSA registrada y precios graded de prueba.
- El modelo graded ya permite guardar `card_id`, `grading_company_id`, `grade`, `price`, `currency`, `source` y `recorded_at`.
- PSA dispone de un Price Guide, pero su API pública documentada está orientada a verificación de certificaciones, no a una descarga directa de precios.

Por eso la integración automática queda condicionada a seleccionar una fuente PSA real y disponer de sus credenciales o archivo autorizado.

## Decisión de arquitectura

No se agregará un campo fijo `psaPrice` dentro de las respuestas de precios normales. La empresa y el grado forman parte del dato y deben conservarse:

```json
{
  "cardId": "uuid",
  "gradingCompanyId": "uuid-de-psa",
  "grade": 10,
  "price": 325.5,
  "currency": "USD",
  "source": "psa-price-guide",
  "recordedAt": "2026-08-16T12:00:00.000Z"
}
```

Esto permite añadir en el futuro BGS, CGC u otra empresa sin cambiar el contrato principal.

## Fases de implementación

### Fase 0 — Contrato y reglas de negocio

Estado: **Pendiente**

- Confirmar la fuente de precios PSA: API autorizada, CSV autorizado o importación manual.
- Definir el nombre canónico de la empresa: `PSA`.
- Definir grados aceptados: `0` a `10`, incluyendo medios grados si la fuente los entrega.
- Definir moneda principal: `USD`.
- Definir identificador de fuente, por ejemplo `psa-price-guide` o `pricecharting`.
- Documentar que un precio PSA solo es válido cuando coinciden carta, empresa y grado.
- Definir la política de datos antiguos, duplicados y precios sin fecha.

### Fase 1 — Empresa PSA y configuración segura

Estado: **Parcial: PSA registrada; configuración del proveedor pendiente**

- Crear o garantizar la empresa `PSA` mediante un seed idempotente.
- No guardar tokens en el frontend ni en el repositorio.
- Agregar al backend únicamente las variables necesarias en `.env.example`, sin valores reales.
- Validar la configuración con `check-config`.
- Registrar en logs el proveedor y el resultado de una sincronización, nunca credenciales.

Salida esperada: PSA existe una sola vez y tiene un identificador estable para todas las relaciones.

### Fase 2 — Adaptador de fuente PSA

Estado: **Bloqueado externamente hasta elegir proveedor**

- Crear una integración aislada, por ejemplo `integrations/psa` o `integrations/graded-prices`.
- Separar la obtención externa del servicio de importación interno.
- Normalizar cada registro al contrato interno:

  ```text
  cardId
  gradingCompanyId
  grade
  price
  currency
  source
  recordedAt
  ```

- Implementar timeout, reintentos limitados, rate limit y cancelación.
- No permitir que una respuesta incompleta sobrescriba datos válidos.
- Guardar un reporte de cartas no encontradas o con baja confianza de mapeo.

### Fase 3 — Mapeo de cartas

Estado: **Pendiente**

- Priorizar el mapeo por `set.external_id` + `card.external_id`.
- Usar nombre, número y set solo como estrategia secundaria.
- Rechazar coincidencias ambiguas en lugar de asociar el precio a una carta incorrecta.
- Crear un reporte con:
  - registros importados;
  - registros omitidos;
  - cartas sin coincidencia;
  - duplicados;
  - errores de validación.
- Añadir pruebas para cartas con nombres repetidos entre sets.

### Fase 4 — Persistencia e importación

Estado: **En progreso: endpoint batch e importador manual implementados**

- Reutilizar `POST /api/sync/graded-prices` para lotes pequeños o controlados.
- Crear un script administrativo para importar un archivo PSA normalizado: `pnpm import:psa -- ruta/al/archivo.json`.
- Permitir validar el archivo sin escribir: `pnpm import:psa -- --dry-run ruta/al/archivo.json`.
- El archivo debe contener `prices` con `cardId`, `grade`, `price`, `currency`, `source` y opcionalmente `recordedAt`; el script asigna siempre la empresa `PSA`.
- Procesar lotes de hasta 1000 registros, respetando la validación actual.
- Insertar snapshots con `recorded_at` para conservar historial.
- Evitar duplicados exactos por carta, empresa, grado, precio, moneda, fuente y timestamp.
- Reforzar la regla con el índice único `uq_graded_card_prices_snapshot` en PostgreSQL.
- Usar transacción por lote o por bloque para que una importación parcial sea detectable.
- Mantener el endpoint protegido para administradores.

### Fase 5 — Consultas y valoración de colección

Estado: **En progreso: valoración exacta y prueba PostgreSQL implementadas; datos PSA pendientes**

- Filtrar por `gradingCompanyId = PSA` y `grade` en listados, último precio, estadísticas, variación y agregaciones.
- Valorar una carta gradada únicamente con coincidencia exacta de empresa y grado.
- Si no existe precio PSA exacto, mostrar `Sin precio PSA` y conservar el precio normal como dato independiente.
- No usar automáticamente el precio PSA 10 para valorar una carta PSA 9.
- Verificar que los desgloses de colección indiquen la empresa y el grado utilizados.
- Añadir pruebas con PSA 9, PSA 10, otra empresa y ausencia de precio.
- La integración PostgreSQL verifica que una carta PSA sin precio exacto no usa el precio normal como fallback.

### Fase 6 — Frontend

Estado: **En progreso: selector y metadata de precios graded implementados**

- Mostrar PSA en el selector de empresas de grading cuando exista en backend.
- Mostrar la empresa seleccionada en paneles, historial y analíticas de precios graded.
- Permitir filtrar la colección por empresa de grading y mostrar `PSA + grado` en cada item.
- Permitir seleccionar empresa y grado al registrar una carta gradada.
- En el detalle de una carta gradada mostrar:
  - empresa: PSA;
  - grado;
  - precio actual exacto;
  - moneda;
  - fuente;
  - fecha del dato;
  - estado cuando no haya precio.
- Separar visualmente `Precio normal` y `Precio PSA`.
- No mostrar un precio PSA como si fuera normal.
- Mostrar una notificación temporal cuando falle una consulta o importación.
- Mantener estados de carga, vacío, error y dato desactualizado.

### Fase 7 — Gráficos de precios y variaciones

Estado: **Finalizado**

Regla funcional obligatoria:

- La ventana normal del gráfico será como máximo el último año.
- Si existen datos dentro del último año, solo se mostrarán esos datos.
- Si no existe ningún dato dentro del último año, pero existe al menos un dato histórico válido, se mostrará el dato más reciente disponible para que el gráfico no quede vacío.
- El fallback no debe alterar los indicadores históricos de máximo ni promedio.
- El gráfico debe indicar visualmente cuando está mostrando un dato anterior al último año.

Implementación propuesta:

1. Obtener agregaciones del precio seleccionado.
2. Separar datos válidos y ordenar por fecha ascendente.
3. Calcular `recentHistory` con fecha mayor o igual a `ahora - 365 días`.
4. Usar `recentHistory` si contiene datos.
5. Si está vacío, usar únicamente el último punto histórico válido y marcarlo como `fallback`.
6. Calcular máximo y promedio sobre el histórico disponible según la métrica indicada, sin mezclar fuentes ni grados.
7. Añadir pruebas para:
   - histórico completo dentro del año;
   - un único dato anterior al año;
   - datos únicamente anteriores al año;
   - datos recientes y antiguos mezclados;
   - agregaciones vacías o fechas inválidas.

### Fase 8 — Operación, monitoreo y documentación

Estado: **Pendiente**

- Crear un job de sincronización PSA independiente del job de precios normales.
- Registrar duración, proveedor, registros recibidos, creados, omitidos y fallidos.
- Exponer el último estado del job en la pantalla administrativa de sincronizaciones.
- Añadir alerta si la fuente no entrega datos durante el periodo esperado.
- Documentar cómo ejecutar una importación manual y cómo revertir un lote incorrecto.
- Ejecutar pruebas de contrato, integración PostgreSQL, lint, smoke y GitHub Actions.

## Criterios de aceptación

La funcionalidad se podrá marcar como finalizada cuando:

- PSA exista como empresa real en la base.
- Haya una fuente autorizada y reproducible de precios PSA.
- Las cartas estén mapeadas sin asociaciones ambiguas.
- Se puedan importar precios PSA por carta y grado.
- La colección use únicamente la coincidencia exacta de empresa y grado.
- Los precios normales actuales no hayan cambiado.
- La UI distinga precios normales de precios PSA.
- Los gráficos respeten la ventana del último año y el fallback del último dato disponible.
- Existan pruebas automatizadas para importación, valoración, contratos y gráficos.
- No haya secretos, tokens ni datos inventados en el repositorio.

## Orden recomendado de ejecución

1. Ejecutar Fase 0 y elegir fuente.
2. Completar Fase 1 creando PSA de forma idempotente.
3. Implementar Fase 3 y Fase 4 con un archivo fixture realista, sin proveedor automático.
4. Implementar Fase 5 y validar valoración exacta.
5. Implementar Fase 7 de gráficos.
6. Integrar la fuente automática en Fase 2.
7. Completar Fase 6 y Fase 8.

Hasta disponer de una fuente autorizada, el sistema debe mostrar ausencia de precio PSA y nunca estimarlo automáticamente.
