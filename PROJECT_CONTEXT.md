# TCG Wallet API — Project Context

> Documento maestro generado a partir del código actual del backend. Revisión: 2026-08-15. Rama: test. Commit observado: f07eb5b.
>
> Regla de evidencia: si un dato no puede comprobarse en código o mediante una ejecución reproducible, se marca **NO VERIFICADO**. Si aparece solamente en roadmap/historial y no en código actual, se marca **PLANIFICADO / NO VERIFICADO EN CÓDIGO**.

## 1. Identidad y propósito

TCG Wallet API es una API REST para gestionar catálogos de juegos de cartas coleccionables, sets, cards, precios históricos y la colección personal de usuarios. La integración externa implementada está orientada a Pokémon TCG.

El backend implementa:

- autenticación con access JWT y refresh JWT;
- sesiones con hash de refresh tokens, rotación, familias y detección de reutilización;
- roles user/admin y ownership;
- usuarios;
- TCGs, sets y cards;
- precios normales históricos, latest, estadísticas, variación y agregaciones;
- sincronización de sets, cards y precios desde Pokémon TCG API;
- collection items con soporte de grading;
- estadísticas y valoración normal/graded de colección;
- CRUD de grading companies.

El módulo graded_card_prices tiene implementados sus cinco endpoints de consulta: listado, latest, stats, variation y aggregations. La valoración de colección ya selecciona precios graded por card, empresa y grade cuando el item es graded; existe importación batch administrativa y un fixture con filas reales. El sync automático, la valoración positiva de un item graded y la cobertura completa de tests todavía están pendientes. No hay migraciones en el backend actual.

## 2. Stack real

| Tecnología | Versión declarada/observada | Uso |
|---|---:|---|
| Node.js | 20.19.3 observado; no hay engines | Runtime y fetch nativo. |
| Express | ^5.2.1 | Servidor HTTP, rutas y middleware. |
| PostgreSQL | No fijada | Persistencia relacional. |
| pg | ^8.23.0 | Pool, SQL parametrizado y transacciones. |
| jsonwebtoken | ^9.0.3 | Firmar y verificar JWT. |
| bcrypt | ^6.0.0 | Hash y comparación de passwords; cost 12. |
| zod | ^4.4.3 | Validación de entorno, requests y responses. |
| cookie-parser | ^1.4.7 | Cookie del refresh token. |
| express-rate-limit | ^8.6.2 | Límites de login y refresh. |
| helmet | ^8.3.0 | Dependencia y opciones preparadas; no activa en app. |
| cors | ^2.8.6 | Dependencia y opciones preparadas; no activa en app. |
| dotenv | ^17.4.2 | Carga de .env. |
| vitest | ^4.1.10 | Runner declarado; no hay tests. |
| nodemon | ^3.1.14 | Desarrollo. |
| ESLint | ^10.8.1 | Lint; no arranca porque falta globals. |
| Prettier | ^3.9.6 | Formato. |
| PNPM | pnpm@10.30.3 | Package manager. |

El package manifest está en api/package.json, con type module. No existe package.json en la raíz.

## 3. Estructura real

~~~text
tcg_wallet/
├── api/
│   ├── check_schema.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── constants/
│       ├── controllers/
│       ├── errors/
│       ├── integrations/pokemon-tcg/
│       ├── middlewares/
│       ├── repositories/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── syncs/
│       └── utils/
├── client/                 # fuera del alcance de este documento
├── readme.md
└── roadmap.md
~~~

Responsabilidades:

- config: entorno, PostgreSQL y opciones de seguridad/cookies.
- constants: roles.
- controllers: entrada/salida HTTP.
- errors: AppError y constructor.
- integrations: cliente HTTP de Pokémon TCG API.
- middlewares: auth, roles, ownership, validación, rate limit y errores.
- repositories: SQL y persistencia.
- routes: endpoints y composición de middleware.
- schemas: Zod.
- services: reglas de negocio y coordinación.
- syncs: sincronización externa y pipeline.
- utils: JWT, hash, formato de fechas y sanitización declarada.

Archivos centrales:

- api/src/app.js: crea Express, registra parsers, health check, rutas y error middleware.
- api/src/server.js: prueba DB y arranca el listener.
- api/src/config/database.js: pool de pg.
- api/src/config/env.js: validación de entorno.
- api/src/integrations/pokemon-tcg/pokemon-tcg.client.js: cliente externo.
- api/src/syncs/sync.pipeline.service.js: pipeline usado por /api/sync.

## 4. Arquitectura

~~~text
HTTP Request
    ↓
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
~~~

Route define path, método y middleware. Middleware autentica, valida o autoriza. Controller extrae body/query/params, llama al service y devuelve status/JSON. Service aplica existencia, duplicados, reglas de negocio y coordinación. Repository ejecuta SQL parametrizado.

Excepciones reales:

- collection-items.controller.js contiene validación manual de limit, offset, isGraded, minGrade y maxGrade; no hay schema Zod de collection.
- controllers de cards usan directamente req.body, req.params y req.query; no usan validate.
- collection-items.repository.js hace JOINs y json_build_object.
- los services de listados lanzan en paralelo query de datos y count.
- los syncs coordinan repositories e integración externa fuera del flujo HTTP convencional.
- existe un pipeline legado roto en src/services/sync.pipeline.service.js; app.js usa el pipeline de src/syncs/.

## 5. PostgreSQL y esquema

No hay migraciones, DDL, seeds ni schema SQL en el repositorio. check_schema.js consulta metadata de graded_card_prices. La base activa está disponible en el puerto 2203; la configuración antigua apuntaba a 5432 y provocaba ECONNREFUSED. Para el resto de tablas, tipos exactos, nullable, defaults, PK, FK, checks e índices siguen siendo **NO VERIFICADO EN BASE ACTIVA**.

Columnas observables por consultas:

| Tabla | Columnas observadas | Relación observable |
|---|---|---|
| users | id, role, email, username, password, created_at, updated_at | refresh_tokens.user_id y collection_items.user_id. |
| refresh_tokens | id, user_id, token_hash, expires_at, revoked_at, created_at, updated_at, token_family_id | Sesiones de users. |
| tcgs | id, name, created_at | Padre de sets. |
| sets | id, tcg_id, external_id, name, code, release_date, created_at | tcg_id con tcgs; padre de cards. |
| cards | id, set_id, external_id, name, card_number, rarity, image_url, created_at, updated_at | set_id con sets; padre de prices/collection. |
| card_prices | id, card_id, condition, price, currency, source, recorded_at | card_id con cards. |
| collection_items | id, user_id, card_id, quantity, condition, is_graded, grading_company_id, grade, created_at, updated_at | user/card/grading company. |
| grading_companies | id, name, created_at | collection_items.grading_company_id. |

Los repositories usan ON CONFLICT (tcg_id, external_id) para sets y ON CONFLICT (set_id, external_id) para cards; esto presupone una constraint compatible, pero la constraint real no está verificada. El código aplica quantity > 0, grade 0–10 y coherencia entre is_graded y datos de grading; los checks SQL son **NO VERIFICADO EN BASE ACTIVA**.

La tabla graded_card_prices fue verificada en la base activa mediante check_schema.js. Columnas: id uuid NOT NULL con gen_random_uuid(), card_id uuid NOT NULL, grading_company_id uuid NOT NULL, grade numeric NOT NULL, price numeric NOT NULL, currency character NOT NULL, source varchar NOT NULL y recorded_at timestamptz NOT NULL con now(). Tiene FKs graded_card_prices_card_id_fkey hacia cards.id y graded_card_prices_grading_company_id_fkey hacia grading_companies.id. Otros constraints e índices de esta tabla son **NO VERIFICADO EN BASE ACTIVA**.

Relaciones conceptuales:

~~~text
users
├── refresh_tokens
└── collection_items
    ├── cards
    │   └── sets
    │       └── tcgs
    └── grading_companies

cards
└── card_prices
~~~

## 6. Auth y JWT

### Login

POST /api/auth/login valida email/password con loginSchema. auth.service busca password, compara con bcrypt, genera access y refresh, hashea el refresh, calcula expires_at y crea una nueva token family. Devuelve accessToken y usuario; el refresh se coloca en cookie.

### Access token

generateAccessToken firma payload sub=userId y role con JWT_ACCESS_SECRET. Expiración: JWT_ACCESS_EXPIRES_IN, default 15m. auth.middleware.js exige Authorization: Bearer token, verifica JWT y asigna req.user con id y role.

### Refresh token

generateRefreshToken firma sub=userId con JWT_REFRESH_SECRET. Expiración default 7d. El token crudo se guarda en cookie refreshToken. PostgreSQL guarda hash SHA-256, user_id, expires_at, revoked_at, token_family_id y timestamps. El token crudo no se persiste en DB.

Cookie: httpOnly; secure en producción; sameSite strict en producción y lax en desarrollo; path /api/auth; maxAge fijo de 7 días.

### Token family y rotación

Cada login crea un UUID token_family_id. Cada refresh conserva la familia.

~~~text
refresh actual
    ↓
hash + lookup
    ↓
existencia, revoked_at, expiry y firma JWT
    ↓
nuevo access + nuevo refresh
    ↓
transacción: revocar actual e insertar nuevo
    ↓
reemplazar cookie
~~~

rotateRefreshToken ejecuta BEGIN, revoca el token actual, inserta el nuevo, COMMIT y ROLLBACK si falla.

Si se intenta reutilizar un refresh ya revocado, refreshUserToken revoca los tokens activos de toda la familia y devuelve 401. Esto es reuse detection.

POST /api/auth/logout no exige access token. Si hay cookie, busca y revoca su hash; luego limpia la cookie. Sin cookie responde 204.

Cambiar password en PATCH /api/users/:id usa bcrypt cost 12 y revoca todos los refresh tokens activos del usuario. No se observa revocación de access tokens ya emitidos ni revocación explícita durante borrado de usuario.

## 7. Seguridad

### IMPLEMENTADO

- JWT access/refresh separados.
- bcrypt con cost factor 12.
- refresh token en cookie httpOnly.
- hash SHA-256 del refresh en DB.
- rotation, token families y reuse detection.
- roles user/admin.
- ownership de usuarios mediante requireOwnershipOrRole.
- ownership de collection mediante user_id en SQL.
- SQL parametrizado.
- whitelists para ORDER BY.
- rate limit login: 5 solicitudes/15 minutos.
- rate limit refresh: 20 solicitudes/15 minutos.
- Zod parcial.
- response validation en todo card_prices.

### PENDIENTE / NO ACTIVO

helmet y cors están instalados y config/security.js exporta opciones, pero app.js no registra helmet() ni cors(). corsOptions tampoco define credentials true, aunque se usa cookie.

No hay límites específicos para sync, users o administración. No hay logging estructurado, request IDs, métricas ni observabilidad externa.

Errores JWT nativos de auth.middleware.js no se transforman expresamente en 401; al llegar al middleware global pueden acabar en 500.

## 8. Users, roles y ownership

Roles definidos: user y admin.

| Endpoint | Acceso |
|---|---|
| POST /api/users | Público; registro. |
| GET /api/users | Admin autenticado. |
| GET /api/users/email/:email | Admin autenticado. |
| GET /api/users/:id | Propietario o admin. |
| PATCH /api/users/:id | Propietario o admin. |
| DELETE /api/users/:id | Propietario o admin. |
| POST /api/auth/login | Público. |
| POST /api/auth/refresh | Cookie válida. |
| POST /api/auth/logout | Público; revoca cookie si existe. |

user.repository.js no devuelve password salvo findUserForAuthentication. sanitizeUser existe, pero no se usa actualmente.

## 9. TCGs

Archivos: tcg.routes.js, tcg.controller.js, tcg.service.js, tcg.repository.js y tcg.schema.js.

| Método | Endpoint | Acceso |
|---|---|---|
| GET | /api/tcgs | Auth |
| GET | /api/tcgs/:id | Auth |
| POST | /api/tcgs | Admin |
| PATCH | /api/tcgs/:id | Admin |
| DELETE | /api/tcgs/:id | Admin |

Listado: search, page, limit, sortBy name/created_at y sortOrder ASC/DESC. El service calcula offset/totalPages y evita duplicados por nombre. IDs/body/query usan Zod. El efecto de foreign keys al eliminar con dependientes es **NO VERIFICADO EN BASE ACTIVA**.

## 10. Sets

| Método | Endpoint | Acceso |
|---|---|---|
| GET | /api/sets | Auth |
| GET | /api/sets/:id | Auth |
| POST | /api/sets | Admin |
| PATCH | /api/sets/:id | Admin |
| DELETE | /api/sets/:id | Admin |
| POST | /api/sets/sync/pokemon | Admin |

Listado: tcgId, search, page, limit, sortBy name/code/release_date/created_at y sortOrder. Search cubre name, code y external_id. Crear/editar verifica TCG y duplicados por external ID/nombre. Sync upsert usa tcg_id + external_id.

Sync de sets usa el TCG de nombre exacto Pokémon, endpoint /v2/sets, pageSize 100 y orderBy -releaseDate. Normaliza fechas, recorre reciente a antiguo y se detiene en el primer set ya existente. Devuelve received, created, updated, unchanged, skipped, pagesProcessed, stoppedAtExisting y durationSeconds. No hay retry específico. El código incrementa created tras el upsert; no se observa una clasificación efectiva separada de update/unchanged.

## 11. Cards

| Método | Endpoint | Acceso |
|---|---|---|
| GET | /api/cards | Auth |
| GET | /api/cards/:id | Auth |
| POST | /api/cards | Cualquier autenticado |
| PUT | /api/cards/:id | Cualquier autenticado |
| DELETE | /api/cards/:id | Cualquier autenticado |
| POST | /api/cards/sync/pokemon | Cualquier autenticado |

Listado: setId, search, page, limit, sortBy created_at/updated_at/name/card_number/rarity y sortOrder. Search solo por nombre. Crear/editar verifica set y duplicados por external ID/nombre. Upsert por set_id + external_id. No existen schemas Zod conectados a estas rutas.

Sync usa todos los sets de Pokémon, filtra cards con set.id:external_id, page size 250, espera 500ms por request y 1500ms entre sets. Clasifica created/updated/unchanged/skipped. Intenta hasta 15 retries con backoff exponencial para 500/502/503/504, pero el cliente guarda el status en error.details.externalStatus y el sync consulta error.status; la efectividad real es **NO VERIFICADA**.

## 12. Card Prices

Archivos: cards-prices.routes.js, cards-prices.controller.js, cards-prices.service.js, cards-prices.repository.js, cards-prices.schema.js y cards-prices-sync.service.js.

Todas las rutas requieren auth.

| Método | Endpoint | Función |
|---|---|---|
| GET | /api/cards/:cardId/prices | Histórico paginado. |
| GET | /api/cards/:cardId/prices/latest | Último precio. |
| GET | /api/cards/:cardId/prices/stats | Total/min/max/avg. |
| GET | /api/cards/:cardId/prices/variation | Últimos dos y variación. |
| GET | /api/cards/:cardId/prices/aggregations | DATE_TRUNC por day/week/month. |
| POST | /api/cards/:cardId/prices | Crea condition/price/currency/source. |
| POST | /api/sync/cards/prices | Sync masivo. |

Filtros: source y condition. Histórico usa page, limit (1–100), sortOrder. latest usa ORDER BY recorded_at DESC LIMIT 1. variation toma los dos últimos y calcula variación absoluta, porcentaje y direction; porcentaje null si precio previo es cero. stats usa COUNT/MIN/MAX/AVG. aggregations usa DATE_TRUNC con periodo validado por whitelist.

Optimizaciones ya implementadas:

- findCardPricesByCardIds usa ANY con array UUID.
- createCardPrices construye inserción batch parametrizada.
- findLatestCardPricesByCardIds usa DISTINCT ON card_id/condition y recorded_at DESC.
- sync usa batches de 500.
- sync compara contra latest local y omite precios sin cambio.

Limitaciones: el sync sigue siendo secuencial por sets/cards, usa espera y múltiples requests externas; el retry de precios usa espera lineal 1500 por intento, no exponential backoff. No debe marcarse como optimización completa.

## 13. Collection Items

| Método | Endpoint | Acceso |
|---|---|---|
| GET | /api/collection-items | Auth; colección propia. |
| GET | /api/collection-items/:id | Auth; propietario. |
| POST | /api/collection-items | Auth; user ID desde JWT. |
| PUT | /api/collection-items/:id | Auth; propietario. |
| DELETE | /api/collection-items/:id | Auth; propietario. |

Service valida card existente, quantity entero > 0, condition no vacía y reglas:

- isGraded=false implica gradingCompanyId=null y grade=null.
- isGraded=true exige gradingCompanyId y grade.
- grade debe ser numérico entre 0 y 10.
- grading company debe existir.

La actualización es parcial: campos ausentes se leen del item actual y se revalida la combinación. No hay schema Zod.

Filtros: cardId, setId, tcgId, rarity, condition, isGraded, gradingCompanyId, minGrade y maxGrade. Paginación: limit/offset.

Whitelist real:

~~~text
created_at -> ci.created_at
updated_at -> ci.updated_at
quantity   -> ci.quantity
grade      -> ci.grade
card_name  -> c.name
name       -> c.name
~~~

La dirección se reduce a ASC/DESC y se usa NULLS LAST. Valores parametrizados; columna/dirección salen de whitelist.

## 14. Collection avanzada

La implementación actual sí contiene enriquecimiento:

~~~text
collection_items
  ↓ INNER JOIN cards
cards
  ↓ INNER JOIN sets
sets
  ↓ INNER JOIN tcgs
tcgs
  ↓ LEFT JOIN grading_companies
~~~

findCollectionItems y findCollectionItemById usan json_build_object para card, set, tcg y grading_company.

GET /api/collection-items/stats existe. Ejecuta cinco consultas en Promise.all y devuelve:

- summary: totalDistinctCards, totalQuantity, gradedQuantity, ungradedQuantity.
- byCondition.
- bySet.
- byTcg.
- byGradingCompany, solo items graded.

GET /api/collection-items/value existe. El repository usa:

1. CTE latest_prices.
2. DISTINCT ON card_id + condition, ordenado por recorded_at DESC.
3. CTE evaluated_items.
4. quantity × latest price.
5. items evaluated/missing.
6. top 5 valued items.
7. agrupación by set, by TCG y by grading company.

Para items no graded usa el último card_prices por card/condition. Para items graded usa el último graded_card_prices por card/grading_company/grade y no hace fallback silencioso al precio normal. La respuesta incluye contadores separados de items graded evaluados y sin precio, además de información de grading en topValuedItems. La moneda agregada se fija a USD; la política para múltiples monedas sigue pendiente.

Estado: **IMPLEMENTADO EN CÓDIGO; validación de consulta normal realizada; cobertura graded de collection value con un item graded pendiente**.

## 15. Grading Companies

Archivos: grading-companies.routes.js, controller, service, repository y schema.

| Método | Endpoint | Acceso |
|---|---|---|
| GET | /api/grading-companies | Auth |
| GET | /api/grading-companies/:id | Auth |
| POST | /api/grading-companies | Admin |
| PATCH | /api/grading-companies/:id | Admin |
| DELETE | /api/grading-companies/:id | Admin |

Nombre: trim, 1–50 caracteres, duplicados rechazados. ID: UUID. El repository selecciona id, name y created_at. Error PostgreSQL 23503 al borrar se transforma en 409. La relación con collection y graded prices está usada por SQL.

Estado: **IMPLEMENTADO EN CÓDIGO; TESTS Y BASE ACTIVA NO VERIFICADOS**.

## 16. Graded Card Prices

Estado exacto al cierre de esta revisión:

- tabla: verificada en la base activa; schema y FKs documentados en la sección PostgreSQL;
- repository: existe graded-card-prices.repository.js para listado, latest, stats, variation y aggregations;
- service: existe graded-card-prices.service.js para existencia de card, empresa de grading, registro, filtros, paginación, normalización y las cinco consultas;
- controller: existe graded-card-prices.controller.js;
- routes: existen los cinco endpoints GET, el POST /api/cards/:cardId/graded-prices y el importador administrativo POST /api/sync/graded-prices;
- schemas: existe graded-card-prices.schema.js para params, query, body y response;
- sync automático: no existe; hay importador batch administrativo en POST /api/sync/graded-prices y fixture opt-in en scripts/seed-graded-card-prices.js;
- latest/stats/variation/aggregations: implementados como endpoints de consulta.

Por tanto: **PARCIALMENTE IMPLEMENTADO — consultas, registro manual, importación batch, fixture opt-in y conexión inicial con valoración terminados; proveedor de sync automático y pruebas automatizadas pendientes**.

Endpoints disponibles:

~~~http
GET /api/cards/:cardId/graded-prices
GET /api/cards/:cardId/graded-prices/latest
GET /api/cards/:cardId/graded-prices/stats
GET /api/cards/:cardId/graded-prices/variation
GET /api/cards/:cardId/graded-prices/aggregations
POST /api/cards/:cardId/graded-prices
~~~

La implementación actual no debe ampliarse con nuevos campos sin conservar estos nombres verificados.

## 17. Pokémon TCG API

Cliente real: integrations/pokemon-tcg/pokemon-tcg.client.js.

- Base URL: https://api.pokemontcg.io/v2.
- Usa fetch nativo de Node.
- Header X-Api-Key desde POKEMON_TCG_API_KEY.
- Funciones: get set, list sets y list cards.
- Requests: /sets y /cards; params page, pageSize, q y orderBy.
- El cliente marca 429 y 5xx 500/502/503/504 como retryable.
- El cliente no repite por sí mismo; devuelve AppError con metadata.
- HTTP error: POKEMON_TCG_API_ERROR, status local 502.
- JSON inválido: POKEMON_TCG_API_INVALID_RESPONSE, status 502.
- Error de red: POKEMON_TCG_API_UNAVAILABLE, status 503.
- No hay timeout explícito, circuit breaker ni jitter.
- Retry se implementa de forma distinta en los syncs.

## 18. Sync pipeline

POST /api/sync existe y requiere auth + admin.

Pasos de src/syncs/sync.pipeline.service.js:

~~~text
1. syncPokemonSets()
2. syncPokemonCards()
3. syncPokemonCardPrices()
~~~

Devuelve status completed, durationSeconds y resultados sets/cards/prices, con TCG y summary. Se ejecuta secuencialmente. Un error se registra y se propaga; no hay rollback global entre pasos.

Hay un módulo antiguo no usado por app.js: src/services/sync.pipeline.service.js. Importa sets.sync.service.js y cards-prices.sync.services.js, que no existen; un import directo falla con ERR_MODULE_NOT_FOUND. Debe documentarse como legado, no como pipeline activo.

## 19. Zod y validación

Schemas reales:

- auth.schema.js: login.
- user.schema.js: create, params UUID, email params, list y update.
- tcg.schema.js: create, update, params y list.
- set.schema.js: create, update, params y list.
- cards-prices.schema.js: params, queries, create y response schemas.
- graded-card-prices.schema.js: params, queries y response schemas.
- collection-items.schema.js: response schema para collection value.
- grading-companies.schema.js: create, update y params.

validate.middleware.js hace safeParse sobre body/query/params y guarda el resultado en req.validated. En error responde 400 con status, message y errors.

validate-response.middleware.js intercepta res.json, valida el objeto y transforma response inválida en AppError 500. Se usa en card prices, graded prices y collection value.

Inconsistencias: todavía no hay schemas de request para cards, collection items ni syncs; tampoco hay response schemas generales para users, TCGs, sets, cards, collection CRUD/stats o grading companies.

## 20. Error handling

app.errors.js define AppError con message, statusCode, code y details; createAppError lo construye.

error.middleware.js:

- imprime el error en consola;
- si existe statusCode, responde ese status con status/error/message;
- en otro caso responde 500 con Internal server error.

No expone code ni details. PostgreSQL solo recibe tratamiento especial en el delete de grading company para 23503. Errores externos tienen códigos internos pero el cliente no los recibe mediante el middleware global. Errores JWT de access no se convierten expresamente en 401.

## 21. Variables de entorno

Nombres utilizados por código, sin valores:

~~~text
NODE_ENV=development|test|production
PORT=<positive integer, default 3000>
DATABASE_HOST=<host>
DATABASE_PORT=<positive integer, default 5432>
DATABASE_NAME=<database>
DATABASE_USER=<user>
DATABASE_PASSWORD=<secret>
JWT_ACCESS_SECRET=<secret, minimum 32 characters>
JWT_REFRESH_SECRET=<secret, minimum 32 characters>
JWT_ACCESS_EXPIRES_IN=<duration, default 15m>
JWT_REFRESH_EXPIRES_IN=<duration, default 7d>
CORS_ORIGIN_DEV=<URL>
CORS_ORIGIN_PRODUCTION=<URL>
POKEMON_TCG_API_KEY=<secret/API key>
~~~

env.js valida al importar y termina el proceso si faltan/son inválidas. En producción rechaza placeholders inseguros de JWT. database.js usa los campos DATABASE_*. El cliente externo usa POKEMON_TCG_API_KEY. security.js elige origen CORS por NODE_ENV aunque CORS no está registrado en app.

## 22. Scripts auxiliares

Scripts package.json:

~~~text
pnpm dev       -> nodemon src/server.js
pnpm start     -> node src/server.js
pnpm test      -> vitest
pnpm test:run  -> vitest run
~~~

check_schema.js es diagnóstico de solo lectura. Consulta columnas y FKs de graded_card_prices y cierra el pool. No forma parte del arranque ni modifica DB. No hay migrations, seeds ni test scripts independientes.

## 23. Testing

Resultado real de esta revisión:

- Import de src/app.js: OK; verifica carga de módulos, no endpoints ni DB.
- pnpm.cmd test:run: OK; 1 archivo y 4 tests de contratos/import graded.
- node check_schema.js: falló con ECONNREFUSED en localhost:5432.
- pnpm.cmd exec eslint src: falló antes de analizar porque falta el paquete globals usado por eslint.config.js.
- Import directo del pipeline legado: falló por módulos inexistentes.

Conclusión: **EXISTE UNA SUITE INICIAL DE TESTS AUTOMATIZADA**, todavía limitada a contratos y validaciones graded; faltan tests de repository, API, ownership, collection y sync.

roadmap.md afirma que Collection CRUD está implementado y probado, pero no hay tests, logs, fixtures ni script reproducible: **PRUEBA MANUAL / PLANIFICADO — NO VERIFICADO EN CÓDIGO**. No puede afirmarse desde este repo que auth, catálogo, prices, collection, grading o sync hayan sido probados contra una DB real.

## 24. Discrepancias detectadas

| Problema | Causa/evidencia | Impacto | Estado |
|---|---|---|---|
| Pipeline legacy roto | Importa archivos inexistentes en src/services. | Ese módulo no puede cargarse. | No usado por app.js; no corregido. |
| Base local inaccesible | PostgreSQL rechaza localhost:5432. | No se puede verificar DDL ni ejecutar endpoints DB. | Limitación de revisión. |
| Sin suite de tests | Vitest no encuentra test/spec. | No hay cobertura automatizada. | Pendiente. |
| ESLint roto | Falta globals, requerido por config. | Lint no puede arrancar. | No corregido. |
| Helmet/CORS no activos | Dependencias/opciones no usadas por app.js. | Seguridad HTTP incompleta. | Pendiente. |
| Retry de cards inconsistente | Integration usa details.externalStatus; cards sync usa error.status. | Retry real no confirmado. | No corregido. |
| Counters de sets | Upsert incrementa created; no se ve update/unchanged efectivo. | Summary puede ser engañoso. | Estado actual documentado. |
| JWT errors | auth middleware propaga error nativo. | Un token inválido puede acabar como 500. | Mapping 401 pendiente. |
| Validación desigual | Cards/collection no tienen schemas; prices sí. | Contratos inconsistentes. | Zod completa pendiente. |
| Graded prices parcial | Hay consultas HTTP, registro manual y fixture, pero no sync automático. | La integración todavía no tiene suite automatizada ni proveedor de sync definido. | En progreso. |

## 25. Decisiones técnicas observadas

- PostgreSQL relacional.
- ES Modules.
- Repository Pattern y Service Layer.
- Access/refresh JWT separados.
- Refresh rotation y token families.
- SHA-256 del refresh en DB.
- bcrypt cost 12.
- Zod progresivo.
- SQL parametrizado.
- Whitelists para ORDER BY y periodos.
- json_build_object para collection enriquecida.
- CTE y DISTINCT ON para latest/value.
- Promise.all para queries independientes.
- Cliente Pokémon separado de syncs.
- Batch insert de 500 y deduplicación contra latest local.

No son propuestas nuevas; son decisiones que ya aparecen en el código.

## 26. Estado de módulos

“Implementado” significa que existe y está conectado; no implica prueba automatizada ni verificación de DB activa.

- Auth: implementado.
- Users: implementado.
- TCGs: implementado.
- Sets: implementado y sync presente.
- Cards: implementado y sync presente; validación Zod incompleta.
- Card Prices: implementado, con histórico/latest/stats/variation/aggregations y sync.
- Collection Items: CRUD + enriquecimiento + filtros + stats + value implementados.
- Grading Companies: CRUD y permisos implementados.
- Graded Card Prices: parcialmente implementado; listado/latest/stats/variation/aggregations presentes, sync y pruebas con datos pendientes.
- Pokémon integration: cliente y syncs implementados; retry/timeout tienen limitaciones.
- Pipeline: implementado en src/syncs; existe archivo legacy roto.

## 27. Roadmap actualizado

| Nº | Área | Estado real |
|---:|---|---|
| 01 | Collection avanzada | **Completada en código**; tests/DB no verificados. |
| 02 | Grading Companies | **Completada en código**; tests/DB no verificados. |
| 03 | Graded Card Prices | **En progreso**: cinco consultas implementadas; sync y pruebas con datos pendientes. |
| 04 | Valoración de colección | **En progreso**: normal y graded conectados; falta probar un item graded y definir currency. |
| 05 | Catálogo avanzado | Pendiente; cards tiene búsqueda limitada. |
| 06 | Validación Zod completa | Parcial; faltan cards, collection, sync y responses generales. |
| 07 | Limpieza Controller/Service/Repository | Pendiente/parcial; validación en controllers y legacy roto. |
| 08 | Testing profesional | Pendiente; no hay tests. |
| 09 | Seguridad avanzada | Parcial; JWT/rate/cookies sí, Helmet/CORS no activos. |
| 10 | Índices y optimización DB | No verificable sin DDL/DB activa. |
| 11 | Transacciones | Parcial; rotation sí, pipeline global no. |
| 12 | Logging/Observabilidad | Pendiente; console logging. |
| 13 | Swagger/OpenAPI | Pendiente. |
| 14 | Background Jobs | Pendiente; sync sigue en HTTP. |
| 15 | Production Readiness | Pendiente. |
| 16 | Frontend | Fuera del alcance; existe client, estado no analizado. |

roadmap.md todavía presenta Collection avanzada como siguiente bloque, pero el código actual ya contiene CRUD, joins, filtros, stats/value y grading companies. El código actual tiene prioridad.

## 28. Próximo módulo recomendado

**Graded Card Prices**

Las funcionalidades de consulta ya implementadas son:

~~~http
GET /api/cards/:cardId/graded-prices
~~~

Después:

~~~http
GET /api/cards/:cardId/graded-prices/latest
GET /api/cards/:cardId/graded-prices/stats
GET /api/cards/:cardId/graded-prices/variation
GET /api/cards/:cardId/graded-prices/aggregations
~~~

El modelo verificado relaciona card + grading_company + grade + graded_card_price. La valoración ya está conectada para seleccionar el último precio graded por esa combinación y tiene response schema Zod. El siguiente trabajo es probar con filas reales y definir el sync graded.

## 29. Guía para continuar

1. Trabajar desde api/ y conservar ES Modules.
2. Mantener verificado el schema de graded_card_prices y auditar el resto de tablas antes de crear migrations o índices.
3. Mantener Route → Middleware → Controller → Service → Repository.
4. Seguir el estilo de card_prices para histórico/latest/stats/variation/aggregations.
5. Añadir schemas Zod de params/query/body/response.
6. Mantener SQL parametrizado y whitelists.
7. Añadir tests antes de declarar el módulo probado.
8. Usar src/syncs/sync.pipeline.service.js como pipeline activo; src/services/sync.pipeline.service.js es legacy roto/no usado.

## 30. Limitaciones de esta documentación

- La base PostgreSQL fue verificada para graded_card_prices en el puerto 2203; el resto de tablas todavía requiere una auditoría completa de metadata.
- No se verificaron todos los constraints, índices ni defaults del esquema completo.
- No hay suite automatizada.
- Las afirmaciones de roadmap sobre pruebas se marcaron como no verificadas.
- No se analizó frontend ni se modificó código de aplicación.
