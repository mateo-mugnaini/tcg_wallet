# Migrations

Las migrations de esta carpeta se ejecutan contra el schema `public` existente.

El runner oficial es:

```bash
pnpm db:migrate
```

El runner crea `schema_migrations`, bloquea ejecuciones concurrentes con un advisory lock, aplica cada archivo pendiente dentro de una transacción y registra su identificador solo después del `COMMIT`. `000_baseline_schema.sql` permite arrancar una base limpia; en una base existente utiliza `IF NOT EXISTS` y no reemplaza el DDL original.

El inventario de baseline se obtiene con:

```bash
pnpm db:check:schema
```

Antes de aplicar una migration en producción hay que:

1. respaldar la base;
2. ejecutar `pnpm db:explain` y comparar el plan antes/después;
3. aplicar el SQL mediante el runner de migrations elegido por el despliegue;
4. verificar índices y constraints con `pnpm db:check:schema`.

Las migrations `000_baseline_schema.sql`, `001_critical_read_indexes.sql`, `002_sync_jobs.sql` y `003_price_integrity_constraints.sql` fueron aplicadas en desarrollo y quedaron registradas en `schema_migrations`. La migration `004_psa_grading_company.sql` registra PSA de forma idempotente y `005_unique_graded_price_snapshots.sql` evita snapshots graded duplicados. El baseline no reemplaza tablas existentes; permite inicializar entornos limpios. Sus rollbacks están documentados en los propios archivos.
