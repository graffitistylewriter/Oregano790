# Oregano790 Backend Foundation

## Current status

The backend is a dependency-light Node.js HTTP API for the Oregano790 catalogue application. It provides health checks, persistent catalogue storage, catalogue reads, and catalogue management operations.

The current catalogue management endpoints are intentionally a development/admin foundation. **They are not authenticated yet and must not be exposed to a public production deployment until the admin authentication and authorization layer is implemented.**

## Current boundary

```text
Frontend
   ↓
API client / catalogue service
   ↓
Backend HTTP API
   ↓
Application catalogue service
   ↓
Catalogue repository
   ↓
Persistent catalogue storage
```

## Runtime endpoints

### Health

```text
GET /api/v1/health
```

### Catalogue read

```text
GET /api/v1/catalogue
GET /api/v1/catalogue?id=<product-id>
```

### Catalogue management foundation

```text
POST   /api/v1/catalogue
PUT    /api/v1/catalogue/:id
DELETE /api/v1/catalogue/:id
```

`POST` requires at least `name` and `sku`. `PUT` preserves the existing product id. `DELETE` removes the product from persistent catalogue storage.

## Local development

From the repository root:

```powershell
Set-Location ".\backend"
npm test
npm start
```

The default development port is `3000`.

## Development sequence

The next major backend requirement is the protected Oregano owner workspace. Authentication and authorization must be implemented before catalogue write endpoints are considered production-safe.
