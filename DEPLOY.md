# Despliegue Frontend — Vercel

Guía para publicar la PWA React de Tran-Pack en **Vercel**, conectada al backend en Railway.

## Requisitos previos

- Backend desplegado en Railway con `/health` respondiendo `200`
- `CORS_ORIGIN` en Railway apuntando a la URL de Vercel
- Repositorio en GitHub/GitLab/Bitbucket

## Opción A: Monorepo (raíz del repositorio)

Vercel detecta automáticamente `vercel.json` en la raíz del repo:

| Campo | Valor |
|-------|-------|
| Root Directory | `.` (raíz) |
| Build Command | *(automático desde vercel.json)* |
| Output Directory | `frontend/dist` |

## Opción B: Solo carpeta frontend

| Campo | Valor |
|-------|-------|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run generate:icons && npm run build` |
| Output Directory | `dist` |

Usa `frontend/vercel.json` para rewrites SPA y headers de seguridad.

## Variables de entorno en Vercel

**Settings → Environment Variables → Production:**

```env
VITE_API_URL=https://tu-api.up.railway.app/api/v1
VITE_APP_NAME=Tran-Pack
```

### Preview deployments (opcional)

Para branches de preview, podés usar la misma API de staging o la de producción:

```env
VITE_API_URL=https://tu-api.up.railway.app/api/v1
```

Si usás previews, agregá también esas URLs en `CORS_ORIGIN` del backend (separadas por coma).

## Validación en build

El script `prebuild` valida `VITE_API_URL`:

- **En Vercel/CI**: falla el deploy si falta o es inválida
- **Build local**: solo advierte (usá `npm run build:strict` para forzar validación)

## PWA en producción

- Service Worker generado por `vite-plugin-pwa` (Workbox)
- Actualización automática con confirmación al usuario
- **No cachea respuestas de la API** (datos siempre frescos desde Railway)
- Cache solo de assets estáticos y fuentes Google

### Iconos PWA

Se generan automáticamente en cada build:

```bash
npm run generate:icons
```

Archivos en `public/`: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`

## Probar build local

```bash
# Con proxy local (sin VITE_API_URL — usa /api/v1 vía vite proxy en dev)
npm run build

# Simular build de producción estricto
VITE_API_URL=https://tu-api.up.railway.app/api/v1 npm run build:strict

# Previsualizar el build
npm run preview
```

## Dominio propio (Hostinger)

1. En Vercel: **Settings → Domains** → agregar `app.tudominio.com`
2. En Hostinger DNS: `CNAME` → `cname.vercel-dns.com`
3. Actualizar en Railway: `CORS_ORIGIN=https://app.tudominio.com`
4. No hace falta cambiar `VITE_API_URL` si la API sigue en Railway

## Checklist post-deploy

- [ ] La app carga en la URL de Vercel
- [ ] Login funciona (JWT desde Railway)
- [ ] Rutas directas funcionan (ej. `/dashboard`, `/sales`) — rewrite SPA
- [ ] PWA instalable en móvil (manifest + iconos)
- [ ] Service Worker activo (DevTools → Application)
- [ ] Sin errores CORS en la consola
- [ ] Actualización de versión muestra diálogo al desplegar nueva build

## Comandos útiles

```bash
npm run dev          # Desarrollo con proxy /api → localhost:3000
npm run build        # Build producción
npm run build:strict # Build con validación estricta de env
npm run preview      # Servir dist localmente
```

## Guía completa del stack

Ver también: [backend/DEPLOY.md](../backend/DEPLOY.md)
