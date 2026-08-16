# TCG Wallet API — Plan de implementación del roadmap

Fecha base: 2026-08-16

Este documento convierte el roadmap en un plan ejecutable. No implementa código. La fuente de verdad del estado actual es PROJECT_CONTEXT.md; el código actual prevalece sobre el roadmap histórico.

## Estado de ejecución actual

### Registro de avance — 2026-08-16

- Se cerró la inconsistencia del pipeline legacy: `src/services/sync.pipeline.service.js` ahora re-exporta el pipeline único de `src/syncs`.
- Se centralizó la normalización de `sortOrder` mediante `src/schemas/common.schema.js` para TCGs, sets, cards, colección y usuarios.
- Se agregaron pruebas de filtros y contratos del catálogo.
- `pnpm.cmd test:run` pasó con 16 archivos y 82 tests, incluyendo 9 pruebas HTTP end-to-end, readiness, métricas, OpenAPI, jobs y pruebas de redacción del logger.
- `pnpm.cmd db:explain` inspeccionó cuatro consultas críticas y dejó preparada una migration para los scans secuenciales detectados.
- `pnpm db:migrate` fue ejecutado en desarrollo con runner versionado, advisory lock y transacciones; `001_critical_read_indexes.sql` quedó registrada en `schema_migrations`.
- Se implementó logging JSON estructurado, redacción recursiva de secretos, request IDs y trazabilidad HTTP; `error.middleware` registra errores correlacionados sin exponer secretos.
- Se migraron al logger los logs de infraestructura, sincronizadores, servicios de precios, sync lock y validación de responses; `api/src` ya no contiene logs directos fuera de `utils/logger.js`.
- Se agregaron métricas HTTP agregadas por endpoint, liveness, readiness con PostgreSQL y stack traces controlados por entorno.
- Se publicó `GET /api/docs/openapi.json` con un contrato OpenAPI 3.0.3 de 40 paths y 61 operaciones, y se agregó `pnpm.cmd check:openapi`.
- Se implementó una cola interna de sync jobs para sets, cards, prices y pipeline, con `202 Accepted`, consulta de estado, resumen, duración, error seguro y bloqueo de concurrencia.
- Validación actual: `pnpm.cmd test:run` pasa con 16 archivos y 82 tests; `pnpm.cmd test:integration` pasa con 5 tests; `pnpm.cmd check:openapi` y `pnpm.cmd exec eslint src tests scripts` pasan sin errores ni warnings.
- Se agregó `globals` a las dependencias de desarrollo para hacer ejecutable ESLint.
- `pnpm.cmd db:check:schema` inventarió las diez tablas principales, columnas, constraints e índices de PostgreSQL sin modificar datos.
- `pnpm.cmd test:integration` pasó con 5 tests de repositories contra PostgreSQL, incluyendo persistir, reclamar y completar un job real.

- Fase 0: en progreso avanzado. PostgreSQL está configurado en el puerto 2203 y el inventario completo de tablas, columnas, constraints e índices ya fue verificado; existe runner de migrations y `001_critical_read_indexes.sql` está aplicada en desarrollo.
- Fase 1: en progreso. Ya existen los cinco endpoints de consulta, el registro manual, el importador batch administrativo y el fixture ejecutable de graded prices con repository, service, controller, routes y schemas Zod; el proveedor de sync automático sigue pendiente.
- Fase 2: **finalizada en alcance funcional**. `GET /api/collection-items/value` separa precios normales y graded, incluye contadores y desglose por grading company; para graded usa card, grading company y grade, sin fallback al precio normal. La política actual evalúa exclusivamente precios USD; la conversión multicurrency queda como ampliación futura.
- Fase 3: en progreso. `GET /api/cards` ya admite filtros por TCG, set, nombre, rareza, número y external ID; el detalle de card incluye set, TCG, últimos precios normales y resumen de la colección del usuario. Se ampliaron las pruebas y se normalizó `sortOrder` en TCGs, sets, cards, colección y usuarios.
- Fase 4: en progreso. Los schemas de auth/users y los contratos principales están conectados; se añadió un schema común para normalizar `sortOrder`. Faltan respuestas generales de módulos menores y normalización adicional.
- Fase 5: en progreso. El pipeline duplicado roto fue reemplazado por un shim de compatibilidad que re-exporta la única implementación activa bajo `src/syncs`.
- Fase 7: en progreso. Helmet, CORS con credenciales, límite JSON, rate limits, autorización admin, timeout de integraciones, timeouts PostgreSQL y advisory lock distribuido están implementados; rate limits distribuidos y configuración de producción siguen pendientes.
- Validación realizada: app import OK; card inexistente devuelve 404; card existente sin precios graded devuelve lista vacía con paginación válida; la response pasa el schema Zod.
- Datos actuales: 20.479 cards, 1 grading company de desarrollo y 2 registros en graded_card_prices creados por el fixture.
- Validación adicional: la valoración de colección ejecutó correctamente contra la base activa; el ítem existente no tenía precio y quedó contabilizado como missing.
- Fixture validado: `pnpm db:seed:graded` crea, de forma opt-in e idempotente, dos capturas históricas para una card y grading company existentes; las cinco consultas graded respondieron y pasaron sus schemas.
- Validación adicional: `pnpm.cmd test:run` OK con 16 archivos y 82 tests de contratos, catálogo, servicios, colección, precios, API HTTP, autorización, JWT, refresh rotation, hardening, operaciones, logging, OpenAPI y jobs.
- Validación adicional: `pnpm.cmd test:integration` OK con 1 archivo y 5 tests de repositories contra PostgreSQL.
- Validación adicional: `pnpm.cmd db:explain` OK antes y después de la migration; los índices fueron verificados y las tablas pequeñas aún pueden elegir `Seq Scan` por coste estimado.
- Validación adicional: `pnpm.cmd exec eslint src tests` OK sin errores ni warnings.
- Smoke test validado: `pnpm check:graded-value` creó temporalmente un item graded, comprobó valor total `250` y desglose por grading company, y limpió los datos al finalizar.
- Siguiente tarea: ampliar tests de escritura aislados y continuar la limpieza de capas; optimizar consultas restantes con volumen real.

## 1. Estado inicial

### Ya implementado en código

- Auth con access/refresh JWT.
- Refresh token rotation, token families y reuse detection.
- Users, roles y ownership.
- CRUD de TCGs, sets y cards.
- Sincronización de sets/cards/precios desde Pokémon TCG API.
- Card prices normales: histórico, latest, stats, variation, aggregations y batch sync.
- Collection items CRUD.
- Collection avanzada: joins, filtros, ordenamiento seguro, stats y value.
- CRUD de grading companies.

### Pendiente o incompleto

- Graded Card Prices completo.
- Valoración de collection usando precios graded.
- Catálogo avanzado parcialmente implementado; faltan cobertura y normalización final.
- Zod consistente para todos los módulos y responses.
- Limpieza de capas y eliminación del pipeline legacy roto.
- Testing automatizado.
- Activación de Helmet/CORS y protección adicional de endpoints costosos.
- DDL/migrations, índices y constraints verificables.
- Transacciones restantes.
- Logging/observabilidad: **finalizada**; logger, métricas HTTP, health/readiness y logs de dominio implementados.
- Persistencia/distribución multiinstancia de jobs, production readiness y frontend.
- Background Jobs.
- Production readiness.
- Frontend completo.

### Bloqueadores iniciales

Antes de confiar en cualquier cambio de persistencia se necesita una PostgreSQL disponible y el DDL real. El repositorio ya contiene un runner de migrations y una migration aplicada en desarrollo; falta ampliar el DDL reproducible y validar producción.

## 2. Principios de ejecución

1. Cada fase termina con código, tests, documentación y criterio de aceptación.
2. No se diseñan queries sobre graded_card_prices hasta verificar columnas, tipos y foreign keys.
3. No se marca una funcionalidad como completada por existir el archivo: debe existir una prueba reproducible.
4. Los cambios de base de datos se hacen mediante migrations versionadas.
5. Los controllers no contienen reglas de negocio; los services no contienen SQL.
6. Toda entrada externa debe validarse con Zod.
7. Toda interpolación SQL dinámica debe proceder de una whitelist.
8. Los endpoints costosos de sincronización deben tener límites, autorización y observabilidad.
9. Se conserva compatibilidad con los endpoints actuales salvo cambio explícito documentado.
10. Después de cada fase se ejecutan lint, tests unitarios, tests de integración y smoke tests disponibles.

## 3. Orden y dependencias

~~~text
Fase 0  Baseline, DB y correcciones de bloqueadores
   ↓
Fase 1  Graded Card Prices
   ↓
Fase 2  Valoración graded
   ↓
Fase 3  Catálogo avanzado
   ↓
Fase 4  Zod y contratos
   ↓
Fase 5  Limpieza arquitectónica
   ↓
Fase 6  Testing profesional
   ↓
Fase 7  Seguridad avanzada
   ↓
Fase 8  Migrations, constraints, índices y optimización
   ↓
Fase 9  Transacciones restantes
   ↓
Fase 10 Logging y observabilidad
   ↓
Fase 11 OpenAPI
   ↓
Fase 14 Background Jobs
   ↓
Fase 15 Production Readiness
   ↓
Fase 16 Frontend
~~~

Fase 0 es obligatoria. Fases 1 y 2 son la siguiente entrega funcional. Fases 4–6 deben solaparse de forma controlada, pero ningún módulo nuevo debe quedar sin tests.

## 4. Fase 0 — Baseline técnico

### Objetivo

Hacer reproducible el entorno de desarrollo y conocer el schema real antes de cambiar DB.

### Trabajo

- Levantar PostgreSQL local o configurar una instancia de desarrollo.
- Obtener y versionar el DDL actual.
- Ejecutar check_schema.js y ampliar el diagnóstico solo si hace falta para lectura de metadata.
- Confirmar tablas, tipos, nullability, defaults, PK, FK, unique, check e índices.
- Confirmar especialmente graded_card_prices.
- Resolver el error de dependencia/configuración que impide ejecutar ESLint.
- Definir comandos oficiales de test, lint y formato.
- Registrar versión de Node, PNPM y PostgreSQL.
- Crear fixture/seed de desarrollo reproducible, sin secretos.
- Documentar DATABASE_URL o variables equivalentes sin valores reales.

### Entregables

- Schema documentado y versionado.
- Baseline reproducible.
- Lint ejecutable.
- Primer comando de tests ejecutable, aunque inicialmente tenga cobertura mínima.
- Lista de discrepancias cerrada o clasificada.

### Criterio de salida

Un desarrollador puede instalar dependencias ya declaradas, conectar a PostgreSQL de desarrollo, ejecutar lint, ejecutar tests y consultar el schema sin depender de configuración manual no documentada.

## 5. Fase 1 — Graded Card Prices

### Objetivo

Implementar el módulo prioritario que actualmente no existe.

### Diseño previo

Verificar en la DB:

- nombre exacto de la tabla;
- columnas de card, grading company, grade, price, currency, source y recorded_at;
- nombres de FK;
- precision/scale del precio;
- constraints de grade;
- índices;
- relación con cards y grading_companies.

No asumir que el schema esperado coincide con el roadmap.

### Componentes

Crear, manteniendo el patrón existente:

- graded-card-prices.routes.js;
- graded-card-prices.controller.js;
- graded-card-prices.service.js;
- graded-card-prices.repository.js;
- graded-card-prices.schema.js.

### Endpoints

Primero:

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

### Filtros y contratos

Definir contra el schema real:

- gradingCompanyId;
- grade o rango de grade;
- source;
- currency;
- pagination;
- sort order;
- period para agregaciones.

Crear response schemas para historical/latest/stats/variation/aggregations. Validar cardId y filtros antes del service.

### Reglas

- Verificar que la card exista.
- Verificar grading company cuando se filtre o cree relación.
- Mantener SQL parametrizado.
- Usar whitelist para columnas/periodos dinámicos.
- Definir comportamiento 404 cuando no hay datos.
- Normalizar numeric/decimal antes de responder.
- No mezclar precios normales con graded prices.

### Tests de salida

- Listado sin filtros.
- Filtro por grading company.
- Filtro por grade.
- latest.
- stats.
- variation con cero, uno y varios registros.
- aggregations por cada periodo permitido.
- card inexistente.
- UUID inválido.
- intento de ordenar por campo no permitido.
- response schema válida.

## 6. Fase 2 — Valoración graded

### Objetivo

Incluir el valor específico de cartas graded sin romper el cálculo normal.

### Trabajo

- Extender la consulta de valoración para distinguir items graded y no graded.
- Para no graded, mantener card_prices por card/condition.
- Para graded, elegir graded_card_prices por card, grading company, grade, condition/source según modelo real.
- Definir qué ocurre cuando falta precio graded.
- Mantener contadores separados: items evaluados normales, items evaluados graded y missing.
- Añadir top valued items con información de grading.
- Añadir agrupación por set, TCG y grading company.
- Documentar currency y política si existen varias currencies.
- Añadir response schema.

### Criterio de salida

GET /api/collection-items/value explica y devuelve correctamente la valoración normal y graded, sin usar un precio normal como sustituto silencioso de un precio graded.

## 7. Fase 3 — Catálogo avanzado

### Cards

Ampliar GET /api/cards con:

- búsqueda por nombre;
- setId;
- tcgId mediante join;
- rarity;
- card_number;
- external_id;
- paginación consistente;
- sorting seguro por whitelist.

Añadir detalle enriquecido de card con set, TCG, precios latest y, si procede, resumen de la colección del usuario.

### Sets y TCGs

- Normalizar contratos de paginación.
- Añadir filtros que falten y confirmar límites.
- Mantener búsqueda parametrizada.
- Definir respuestas coherentes entre TCG, sets y cards.

### Criterio de salida

El catálogo permite localizar una card por los filtros definidos, devuelve relaciones sin N+1 innecesario y tiene tests para filtros, sorting, paginación y detalle.

## 8. Fase 4 — Zod y contratos completos

### Request schemas

Crear schemas separados para params, query y body de:

- users;
- auth;
- tcgs;
- sets;
- cards;
- card_prices;
- collection_items;
- grading_companies;
- graded_card_prices;
- sync endpoints.

Mover validación puramente HTTP desde controllers a validate.middleware.js. Mantener en service las reglas que requieren DB o negocio.

### Response schemas

Añadir contratos para:

- users;
- auth;
- TCGs;
- sets;
- cards;
- collection items;
- collection stats/value;
- grading companies;
- sync summaries;
- graded prices.

### Normalización

Centralizar helpers para:

- page/limit/offset;
- sortBy/sortOrder;
- UUID;
- fechas;
- enums de condition;
- grades;
- currency;
- source.

### Criterio de salida

Ninguna ruta pública acepta body/query/params sin schema, salvo endpoints que explícitamente no reciben entrada. Todas las responses principales tienen contrato o una razón documentada.

## 9. Fase 5 — Limpieza de arquitectura

### Trabajo

- Eliminar o retirar el pipeline legacy de src/services/sync.pipeline.service.js tras confirmar que no tiene consumidores.
- Mantener un único pipeline activo bajo src/syncs.
- Reducir validación duplicada en controllers/services.
- Homogeneizar nombres de controllers y services.
- Hacer que controllers usen req.validated donde exista schema.
- Revisar controllers que devuelven formas distintas, especialmente users, TCGs, sets y cards.
- Mantener repositories limitados a SQL.
- Extraer lógica repetida de paginación y sorting.
- Documentar cualquier excepción justificada.

### Criterio de salida

No hay imports rotos en módulos alcanzables ni archivos legacy ambiguos. El flujo de cada módulo es identificable y consistente.

## 10. Fase 6 — Testing profesional

### Unit tests

Cubrir:

- services;
- schemas;
- JWT helpers;
- token hashing/families;
- validación de collection;
- cálculos de prices/value;
- retry decision y backoff;
- normalización de respuestas.

Mockear repositories e integración externa.

### Repository/integration tests

Contra PostgreSQL de test:

- SELECT/INSERT/UPDATE/DELETE;
- FK y unique;
- paginación;
- filtros;
- sorting;
- joins;
- latest;
- aggregations;
- collection stats/value;
- graded prices.

Cada suite debe aislar datos y limpiar después.

### API tests

Usar el runner existente y una herramienta HTTP de test que se añada solo si se aprueba como dependencia del proyecto. Cubrir:

- health;
- registro/login/refresh/logout;
- roles;
- ownership;
- TCGs/sets/cards;
- prices;
- collection CRUD/stats/value;
- grading companies;
- graded prices;
- sync authorization y errores.

### Criterio de salida

La suite automatizada corre desde cero, falla ante regresiones de contrato y cubre los flujos críticos de autenticación, ownership, catálogo, colección, precios y graded prices.

## 11. Fase 7 — Seguridad avanzada

### Middleware y app

- ✅ Registrar Helmet con opciones revisadas.
- ✅ Registrar CORS con origin por entorno y credentials true si el cliente usa cookies.
- ✅ Revisar métodos y headers permitidos; también se limitó el body JSON a 1 MB.
- ✅ Verificar las opciones actuales de cookie; queda validar el despliegue HTTPS/CSRF.

### Rate limiting

✅ Separar límites para:

- login;
- refresh;
- users;
- sync pipeline;
- card sync;
- price sync.

✅ Definir respuestas estándar.
Pendiente: estrategia distribuida si hay más de una instancia.

### Auth y errores

- ✅ Convertir errores JWT inválidos/expirados en 401.
- Evitar filtrar detalles sensibles.
- Revisar reuse detection bajo concurrencia.
- Revisar revocación cuando se elimina un usuario.
- Añadir protección contra CSRF si la arquitectura cookie lo requiere.
- ✅ Añadir payload/JSON size limits.
- ✅ Revisar autorización de mutaciones de cards, prices y syncs.
- ✅ Timeout del cliente externo, timeouts PostgreSQL y advisory lock distribuido para sincronizaciones.
- Pendiente: rate limits distribuidos, CSRF y revocación completa al eliminar usuarios.

### Criterio de salida

Security tests confirman headers, CORS, cookies, rate limits, JWT status codes, roles, ownership y no exposición de secretos.

## 12. Fase 8 — DB, migrations, constraints e índices

### Migrations

Adoptar una herramienta compatible con el stack o un sistema SQL versionado. Antes de escribir migrations, exportar/validar el schema actual.

Migrations mínimas a revisar:

- users;
- refresh_tokens;
- tcgs;
- sets;
- cards;
- card_prices;
- collection_items;
- grading_companies;
- graded_card_prices.

### Constraints

Verificar/crear, según compatibilidad con datos existentes:

- PK UUID;
- FK y acciones ON DELETE;
- unique users email/username;
- unique TCG name;
- unique set per TCG/external_id;
- unique card per set/external_id;
- positive quantity;
- grade 0–10;
- is_graded coherente con grading_company_id/grade;
- price no negativo;
- timestamps/defaults.

### Índices

Medir antes de crear. Candidatos:

- refresh_tokens token_hash y user/family/revoked_at;
- sets tcg_id/external_id;
- cards set_id/external_id;
- cards search fields si procede;
- card_prices card_id/recorded_at;
- card_prices card_id/condition/source/recorded_at;
- graded_card_prices según filtros reales;
- collection_items user_id;
- collection_items user_id/card_id;
- collection_items card_id/condition;
- collection_items grading_company_id.

### Criterio de salida

Migrations reproducibles, rollback definido, explain plans de queries críticas y no se agregan índices sin evidencia.

## 13. Fase 9 — Transacciones restantes

Revisar operaciones multi-escritura:

- refresh rotation ya usa transacción; probar concurrencia.
- creación/actualización de collection si evoluciona a varias tablas.
- sync que modifique varias entidades y necesite consistencia.
- operaciones graded que actualicen precio y metadata.
- cambios de usuario y sesiones si deben ser atómicos.

Definir aislamiento, manejo de deadlocks, rollback y límites de transacción. No envolver todo en transacciones por defecto: solo operaciones que lo necesiten.

## 14. Fase 10 — Logging y observabilidad

Estado: **Finalizado**. Logger estructurado, redacción de secretos, request IDs, request logging HTTP, métricas agregadas, liveness/readiness y stack traces controlados están implementados y cubiertos por tests.

### Logger

Sustituir console logging disperso por logger estructurado con niveles info/warn/error/debug. Redactar tokens, passwords, API keys y datos sensibles.

### Request logging

Registrar:

- request ID;
- método/path;
- status;
- duración;
- user ID si existe;
- error code;
- correlation ID.

### Métricas y health

- duración y errores por endpoint;
- queries lentas;
- pool de PostgreSQL;
- duración/contadores de cada sync;
- rate-limit hits;
- health de app y DB;
- readiness/liveness separados si se despliega en contenedores.

### Criterio de salida

Un error de producción puede correlacionarse con request, usuario técnico, endpoint y operación sin exponer secretos.

## 15. Fase 11 — Swagger/OpenAPI

Estado: **Finalizado**. El contrato OpenAPI 3.0.3 está versionado en `src/docs/openapi.js`, se sirve desde `GET /api/docs/openapi.json` y se valida con `pnpm check:openapi`. Incluye 40 paths, 61 operaciones, autenticación Bearer, cookie de refresh, parámetros, bodies, respuestas y errores estándar.

Documentar:

- Bearer auth;
- cookie refresh;
- todos los endpoints;
- params/query/body;
- response success;
- errores 400/401/403/404/409/429/500;
- paginación;
- filtros;
- ejemplos seguros.

Generar o servir la especificación desde un lugar versionado. Mantener OpenAPI sincronizado con los schemas Zod mediante una estrategia definida.

## 16. Fase 14 — Background Jobs

Estado: **Finalizado**. La cola persistente PostgreSQL ejecuta jobs de sets, cards, prices y pipeline fuera del ciclo HTTP; usa claim con `FOR UPDATE SKIP LOCKED`, índice único para impedir jobs activos concurrentes y recuperación de jobs obsoletos al iniciar. Existen endpoints admin y tests de estados, concurrencia, persistencia de schema y flujo real persistir-reclamar-completar; los endpoints legacy fueron convertidos en disparadores `202`.

Extraer syncs largos del request HTTP.

### Diseño mínimo

- job de sets;
- job de cards;
- job de prices;
- pipeline coordinador;
- estado de job;
- inicio/fin/duración;
- contadores;
- error resumido;
- retry controlado;
- lock para impedir ejecuciones concurrentes;
- endpoint admin para iniciar/consultar si se necesita.

El endpoint actual puede conservarse como compatibilidad o convertirse en disparador de job, pero no debe mantener una request abierta durante todo el sync.

## 17. Fase 15 — Production Readiness

Estado: **En progreso**.

Implementado en este bloque: graceful shutdown centralizado en `src/server.js`, manejo de `SIGTERM`/`SIGINT`, detención de la cola persistente, cierre ordenado del servidor HTTP y del pool PostgreSQL, timeout de apagado configurable mediante `SHUTDOWN_TIMEOUT_MS`, readiness `503` durante el drenaje y exigencia de `DATABASE_SSL=true` en producción. También existen workflow `.github/workflows/backend-ci.yml`, smoke test `check:smoke`, scripts `db:backup`/`db:restore` con confirmación explícita y `DEPLOYMENT_RUNBOOK.md`. Docker/Compose queda diferido por decisión de alcance. La prueba HTTP cubre el estado no disponible durante el shutdown.

La auditoría `pnpm audit --prod` no reportó vulnerabilidades conocidas en las dependencias de producción.

Se añadió `scripts/monitor-health.js` para comprobaciones puntuales o continuas de liveness/readiness, con umbral de fallos consecutivos y webhook opcional. La integración con el sistema real de alertas queda pendiente de staging.

Pendiente para cerrar la fase: ejecutar staging reproducible, backup/restore real, rollback operativo, conectar monitoring/alertas y completar la revisión final de vulnerabilidades.

Checklist:

- variables por entorno;
- secrets fuera del repositorio;
- CORS/HTTPS/cookies revisados;
- Helmet activo;
- migrations automáticas controladas;
- graceful shutdown;
- SIGTERM/SIGINT;
- pool tuning;
- timeouts;
- payload limits;
- Docker/Compose: diferido, no forma parte del alcance actual;
- CI/CD;
- backups y restore probado;
- monitoring/alertas;
- logging estructurado;
- health/readiness;
- rate limits distribuidos;
- documentación de despliegue;
- política de rollback;
- revisión de vulnerabilidades.

Criterio de salida: despliegue reproducible en un entorno staging, smoke tests exitosos, rollback probado y checklist de seguridad aprobado.

## 18. Fase 16 — Frontend

El frontend está fuera del análisis actual, pero el roadmap lo incluye como fase final.

Orden funcional:

1. autenticación y refresh.
2. dashboard con stats/value.
3. catálogo de TCGs/sets/cards.
4. detalle de card con precios normales y graded.
5. colección CRUD.
6. filtros y ordenamiento.
7. grading.
8. historial y gráficas de precios.
9. estados de carga/error.
10. responsive y accesibilidad.

Debe consumir contratos OpenAPI estables y no depender de campos no documentados.

## 19. Entregas sugeridas

### Entrega A — Base y graded prices

Fases 0 y 1. Resultado: DB verificable, primer endpoint graded prices y tests de repository/service/API.

### Entrega B — Valor y catálogo

Fases 2 y 3. Resultado: valoración graded y catálogo avanzado.

### Entrega C — Contratos y calidad

Fases 4, 5 y 6. Resultado: Zod completo, arquitectura consistente y suite automatizada.

### Entrega D — Seguridad y persistencia

Fases 7, 8 y 9. Resultado: security hardening, migrations, índices y transacciones.

### Entrega E — Operación

Fases 10, 11, 12 y 13. Resultado: observabilidad, OpenAPI, jobs y producción.

### Entrega F — Producto

Fase 14. Resultado: frontend conectado a contratos estables.

## 20. Definition of Done global

El roadmap se considera completado cuando:

- todos los módulos tienen route/controller/service/repository o una razón documentada para no tenerlos;
- graded prices está implementado y conectado a collection value;
- requests y responses críticas tienen contratos;
- no existen imports rotos alcanzables;
- migrations reproducen la DB;
- constraints e índices están verificados;
- tests automatizados cubren auth, permisos, catálogo, precios, collection, grading y sync;
- errores devuelven status/código consistente;
- Helmet, CORS, cookies y rate limits están configurados;
- logs y métricas permiten diagnosticar producción;
- OpenAPI está actualizado;
- syncs largos pueden ejecutarse como jobs;
- staging y producción tienen despliegue, backups, monitoring y rollback documentados;
- frontend consume exclusivamente contratos documentados.

## 21. Primera tarea concreta

La primera tarea de implementación es la Fase 0. No comenzar por crear graded-card-prices.repository.js.

Secuencia inmediata:

1. disponer de PostgreSQL de desarrollo;
2. verificar metadata de graded_card_prices y todas las tablas relacionadas;
3. resolver la ejecución de lint;
4. crear baseline de tests y fixtures;
5. documentar el schema confirmado;
6. comenzar Fase 1 con GET /api/cards/:cardId/graded-prices.
