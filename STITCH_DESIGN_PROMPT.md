# Prompt para Google Stitch — TCG Wallet

## Objetivo

Diseña un boceto completo de una aplicación web responsive llamada **TCG Wallet**, una plataforma para gestionar colecciones de cartas coleccionables, consultar catálogos, analizar precios históricos y valorar cartas normales y graded.

El diseño debe cubrir desktop, tablet y mobile. Crea un sistema visual consistente y reutilizable, no pantallas aisladas. La interfaz debe sentirse como una mezcla entre una app fintech de análisis de activos y una plataforma premium de coleccionismo TCG: clara, confiable, visual, moderna y orientada a datos.

No diseñes funcionalidades que no existan en el backend actual. Cuando una funcionalidad esté pendiente, represéntala como estado futuro, placeholder o sección deshabilitada, nunca como una función ya disponible.

## Contexto funcional real

El backend soporta actualmente:

- Registro, login, logout y refresh de sesión.
- Usuarios, roles `user` y `admin`, ownership de recursos y cambio de contraseña.
- Catálogo de TCGs, sets y cards.
- Sincronización de sets, cards y precios normales desde Pokémon TCG API.
- Precios normales históricos por condición, fuente y fecha.
- Último precio, estadísticas, variación y agregaciones por día, semana y mes.
- Colección personal por usuario.
- Items normales y graded.
- Grading companies con CRUD administrativo.
- Valoración de colección normal y graded.
- Precios graded históricos por card, empresa de grading y grade.
- Registro manual de precios graded.
- Importación batch administrativa de precios graded.
- Fixture de desarrollo para datos graded.

Restricciones reales que deben reflejarse en el diseño:

- La valoración agregada actual trabaja exclusivamente con precios en USD.
- Un item graded necesita empresa de grading y grade entre 0 y 10.
- Un item no graded no debe mostrar empresa ni grade.
- La valoración graded no utiliza silenciosamente el precio normal como fallback.
- El sync automático de precios graded todavía no existe. Diseñar únicamente la importación batch administrativa y una tarjeta informativa de proveedor futuro.
- Las respuestas pueden estar vacías: todos los módulos necesitan estados empty, loading y error.

## Usuarios y permisos

### Usuario autenticado normal

Puede:

- Consultar TCGs, sets, cards y precios.
- Gestionar su propia colección.
- Consultar estadísticas y valoración de su colección.
- Consultar grading companies.
- Consultar precios graded.

No debe ver acciones administrativas de sincronización, gestión de usuarios ni creación/edición de grading companies.

### Administrador

Además puede:

- Gestionar TCGs.
- Gestionar sets y ejecutar sync de sets.
- Gestionar cards y ejecutar sync de cards.
- Ejecutar sync de precios normales.
- Crear, editar y eliminar grading companies.
- Registrar precios graded manualmente.
- Importar lotes de precios graded.
- Gestionar usuarios.

## Dirección visual

Usa una estética premium, tecnológica y coleccionable:

- Fondo principal oscuro azul petróleo o navy profundo.
- Superficies elevadas en azul grisáceo oscuro.
- Color principal eléctrico, preferentemente cyan/azul brillante.
- Acentos secundarios para estados: verde para subidas y valor positivo, rojo coral para bajadas o errores, dorado para rareza y grading premium, violeta para datos analíticos.
- Bordes suaves, sombras discretas y radios medianos.
- Tipografía sans-serif moderna, muy legible en tablas y dashboards.
- Números financieros grandes y monoespaciados o con buena alineación tabular.
- Cards visuales con imagen, set, número, rareza, condición y badges.
- Evita un estilo infantil o excesivamente saturado. Debe parecer un producto serio para coleccionistas avanzados.

## Navegación principal

### Desktop

Usa un sidebar izquierdo persistente con:

1. Dashboard
2. Mi colección
3. Catálogo
4. Precios
5. Grading
6. Sincronización — solo admin
7. Administración — solo admin
8. Configuración

El sidebar debe mostrar el logo TCG Wallet, avatar, nombre del usuario y rol. Añade un botón de colapsar sidebar.

La barra superior debe incluir:

- Breadcrumbs.
- Título de la pantalla.
- Búsqueda global visual.
- Indicador de estado de conexión o última sincronización.
- Notificaciones.
- Menú de usuario.

### Tablet

Usa sidebar compacto o drawer lateral. Mantén breadcrumbs y acciones principales visibles. Las tablas pueden transformarse en cards horizontales.

### Mobile

Usa top bar con logo, botón de menú y avatar. Añade bottom navigation con:

- Dashboard
- Colección
- Catálogo
- Precios
- Más

Las acciones secundarias deben ir en menús o bottom sheets. Los filtros deben abrirse en un panel full-screen o bottom sheet.

## Pantalla 1 — Login

### Objetivo

Permitir iniciar sesión de manera rápida y confiable.

### Contenido

- Logo TCG Wallet.
- Mensaje: “Gestiona, analiza y protege tu colección”.
- Campo email.
- Campo contraseña con mostrar/ocultar.
- Checkbox “Recordarme” si el diseño lo considera útil.
- Botón principal “Iniciar sesión”.
- Enlace a registro.
- Mensaje de error para credenciales inválidas.
- Estado loading del botón.
- Estado de sesión expirada.

No diseñes recuperación de contraseña como funcionalidad activa porque no existe endpoint backend para recuperación.

## Pantalla 2 — Registro

### Contenido

- Username.
- Email.
- Contraseña.
- Confirmación visual de fortaleza de contraseña.
- Botón “Crear cuenta”.
- Enlace para volver a login.
- Estado de validación de email duplicado.
- Estado de registro exitoso.

## Pantalla 3 — Dashboard principal

Esta es la pantalla principal después del login.

### Cabecera

- Saludo personalizado.
- Fecha o periodo seleccionado.
- Selector de periodo si visualmente aplica.
- Acción rápida “Añadir carta”.

### Tarjetas KPI

Diseña tarjetas para:

- Valor estimado de colección.
- Cantidad total de cartas.
- Cartas distintas.
- Cartas graded.
- Cartas normales.
- Items sin precio disponible.

Cada KPI debe incluir valor principal, etiqueta, icono, variación cuando exista y tooltip explicativo.

### Gráficos

- Evolución del valor de la colección.
- Distribución por TCG.
- Distribución por set.
- Distribución por condición.
- Distribución por grading company.

La valoración actual está expresada en USD. Mostrar el badge `USD` claramente.

### Secciones inferiores

- Top 5 cartas más valiosas.
- Últimas cartas añadidas.
- Últimos cambios de precio.
- Accesos rápidos al catálogo y colección.

### Estados

- Usuario sin colección: dashboard onboarding con CTA “Añadir primera carta”.
- Colección con items pero sin precios: mensaje informativo, no error.
- Loading con skeletons.
- Error de carga con retry.

## Pantalla 4 — Catálogo de TCGs

### Contenido

- Título “Catálogo de juegos”.
- Buscador.
- Grid de TCGs.
- Nombre del juego.
- Cantidad de sets.
- Cantidad aproximada de cards.
- Imagen o identidad visual del TCG.
- Estado de carga y empty state.

### Administración

Para admins mostrar:

- Crear TCG.
- Editar TCG.
- Eliminar TCG.

Usar modal de confirmación para eliminar.

## Pantalla 5 — Detalle de TCG

### Contenido

- Nombre e identidad visual del TCG.
- Breadcrumb.
- Resumen de sets y cards.
- Buscador de sets.
- Grid o tabla de sets.
- Acción para abrir cada set.

## Pantalla 6 — Catálogo de sets

### Contenido

- Selector de TCG.
- Buscador de sets.
- Filtros por código y fecha de lanzamiento.
- Ordenamiento por nombre, código, fecha y creación.
- Paginación.
- Cards de set con imagen si existe, nombre, código, fecha y cantidad de cards.

### Administración

- Crear set.
- Editar set.
- Eliminar set.
- Acción “Sincronizar sets de Pokémon”.

El sync debe mostrar modal de confirmación, progreso, duración y resumen de recibidos, creados, actualizados, sin cambios y omitidos.

## Pantalla 7 — Detalle de set

### Contenido

- Header del set con nombre, código y fecha.
- TCG asociado.
- Total de cards.
- Buscador de cards dentro del set.
- Filtros por rareza.
- Grid de cards.
- Orden por nombre, número, rareza y actualización.

## Pantalla 8 — Catálogo de cards

### Contenido

- Buscador principal por nombre.
- Filtro por set.
- Paginación.
- Ordenamiento por nombre, número, rareza, creación y actualización.
- Grid responsive de cards.

Cada card visual debe mostrar:

- Imagen.
- Nombre.
- Número.
- Rareza.
- Set.
- Botón para ver detalle.
- Acción rápida “Añadir a colección”.

### Administración

- Crear card.
- Editar card.
- Eliminar card.
- Sincronizar cards de Pokémon.

## Pantalla 9 — Detalle de card

Esta es una de las pantallas más importantes del producto.

### Hero de card

- Imagen grande de la carta.
- Nombre.
- Número.
- Rareza.
- Set y TCG.
- External ID técnico oculto o disponible en panel avanzado.
- Botón “Añadir a mi colección”.
- Botón “Comparar precios”.

### Tabs o secciones

#### Información

- Datos completos de la carta.
- Set relacionado.
- Rareza.
- Número de colección.

#### Precios normales

Mostrar:

- Último precio.
- Condición.
- Moneda.
- Fuente.
- Fecha registrada.
- Precio mínimo, máximo y promedio.
- Variación absoluta y porcentual.
- Dirección: subida, bajada o sin cambios.
- Gráfico histórico.
- Agregaciones por día, semana y mes.

Estados vacíos: “Aún no hay precios normales para esta carta”.

#### Precios graded

Mostrar filtros por:

- Grading company.
- Grade de 0 a 10.

Mostrar:

- Último precio graded.
- Empresa.
- Grade.
- Fuente.
- Fecha.
- Estadísticas.
- Variación.
- Gráfico histórico.
- Agregaciones temporales.

No mezclar visualmente precios normales y graded. Usar badges o tabs claramente diferenciados.

#### Añadir a colección

Modal o drawer con:

- Cantidad.
- Condición.
- Toggle “Carta graded”.
- Empresa de grading obligatoria si graded.
- Grade de 0 a 10 si graded.
- Confirmar.

## Pantalla 10 — Mi colección

### Cabecera

- Valor total estimado en USD.
- Botón “Añadir carta”.
- Botón “Ver estadísticas”.
- Botón “Ver valoración”.

### Filtros

- Card.
- Set.
- TCG.
- Condición.
- Rarity.
- Es graded.
- Grading company.
- Grade mínimo.
- Grade máximo.

### Ordenamiento

- Fecha de creación.
- Fecha de actualización.
- Cantidad.
- Grade.
- Nombre de card.

### Vista desktop

Tabla con:

- Imagen.
- Card.
- Set.
- Cantidad.
- Condición.
- Estado graded.
- Empresa.
- Grade.
- Precio unitario.
- Valor total.
- Acciones.

### Vista tablet/mobile

Cards apiladas con menú contextual para editar y eliminar. Los filtros se abren en bottom sheet.

### Estados

- Colección vacía.
- Sin resultados para filtros.
- Item sin precio.
- Precio graded no disponible.
- Loading.
- Error con retry.

## Pantalla 11 — Crear o editar item de colección

Diseñar un formulario reutilizable para crear y editar.

### Campos

- Card seleccionada.
- Cantidad.
- Condición.
- Toggle graded.
- Grading company.
- Grade.

### Comportamiento

- Si graded está desactivado, ocultar o deshabilitar empresa y grade.
- Si graded está activado, mostrar empresa y grade como obligatorios.
- Mostrar preview de la card.
- Mostrar último precio disponible si existe.
- Confirmación visual de guardado.
- Errores de validación inline.

## Pantalla 12 — Estadísticas de colección

### KPIs

- Cards distintas.
- Cantidad total.
- Cantidad graded.
- Cantidad no graded.

### Desgloses

- Por condición.
- Por set.
- Por TCG.
- Por grading company.

Usar gráficos de barras, donut y tablas compactas. En mobile convertir gráficos anchos en carruseles o bloques verticales.

## Pantalla 13 — Valoración de colección

### Resumen

- Valor estimado total.
- Moneda USD.
- Items evaluados.
- Items sin precio.
- Items graded evaluados.
- Items graded sin precio.

### Contenido

- Top 5 items más valiosos.
- Valor por set.
- Valor por TCG.
- Valor por grading company.
- Indicador visible cuando faltan precios.

El diseño debe dejar claro que una carta graded sin precio graded no utiliza automáticamente el precio normal.

## Pantalla 14 — Grading companies

### Usuario normal

- Listado de empresas.
- Nombre.
- Cantidad de items de colección asociados si está disponible.
- Navegación a cards graded filtradas.

### Administrador

- Crear empresa.
- Editar nombre.
- Eliminar empresa.
- Confirmación antes de eliminar.
- Error si tiene relaciones activas con colección o precios.

## Pantalla 15 — Centro de precios

Diseñar una vista para consultar precios normales y graded sin confundir ambos dominios.

### Contenido

- Buscador de card.
- Selector normal/graded.
- Filtros de fuente, condición, empresa y grade.
- Tabla histórica.
- Estadísticas.
- Variación.
- Gráfico de evolución.

Para precios graded incluir acción administrativa “Registrar precio” con:

- Card.
- Grading company.
- Grade.
- Precio.
- Moneda.
- Fuente.
- Fecha opcional en importación.

## Pantalla 16 — Centro de sincronización — Admin

### Paneles

1. Sync de sets Pokémon.
2. Sync de cards Pokémon.
3. Sync de precios normales Pokémon.
4. Pipeline completo.
5. Importación batch de precios graded.

### Cada sync debe mostrar

- Nombre de operación.
- Descripción.
- Última ejecución.
- Estado: listo, ejecutando, completado, error.
- Duración.
- Botón de ejecución.
- Confirmación antes de iniciar.
- Progreso o estado indeterminado.
- Resultado resumido.
- Errores y posibilidad de reintentar.

### Importación graded batch

Diseñar un wizard de 3 pasos:

1. Cargar archivo o pegar JSON.
2. Previsualizar y validar filas.
3. Confirmar importación.

Cada fila debe mostrar card, empresa, grade, precio, moneda, fuente y `recordedAt` opcional. Mostrar filas válidas, inválidas y relaciones inexistentes antes de confirmar.

No presentar sync automático de precios graded como disponible. Mostrar una tarjeta “Proveedor graded pendiente” como roadmap futuro.

## Pantalla 17 — Administración de usuarios

Solo admin.

### Contenido

- Tabla de usuarios.
- Username.
- Email.
- Rol.
- Fecha de creación.
- Estado de sesión si se incorpora visualmente.
- Buscar por email.
- Ver detalle.
- Editar usuario.
- Cambiar rol si el backend lo permite.
- Eliminar usuario con confirmación.

No mostrar contraseñas ni refresh tokens.

## Pantalla 18 — Configuración y perfil

### Perfil

- Username.
- Email.
- Rol.
- Fecha de registro.

### Seguridad

- Cambiar contraseña.
- Campos contraseña actual, nueva y confirmación.
- Aviso de que cambiar contraseña revoca sesiones refresh activas.
- Cerrar sesión.

### Preferencias visuales

- Tema oscuro como default.
- Selector de densidad si resulta útil.
- Preferencia de vista grid/tabla para colección.

## Componentes reutilizables

Diseña y documenta en el mismo proyecto visual:

- Sidebar desktop.
- Top bar.
- Bottom navigation mobile.
- Breadcrumbs.
- Card de TCG.
- Card de set.
- Card visual de carta.
- Badge de rareza.
- Badge graded.
- Badge de grading company.
- Badge de variación.
- KPI card.
- Data table responsive.
- Empty state.
- Error state.
- Loading skeleton.
- Modal de confirmación.
- Drawer de filtros.
- Toast de éxito/error.
- Tabs de precios.
- Gráfico de línea.
- Gráfico donut.
- Gráfico de barras.
- Wizard de importación.

## Reglas responsive

### Desktop — 1440 px

- Sidebar visible.
- Dashboard en 12 columnas.
- Tablas completas.
- Gráficos lado a lado.
- Paneles administrativos con dos columnas.

### Tablet — 768 a 1199 px

- Sidebar colapsable.
- Dashboard en 6 columnas.
- Tablas con menos columnas y acciones agrupadas.
- Formularios de dos columnas cuando haya espacio.
- Gráficos apilados.

### Mobile — 360 a 767 px

- Navegación inferior.
- Una columna.
- Cards apiladas.
- Tablas convertidas en tarjetas.
- Formularios de una columna.
- Filtros en bottom sheet.
- Modales convertidos en pantallas o drawers.
- Botones primarios de ancho completo.
- Mantener siempre visible la acción principal.

## Accesibilidad y UX

- Contraste AA como mínimo.
- No depender únicamente del color para indicar subida, bajada, rareza o estado.
- Labels visibles en formularios.
- Focus states claros.
- Áreas táctiles de al menos 44 px.
- Confirmación para acciones destructivas.
- Mensajes de error comprensibles.
- Skeletons para cargas largas.
- Empty states con explicación y CTA.
- Tablas navegables con teclado.
- No mostrar información sensible de usuarios.

## Datos de ejemplo para el boceto

Usa datos ficticios realistas, no datos personales reales:

- Usuario: Mateo Collector.
- TCG: Pokémon.
- Set: Scarlet & Violet — Base Set.
- Cards: Charizard ex, Pikachu, Mew ex.
- Grading companies: PSA, CGC, BGS y Development Fixture Grading.
- Grades: 8, 9, 9.5 y 10.
- Moneda: USD.
- Fuentes: Pokémon TCG API, manual, provider demo.

## Entregables esperados de Stitch

Genera:

1. Sitemap visual de la aplicación.
2. Sistema de navegación desktop, tablet y mobile.
3. Design system con colores, tipografías, espaciado, radios, sombras y componentes.
4. Todas las pantallas descritas en este prompt.
5. Variantes responsive de cada pantalla principal.
6. Estados loading, empty, error y success.
7. Flujos completos de login, añadir a colección, ver precios, valorar colección y administrar syncs.
8. Diferenciación clara entre usuario normal y administrador.
9. Prototipo navegable entre dashboard, catálogo, detalle de card, colección, valoración y administración.

Prioriza consistencia, jerarquía visual y claridad de datos. El resultado debe parecer un producto listo para convertirse en una aplicación web real conectada a la API TCG Wallet.
