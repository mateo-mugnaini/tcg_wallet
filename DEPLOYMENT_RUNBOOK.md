# TCG Wallet API — Deployment Runbook

Este runbook define el procedimiento mínimo para staging y producción. Los comandos de backup y restore requieren que `pg_dump` y `pg_restore` estén instalados y disponibles en `PATH`.

## Variables y secretos

Los secretos se inyectan desde el gestor de secretos del entorno o desde variables protegidas del CI. No se deben commitear archivos `.env` reales.

En producción son obligatorios:

- `NODE_ENV=production`;
- `DATABASE_SSL=true`;
- `DATABASE_SSL_REJECT_UNAUTHORIZED=true`, salvo una excepción documentada para una CA interna;
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` aleatorios de al menos 32 caracteres;
- `CORS_ORIGIN_PRODUCTION` limitado al origen real del frontend;
- `SHUTDOWN_TIMEOUT_MS` definido según el tiempo máximo de drenaje permitido.

## Despliegue de staging

1. Provisionar PostgreSQL y comprobar conectividad con las variables de staging.
2. Crear un backup antes de cualquier cambio de schema:

   ```bash
   cd api
   pnpm db:backup -- backups/staging-$(date +%Y%m%d-%H%M%S).dump
   ```

3. Aplicar migrations con `pnpm db:migrate`.
4. Iniciar la API con `pnpm start` o mediante el supervisor de procesos elegido y comprobar `/api/health/live`, `/api/health/ready` y `/api/docs/openapi.json`.
5. Ejecutar `pnpm test:run`, `pnpm test:integration` y `pnpm check:openapi`.
6. Ejecutar `pnpm check:smoke` con `BASE_URL` apuntando a la API desplegada.
7. Ejecutar un smoke test autenticado de login, catálogo y colección.
8. Ejecutar `pnpm audit --prod` y revisar el resultado antes de promover la versión.

## Rollback

El rollback de aplicación consiste en redeployar la imagen anterior identificada por su digest. Las migrations deben ser backward-compatible; si una migration no puede revertirse de forma segura, el rollback de schema se realiza restaurando un backup en una base aislada y con una ventana de mantenimiento aprobada.

Nunca se restaura sobre producción sin confirmar explícitamente:

```bash
CONFIRM_RESTORE=RESTORE pnpm db:restore -- backups/<backup>.dump RESTORE
```

Después de un rollback se deben repetir migrations pendientes, readiness, smoke tests y verificación de jobs activos. El restore todavía debe probarse en un entorno staging antes de declarar esta fase finalizada.

## Apagado y monitoring

- El balanceador debe retirar la instancia cuando `/api/health/ready` responda `503`.
- `GET /api/health/live` confirma que el proceso está vivo.
- `GET /api/health/ready` confirma que PostgreSQL está disponible y que la instancia acepta tráfico.
- `GET /api/metrics` expone métricas HTTP agregadas para scraping o adaptación al sistema de monitoring.
- Las alertas mínimas deben cubrir readiness 503 sostenido, liveness fallido, errores 5xx, latencia elevada, jobs fallidos y espacio de backup.
- Los logs JSON deben conservar `requestId` y no deben incluir secretos o tokens.

## Criterio de cierre de la fase 15

La fase solo puede marcarse como **Finalizado** cuando exista evidencia fechada de un despliegue staging reproducible, backup creado, restore validado, rollback ejecutado, smoke tests exitosos y alertas conectadas al sistema operativo real.
