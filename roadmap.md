# Roadmap de Desarrollo y Estado Real — TCG Wallet API

> **Proyecto:** TCG Wallet API
> **Stack:** Node.js 20 · Express 5 · PostgreSQL · JWT · Zod · bcrypt · PNPM
> **Estado:** Backend funcional con autenticación, catálogo, precios, sincronización, colección avanzada y grading companies implementados en código. La suite normal tiene 16 archivos y 82 tests; la suite de integración añade 5 tests PostgreSQL ejecutados correctamente.

> **Fuente de verdad:** `PROJECT_CONTEXT.md` documenta el estado comprobado del repositorio. Este archivo define prioridades y estados del roadmap; el código actual tiene prioridad sobre cualquier sección histórica.

## Estado actualizado al 2026-08-16

### Registro del avance actual

- Se consolidó el pipeline de sincronización: `api/src/services/sync.pipeline.service.js` quedó como shim hacia la única implementación activa en `api/src/syncs`.
- Se centralizó la normalización de `sortOrder` (`ASC`/`DESC`) para TCGs, sets, cards, colección y usuarios.
- Se añadieron pruebas de contratos del catálogo y pruebas unitarias del `cards.service` con repositories mockeados.
- Se añadieron pruebas unitarias del `collection-items.service` para reglas graded, filtros, paginación y ownership.
- Se incorporó el comando oficial `pnpm lint` y ESLint ejecuta sin errores ni warnings.
- Se amplió `api/check_schema.js` para auditar las diez tablas principales, columnas, constraints e índices sin modificar datos.
- Se añadió `000_baseline_schema.sql` para que CI y entornos limpios puedan crear el schema base antes de las migrations incrementales; en la base existente se verificó como idempotente.
- Se añadió `pnpm test:integration` con 3 pruebas de lectura de repositories contra PostgreSQL.
- Se añadieron pruebas HTTP end-to-end para health, validación de login y autenticación de colección.
- Se añadieron pruebas unitarias del servicio de precios para snapshots, paginación, estadísticas, variación y validaciones de alta.
- Se añadió `pnpm db:explain` para medir cuatro consultas críticas sin modificar datos.
- Se preparó y aplicó `api/migrations/001_critical_read_indexes.sql` en desarrollo para los dos scans secuenciales detectados.
- `pnpm db:migrate` creó `schema_migrations`, aplicó la migration con advisory lock/transacción y registró el identificador correctamente.
- Se implementó logging estructurado JSON con niveles, redacción de secretos, request IDs y trazabilidad de requests HTTP; se agregaron pruebas de logger y propagación de `x-request-id`.
- Se migraron al logger los logs de infraestructura, sincronizadores, servicios de precios, sync lock y validación de responses; `api/src` ya no contiene logs directos fuera de `utils/logger.js`.
- Se agregaron métricas HTTP agregadas por endpoint, liveness, readiness con consulta real a PostgreSQL y endpoint de métricas; los stack traces solo se registran fuera de producción.
- Se publicó el contrato OpenAPI 3.0.3 en `/api/docs/openapi.json`, con 40 paths y 61 operaciones documentadas, esquemas de requests/responses y Bearer auth.
- Se implementó una cola interna de jobs de sincronización con estados queued/running/succeeded/failed, duración, resumen, error seguro y bloqueo de concurrencia; los endpoints asíncronos responden `202`.
- Se implementó una cola persistente PostgreSQL de jobs de sincronización con estados, duración, resumen, error seguro, recuperación de jobs obsoletos y claim con `SKIP LOCKED`; los endpoints async responden `202`.
- Los endpoints legacy de sets, cards, prices y pipeline ahora disparan jobs y conservan el advisory lock como protección adicional; ninguna sincronización larga queda dentro del ciclo HTTP.
- Se implementó graceful shutdown: `SIGTERM`/`SIGINT` detienen la cola, dejan readiness en `503`, cierran HTTP con timeout configurable y finalizan el pool PostgreSQL.
- Se reforzó la configuración productiva exigiendo SSL de PostgreSQL y se añadió `SHUTDOWN_TIMEOUT_MS` con valor seguro por defecto.
- Se añadió workflow de CI para instalar, migrar, ejecutar tests, integración, lint, validar OpenAPI y ejecutar smoke tests contra una API levantada. Docker/Compose queda explícitamente diferido por decisión de alcance.
- Se añadieron scripts de backup/restore PostgreSQL con formato custom y confirmación explícita para restore, además de `DEPLOYMENT_RUNBOOK.md` con staging, rollback y monitoring.
- `pnpm audit --prod` no reportó vulnerabilidades conocidas en las dependencias de producción.
- Se añadió `pnpm monitor:health`, con modo puntual o continuo, umbral de fallos consecutivos y webhook opcional para alertas operativas.
- GitHub Actions validó correctamente `Backend CI / test` después de versionar `api/pnpm-lock.yaml`; la ejecución completó migrations, fixture, lint, tests, integración, OpenAPI y smoke tests en 43 segundos.
- Se añadió el entorno explícito `staging`, con las mismas políticas de SSL, secretos, CORS y cookies seguras que producción.
- Se añadió `pnpm check:config` y su validación en CI para detectar configuraciones staging incompletas sin exponer secretos.
- Se añadió `pnpm db:check:data` para detectar precios negativos o grades fuera de rango antes de endurecer constraints SQL.
- Se añadió y aplicó `003_price_integrity_constraints.sql`, que impide precios negativos y grades graded fuera de `0–10`.
- GitHub Actions volvió a pasar correctamente después del preflight staging; quedaron validados el entorno, SSL, CORS, secretos mínimos, migrations, tests, integración, OpenAPI y smoke tests.
- Validación confirmada: la suite local completa y GitHub Actions pasan correctamente, incluyendo migrations, fixture CI, lint, 82 tests normales, 5 integraciones PostgreSQL, OpenAPI y smoke tests.
- Se añadió `api/.env.example` para hacer reproducible la configuración local sin incluir secretos.
- Validación realizada: `pnpm.cmd test:run` pasa con 16 archivos y 82 tests; `pnpm.cmd test:integration` pasa con 5 tests; `pnpm.cmd check:openapi`, `pnpm.cmd db:explain`, `pnpm.cmd lint` y ESLint sobre `src`, `tests` y `scripts` pasan correctamente.

| Nº | Área | Estado | Siguiente acción |
|---:|---|---|---|
| 00 | Baseline técnico y DB | **En progreso avanzado** | Conservar DDL/baseline versionado y repetir la validación en un entorno de producción controlado. |
| 01 | Collection avanzada | **Finalizado** | Ampliar cobertura de tests y response schemas generales. |
| 02 | Grading Companies | **Finalizado** | Añadir tests y completar auditoría de FKs como tarea de calidad. |
| 03 | Graded Card Prices | **En progreso** | Conectar proveedor real al importador batch y ampliar pruebas automatizadas. |
| 04 | Valoración de colección | **Finalizado** | Ampliar tests y documentar conversión multicurrency futura. |
| 05 | Catálogo avanzado | **En progreso** | Completar tests de integración y normalización restante de filtros en sets/TCGs. |
| 06 | Validación Zod completa | **En progreso** | Auth, users y catálogo ya tienen schemas conectados; faltan responses menores y normalización adicional. |
| 07 | Separación de capas | **En progreso** | Pipeline legacy consolidado; revisar validación duplicada restante y homogeneizar controllers/services. |
| 08 | Testing profesional | **En progreso** | 16 archivos y 82 tests normales + 5 tests PostgreSQL; ampliar operaciones de escritura aisladas. |
| 09 | Seguridad avanzada | **Parcial** | Completar rate limits distribuidos, CSRF/revocación de sesiones y validación de producción. |
| 10 | Índices y optimización DB | **En progreso** | Migration aplicada y verificada; ampliar mediciones con volumen real y revisar planes de consultas graded/colección. |
| 11 | Transacciones | **Parcial** | Revisar collection, sync y operaciones multi-tabla. |
| 12 | Logging/Observabilidad | **Finalizado** | Logger JSON, redacción, request IDs, métricas HTTP, liveness/readiness y stack traces controlados implementados y validados. |
| 13 | Swagger/OpenAPI | **Finalizado** | Contrato OpenAPI 3.0.3 publicado en `/api/docs/openapi.json`, validado automáticamente y cubierto por test HTTP. |
| 14 | Background Jobs | **Finalizado** | Cola persistente, recuperación, claim distribuido, bloqueo de concurrencia y endpoints async implementados; legacy convertido a disparador `202`. |
| 15 | Production Readiness | **En progreso** | Validación local y CI/CD base completadas; shutdown, runbook, scripts de backup/restore y monitor de health implementados; Docker/Compose diferido; quedan ejecutar backup/restore, rollback y alertas operativas reales en staging. |
| 16 | Frontend | **Fuera del backend actual** | Iniciar después de estabilizar la API. |

### Orden ejecutable actualizado

```text
0. Baseline técnico y acceso reproducible a PostgreSQL
1. Graded Card Prices
2. Valoración graded de la colección
3. Catálogo avanzado
4. Zod y contratos completos
5. Limpieza de capas y eliminación de legacy
6. Testing profesional
7. Seguridad avanzada
8. Índices, constraints y optimización DB
9. Transacciones restantes
10. Logging y observabilidad
11. Swagger/OpenAPI
14. Background Jobs
15. Production Readiness
16. Frontend
```

La numeración histórica de las fases se conserva más abajo para no perder contexto, pero el estado y el orden de ejecución válidos son los de esta sección y `ROADMAP_IMPLEMENTATION_PLAN.md`.

---

# 1. Estado actual

El backend ya cuenta con una base funcional bastante completa:

* Autenticación con Access Token + Refresh Token.
* Rotación de Refresh Tokens.
* Token Families.
* Detección de reutilización de Refresh Tokens.
* Revocación de sesiones.
* Roles `user` / `admin`.
* Gestión de usuarios.
* Gestión de TCGs.
* Gestión de Sets.
* Sincronización de Sets desde Pokémon TCG API.
* Gestión de Cards.
* Sincronización de Cards desde Pokémon TCG API.
* Histórico de precios.
* Último precio.
* Estadísticas de precios.
* Variaciones de precio.
* Agregaciones temporales.
* Sincronización masiva de precios.
* Colección personal.
* Soporte para cartas graded.
* CRUD completo de `collection_items`.
* Pipeline completo de sincronización.
* Middleware de autenticación, autorización, roles y validación.
* Manejo centralizado de errores.

Por lo tanto, **la siguiente etapa ya no consiste en construir el CRUD básico del backend**, sino en llevarlo hacia una API más completa, consistente, testeable y preparada para producción.

---

# 2. Fase 1 — Collection avanzada

## Estado

El CRUD principal de `collection_items` está implementado en código. No existe evidencia automatizada reproducible en el repositorio que permita afirmar que está probado contra una base activa:

* `GET /api/collection-items`
* `GET /api/collection-items/:id`
* `POST /api/collection-items`
* `PUT /api/collection-items/:id`
* `DELETE /api/collection-items/:id`

También está implementado:

* `quantity`
* `condition`
* `is_graded`
* `grading_company_id`
* `grade`
* validación de grading
* control de propiedad mediante `user_id`

## Pendiente

### 1.1. Mejorar consulta de colección — ✅ COMPLETADO

Agregar información relacionada mediante `JOIN` (`cards`, `sets`, `tcgs`, `grading_companies`).

Respuesta enriquecida implementada mediante `json_build_object` en PostgreSQL:

```json
{
  "card": {
    "id": "...",
    "name": "...",
    "image_url": "..."
  },
  "set": {
    "id": "...",
    "name": "..."
  },
  "tcg": {
    "id": "...",
    "name": "..."
  },
  "grading_company": {
    "id": "...",
    "name": "PSA"
  }
}
```

### 1.2. Filtros avanzados — ✅ COMPLETADO

Soportados en `GET /api/collection-items`:

* `cardId`
* `setId`
* `tcgId`
* `rarity`
* `condition`
* `isGraded`
* `gradingCompanyId`
* `minGrade`
* `maxGrade`

### 1.3. Ordenamiento — ✅ COMPLETADO

Permite ordenar mediante whitelist segura (`SORT_COLUMNS`):

* `created_at`
* `updated_at`
* `quantity`
* `grade` (con `NULLS LAST`)
* `name` / `card_name`

### 1.4. Estadísticas de colección — ✅ COMPLETADO

Endpoint implementado: `GET /api/collection-items/stats`

Proporciona agregaciones globales y desgloses:

* `summary`: `totalDistinctCards`, `totalQuantity`, `gradedQuantity`, `ungradedQuantity`
* `byCondition`: Desglose por condición (Near Mint, Lightly Played, etc.)
* `bySet`: Desglose por Set de cartas
* `byTcg`: Desglose por juego de cartas (TCG)
* `byGradingCompany`: Desglose por empresa de grading (PSA, Beckett, CGC)

### 1.5. Valor estimado de colección — ✅ COMPLETADO

Endpoint implementado: `GET /api/collection-items/value`

Calcula dinámicamente mediante CTEs y `DISTINCT ON` en PostgreSQL:
* `summary`: `totalEstimatedValue`, `currency`, `itemsEvaluatedCount`, `itemsMissingPriceCount`, `gradedItemsEvaluatedCount`, `gradedItemsMissingPriceCount`
* `topValuedItems`: Las 5 cartas más valiosas de la colección (basado en `quantity * latest_price`)
* `bySet`: Desglose del valor estimado agrupado por Set
* `byTcg`: Desglose del valor estimado agrupado por TCG
* `byGradingCompany`: Desglose del valor graded agrupado por empresa de grading

---

# 3. Fase 2 — Grading profesional

El código y el roadmap mencionan:

* `grading_companies`
* `graded_card_prices` — tabla y FKs verificadas en la base activa; constraints adicionales e índices pendientes de auditoría.
* `collection_items`

Pero todavía falta explotar completamente este modelo.

## 2.1. CRUD de grading companies — ✅ COMPLETADO

Endpoints implementados:

* `GET    /api/grading-companies` (autenticado)
* `GET    /api/grading-companies/:id` (autenticado)
* `POST   /api/grading-companies` (admin)
* `PATCH  /api/grading-companies/:id` (admin)
* `DELETE /api/grading-companies/:id` (admin)

## 2.2. Precios graded

Implementar consulta de:

```text
GET /api/cards/:cardId/graded-prices
```

Y posteriormente:

```text
GET /api/cards/:cardId/graded-prices/latest
GET /api/cards/:cardId/graded-prices/stats
GET /api/cards/:cardId/graded-prices/variation
GET /api/cards/:cardId/graded-prices/aggregations
```

Para registrar una captura de precio graded:

```text
POST /api/cards/:cardId/graded-prices
```

## 2.3. Valor de cartas graded

Relacionar:

```text
card
+
grading_company
+
grade
+
graded_card_price
```

para obtener una valoración específica.

---

# 4. Fase 3 — Mejorar el catálogo

El catálogo actualmente funciona, pero todavía puede evolucionar.

## 3.1. Búsqueda avanzada de Cards

Agregar filtros:

* nombre
* Set
* TCG
* rarity
* card number
* external ID

Ejemplo:

```text
GET /api/cards?search=Charizard&setId=...
```

## 3.2. Ordenamiento seguro

Whitelist de campos:

```text
name
card_number
created_at
updated_at
```

## 3.3. Información enriquecida

Permitir obtener una Card incluyendo:

* Set
* TCG
* precios actuales
* colección del usuario
* imagen

Esto permitirá posteriormente construir una pantalla de detalle de carta mucho más útil.

---

# 5. Fase 4 — Sistema de precios profesional

El sistema de `card_prices` ya tiene una base importante.

Actualmente existen:

* histórico
* latest
* stats
* variation
* aggregations
* sincronización automática

## Pendiente

### 5.1. Comparación entre condiciones

Ejemplo:

```text
Near Mint
Lightly Played
Moderately Played
Heavily Played
Damaged
```

Obtener comparación de precios.

### 5.2. Comparación entre fuentes

Preparar el modelo para múltiples fuentes:

```text
pokemon-tcg
tcgplayer
cardmarket
```

### 5.3. Tendencias

Crear análisis:

* subida
* bajada
* estabilidad
* porcentaje de cambio
* evolución temporal

### 5.4. Optimización del Price Sync

Esto queda explícitamente como **pendiente posterior**.

Actualmente la sincronización funciona correctamente, pero puede tardar bastante.

Posteriormente:

* procesamiento por lotes
* inserts masivos
* concurrencia controlada
* reducción de queries
* cache
* procesamiento paralelo por Sets
* rate limiting inteligente
* retry con exponential backoff + jitter

**No es prioridad inmediata.**

---

# 6. Fase 5 — Validación y contratos API

Aunque ya existe Zod, hay que llevarlo a una utilización consistente.

## 6.1. Request schemas

Crear schemas separados para:

```text
body
query
params
```

para cada módulo.

Ejemplo:

```text
collection-items
cards
prices
users
sets
tcgs
grading-companies
```

## 6.2. Response schemas

Validar también respuestas.

Objetivo:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
    ↓
Response Schema
```

Esto evita que una modificación accidental del repository cambie el contrato público de la API.

## 6.3. Normalización

Centralizar:

* pagination
* sort
* filtros
* UUID validation
* fechas
* enums
* condiciones de cartas
* grades

---

# 7. Fase 6 — Arquitectura y separación de responsabilidades

Actualmente existen partes donde la validación está duplicada entre:

```text
Controller
Service
Repository
```

Esto debe limpiarse progresivamente.

Objetivo:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
PostgreSQL
```

## Controller

Responsable de:

* recibir HTTP
* extraer params/query/body
* llamar al service
* devolver HTTP response

## Service

Responsable de:

* reglas de negocio
* validaciones de negocio
* coordinación entre repositories
* decisiones de flujo

## Repository

Responsable de:

* SQL
* PostgreSQL
* queries
* persistencia

## Middleware

Responsable de:

* autenticación
* autorización
* roles
* validación Zod

---

# 8. Fase 7 — Testing profesional

Esta es una de las etapas más importantes pendientes.

## 8.1. Unit Tests

Probar:

* Services
* validaciones
* helpers
* retry logic
* price calculations
* collection logic

## 8.2. Repository Tests

Probar contra PostgreSQL:

* SELECT
* INSERT
* UPDATE
* DELETE
* filtros
* paginación
* ordenamiento
* relaciones

## 8.3. Controller/API Tests

Utilizar:

```text
Supertest
```

para probar endpoints reales.

Ejemplos:

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/collection-items
GET  /api/collection-items
PUT  /api/collection-items/:id
DELETE /api/collection-items/:id
```

## 8.4. Authentication Tests

Probar:

* access token válido
* access token inválido
* token expirado
* refresh válido
* refresh expirado
* refresh revocado
* reuse detection
* token family revocation

## 8.5. Authorization Tests

Probar:

* user accediendo a recurso propio
* user intentando acceder a recurso ajeno
* user intentando acceder a endpoint admin
* admin accediendo correctamente

---

# 9. Fase 8 — Seguridad avanzada

La seguridad básica, el hardening HTTP, los timeouts externos, los timeouts de PostgreSQL y los advisory locks distribuidos ya están implementados. La fase permanece parcial por rate limits distribuidos, CSRF/revocación completa y validación de producción.

## 9.1. Rate limiting específico — ✅ IMPLEMENTADO

Separar límites para:

```text
/auth/login
/auth/refresh
/users
/sync
```

Se aplicaron límites para login, refresh, usuarios, registro y sincronizaciones. La estrategia actual usa memoria local por instancia; una arquitectura distribuida requiere un store compartido.

## 9.2. Protección contra abuso — ✅ LÍMITES IMPLEMENTADOS / LOCK PENDIENTE

Especialmente:

```text
POST /api/sync
POST /api/cards/sync/pokemon
POST /api/sync/cards/prices
```

Los endpoints costosos requieren rol admin, tienen rate limit específico y comparten un advisory lock de PostgreSQL entre instancias. Los endpoints async de jobs ya evitan mantener requests abiertas; los endpoints legacy síncronos se conservan por compatibilidad y quedan para retirada gradual.

## 9.3. Cookies y Refresh Tokens — ✅ IMPLEMENTADO EN CÓDIGO

Revisar:

* `httpOnly`
* `secure`
* `sameSite`
* expiración
* rotación
* revocación

según entorno:

```text
development
production
```

La revisión de despliegue HTTPS, CSRF y revocación al eliminar usuarios permanece como tarea de production readiness.

## 9.4. CORS — ✅ IMPLEMENTADO

Configurar explícitamente:

```text
allowed origins
methods
headers
credentials
```

La configuración se monta en la aplicación con origin por entorno, métodos explícitos, headers permitidos y credenciales habilitadas para la cookie de refresh.

---

# 10. Fase 9 — Observabilidad

Estado actual: **Finalizado**. Existe un logger JSON estructurado en `api/src/utils/logger.js`, con niveles `debug`, `info`, `warn` y `error`, redacción recursiva de secretos y logging HTTP correlacionado por `requestId`. Toda la capa `api/src` utiliza el logger; además existen métricas agregadas, liveness, readiness con PostgreSQL y endpoint de métricas.

## 10.1. Logger

Implementar y extender un logger profesional:

```text
info
warn
error
debug
```

## 10.2. Request logging

Implementado para cada request:

```text
method
path
status
duration
request id
user id
```

El middleware acepta un `x-request-id` seguro o genera un UUID, lo devuelve en la respuesta y registra el evento `http_request` al finalizar.

## 10.3. Error logging

Los errores del middleware global registran:

```text
error code
stack
request id
user id
endpoint
```

Los metadatos sensibles se redactan antes de escribirlos. Los stack traces se registran únicamente fuera de producción y no se devuelven al cliente.

sin exponer información sensible al cliente.

---

# 11. Fase 10 — API Documentation

Implementar documentación formal.

Objetivo:

```text
OpenAPI / Swagger
```

Documentar:

* endpoints
* request body
* query params
* path params
* responses
* errores
* autenticación
* ejemplos

Especialmente:

```text
Bearer Authentication
```

---

# 12. Fase 11 — Base de datos

## 12.1. Índices

Revisar índices necesarios para:

```text
collection_items
cards
sets
card_prices
graded_card_prices
refresh_tokens
```

Especialmente columnas utilizadas frecuentemente en:

```text
WHERE
JOIN
ORDER BY
```

## 12.2. Constraints

Revisar:

* foreign keys
* unique constraints
* check constraints
* nullable fields

La tabla `collection_items` ya tiene correctamente:

```text
quantity > 0
grade 0-10
is_graded ↔ grading data
```

## 12.3. Migraciones

Incorporar un sistema formal de migrations para evitar modificaciones manuales de PostgreSQL.

---

# 13. Fase 12 — Transacciones

Introducir transacciones PostgreSQL donde una operación implique múltiples modificaciones.

Especialmente:

### Refresh Token Rotation

```text
revoke old token
+
create new token
```

### Collection

Cuando en el futuro una operación afecte:

```text
collection_items
+
prices
+
statistics
```

### Synchronization

Para operaciones que requieran consistencia entre múltiples tablas.

---

# 14. Fase 14 — Jobs y tareas automáticas

Actualmente la sincronización se ejecuta mediante endpoints.

Posteriormente sería conveniente separar:

```text
HTTP API
```

de:

```text
background jobs
```

Por ejemplo:

```text
Sync Sets
Sync Cards
Sync Prices
```

mediante un scheduler/queue.

Esto evitará mantener una request HTTP abierta durante sincronizaciones largas.

---

# 15. Fase 15 — Production Readiness

Antes del deployment:

* variables de entorno separadas
* configuración production
* CORS
* HTTPS
* logging
* health checks
* graceful shutdown
* PostgreSQL pool tuning
* manejo de SIGTERM/SIGINT
* Docker/Compose: diferido por decisión de alcance
* CI/CD
* migrations automáticas
* backups
* monitoring

---

# 16. Fase 16 — Frontend

Una vez estabilizada la API, comenzar el frontend.

Objetivo:

```text
TCG Wallet
    ↓
Frontend
    ↓
REST API
    ↓
PostgreSQL
```

Funcionalidades principales:

## Dashboard

* valor estimado de colección
* cantidad de cartas
* cartas graded
* evolución del valor

## Catálogo

* búsqueda
* filtros
* Sets
* Cards
* precios

## Carta

* información
* imagen
* histórico
* estadísticas
* variación
* precio actual

## Colección

* cartas del usuario
* cantidad
* condición
* grading
* valoración

## Autenticación

* login
* registro
* logout
* refresh automático
* sesiones

---

# 17. Orden recomendado de implementación

La prioridad recomendada queda así:

```text
01. Collection avanzada
        ↓
02. Grading Companies
        ↓
03. Graded Card Prices
        ↓
04. Valoración de colección
        ↓
05. Catálogo avanzado
        ↓
06. Validación Zod completa
        ↓
07. Limpieza Controller / Service / Repository
        ↓
08. Testing profesional
        ↓
09. Seguridad avanzada
        ↓
10. Índices y optimización DB
        ↓
11. Transacciones
        ↓
12. Logging / Observabilidad
        ↓
13. Swagger / OpenAPI
        ↓
14. Background Jobs
        ↓
15. Production Readiness
        ↓
16. Frontend
```

---

# 18. Siguiente bloque de implementación

El siguiente bloque ejecutado fue testing unitario de catálogo, colección y precios, 5 pruebas de repositories contra PostgreSQL y 9 pruebas HTTP end-to-end. Actualmente existe evidencia reproducible de 16 archivos y 82 tests normales ejecutados.

Por lo tanto, el siguiente bloque lógico es ampliar tests de operaciones de escritura aisladas y seguir con observabilidad/limpieza de capas; la optimización DB continúa con mediciones de volumen real.

## Módulo siguiente — Testing de repository/API y limpieza de capas

### Objetivo

Cubrir con repositories mockeados las reglas de negocio restantes y, cuando la base de test esté disponible, validar consultas, filtros, paginación, ownership y respuestas mediante PostgreSQL. En paralelo se continuará homogeneizando el flujo Route → Middleware → Controller → Service → Repository.

### Módulo posterior — Graded Card Prices automático

### Objetivo

Continuar el módulo HTTP graded prices. Los cinco endpoints de consulta ya están implementados:

```text
GET /api/cards/:cardId/graded-prices
```

La tabla ya fue verificada en PostgreSQL y contiene card_id, grading_company_id, grade, price, currency, source y recorded_at. La valoración ya selecciona el último precio graded para items graded. El comando opt-in `pnpm db:seed:graded` fue ejecutado y validó las cinco consultas graded con dos capturas históricas. `pnpm check:graded-value` validó el cálculo con un item graded temporal y limpió sus datos. También existe el importador administrativo `POST /api/sync/graded-prices`, preparado para recibir lotes validados. Este módulo permanece **En progreso** hasta definir y conectar un proveedor real.

### Contexto histórico

La sección siguiente conserva la descripción original de Collection avanzada, pero ya está completada en código. Graded Card Prices automático queda como prioridad posterior al bloque de testing y limpieza.

### Objetivo histórico ya completado

Transformar:

```text
GET /api/collection-items
```

de una consulta que devuelve únicamente IDs a una consulta enriquecida con información relacionada.

Primera evolución:

```text
collection_items
        ↓
cards
        ↓
sets
        ↓
tcgs
```

y para cartas graded:

```text
collection_items
        ↓
grading_companies
```

Después podremos construir sobre esa base:

```text
filtros
+
ordenamiento
+
estadísticas
+
valoración
```

La optimización del `POKÉMON PRICE SYNC` queda fuera de esta prioridad y se retomará posteriormente.
