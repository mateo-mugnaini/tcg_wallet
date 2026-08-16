# Migrations

Las migrations de esta carpeta se ejecutan contra el schema `public` existente.

El inventario de baseline se obtiene con:

```bash
pnpm db:check:schema
```

Antes de aplicar una migration en producción hay que:

1. respaldar la base;
2. ejecutar `pnpm db:explain` y comparar el plan antes/después;
3. aplicar el SQL mediante el runner de migrations elegido por el despliegue;
4. verificar índices y constraints con `pnpm db:check:schema`.

La migration `001_critical_read_indexes.sql` todavía no se aplica automáticamente. Su rollback está documentado en el propio archivo.
