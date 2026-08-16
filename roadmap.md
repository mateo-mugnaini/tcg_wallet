# Roadmap de Desarrollo y Estado Real — TCG Wallet API

> **Proyecto:** TCG Wallet API
> **Stack:** Node.js 20 · Express 5 · PostgreSQL · JWT · Zod · bcrypt · PNPM
> **Estado:** Backend funcional con autenticación, catálogo, precios, sincronización, colección avanzada y grading companies implementados en código. La suite normal tiene 12 archivos y 63 tests; la suite de integración añade 3 tests PostgreSQL ejecutados correctamente.

> **Fuente de verdad:** `PROJECT_CONTEXT.md` documenta el estado comprobado del repositorio. Este archivo define prioridades y estados del roadmap; el código actual tiene prioridad sobre cualquier sección histórica.

## Estado actualizado al 2026-08-16

### Registro del avance actual

- Se consolidó el pipeline de sincronización: `api/src/services/sync.pipeline.service.js` quedó como shim hacia la única implementación activa en `api/src/syncs`.
- Se centralizó la normalización de `sortOrder` (`ASC`/`DESC`) para TCGs, sets, cards, colección y usuarios.
- Se añadieron pruebas de contratos del catálogo y pruebas unitarias del `cards.service` con repositories mockeados.
- Se añadieron pruebas unitarias del `collection-items.service` para reglas graded, filtros, paginación y ownership.
- Se incorporó el comando oficial `pnpm lint` y ESLint ejecuta sin errores ni warnings.
- Se amplió `api/check_schema.js` para auditar las nueve tablas principales, columnas, constraints e índices sin modificar datos.
- Se añadió `pnpm test:integration` con 3 pruebas de lectura de repositories contra PostgreSQL.
- Validación realizada: `pnpm.cmd test:run` pasa con 12 archivos y 63 tests; `pnpm.cmd test:integration` pasa con 3 tests; `pnpm.cmd lint` pasa correctamente.

| Nº | Área | Estado | Siguiente acción |
|---:|---|---|---|
| 00 | Baseline técnico y DB | **En progreso avanzado** | Versionar DDL/migrations y medir EXPLAIN de queries críticas. |
| 01 | Collection avanzada | **Finalizado** | Ampliar cobertura de tests y response schemas generales. |
| 02 | Grading Companies | **Finalizado** | Añadir tests y completar auditoría de FKs como tarea de calidad. |
| 03 | Graded Card Prices | **En progreso** | Conectar proveedor real al importador batch y ampliar pruebas automatizadas. |
| 04 | Valoración de colección | **Finalizado** | Ampliar tests y documentar conversión multicurrency futura. |
| 05 | Catálogo avanzado | **En progreso** | Completar tests de integración y normalización restante de filtros en sets/TCGs. |
| 06 | Validación Zod completa | **En progreso** | Auth, users y catálogo ya tienen schemas conectados; faltan responses menores y normalización adicional. |
| 07 | Separación de capas | **En progreso** | Pipeline legacy consolidado; revisar validación duplicada restante y homogeneizar controllers/services. |
| 08 | Testing profesional | **En progreso** | 12 archivos y 63 tests normales + 3 tests PostgreSQL; ampliar API end-to-end y operaciones de escritura aisladas. |
| 09 | Seguridad avanzada | **Parcial** | Completar rate limits distribuidos, CSRF/revocación de sesiones y validación de producción. |
| 10 | Índices y optimización DB | **En progreso** | Inventario verificado; ejecutar EXPLAIN y crear migrations/índices solo con evidencia. |
| 11 | Transacciones | **Parcial** | Revisar collection, sync y operaciones multi-tabla. |
| 12 | Logging/Observabilidad | **Pendiente** | Logger estructurado, request IDs y métricas. |
| 13 | Swagger/OpenAPI | **Pendiente** | Publicar contrato de la API. |
| 14 | Background Jobs | **Pendiente** | Extraer sincronizaciones del ciclo HTTP. |
| 15 | Production Readiness | **Pendiente** | Deploy, shutdown, backups, CI/CD y monitoring. |
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
12. Background Jobs
13. Production Readiness
14. Frontend
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

Los endpoints costosos requieren rol admin, tienen rate limit específico y comparten un advisory lock de PostgreSQL entre instancias. La extracción a jobs sigue pendiente para no mantener requests HTTP abiertas durante todo el sync.

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

Actualmente existe logging mediante `console.log`.

Debe evolucionar a un sistema estructurado.

## 10.1. Logger

Implementar un logger profesional:

```text
info
warn
error
debug
```

## 10.2. Request logging

Registrar:

```text
method
path
status
duration
request id
user id
```

## 10.3. Error logging

Registrar errores con:

```text
error code
stack
request id
user id
endpoint
```

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

# 14. Fase 13 — Jobs y tareas automáticas

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

# 15. Fase 14 — Production Readiness

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
* Docker
* Docker Compose
* CI/CD
* migrations automáticas
* backups
* monitoring

---

# 16. Fase 15 — Frontend

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

El siguiente bloque ejecutado fue testing unitario de catálogo y colección, seguido por 3 pruebas de repositories contra PostgreSQL. Actualmente existe evidencia reproducible de 13 archivos y 66 tests ejecutados.

Por lo tanto, el siguiente bloque lógico es ampliar API end-to-end, medir EXPLAIN de queries críticas y preparar migrations versionadas.

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
