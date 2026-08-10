# Oregano790 Backend Foundation

## Current status

The backend foundation is now a working Node.js HTTP API for local development. It has an established runtime and package manifest, environment configuration, a health endpoint, structured JSON error responses, API versioning, catalogue request handling, and an automated Node test suite.

The current runtime intentionally remains dependency-light and uses Node's built-in HTTP server. It does **not** yet include a database adapter, authentication provider, permissions layer, deployment configuration, or external persistence.

## Development rule

Do not add a backend framework, database driver, authentication provider, or deployment configuration until the runtime requirements are explicitly established and tested in the repository.

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
Development product data
```

## Runtime endpoints

### Health

```text
GET /api/v1/health
```

Returns a structured health response containing the backend service name, version, and environment.

### Catalogue

```text
GET /api/v1/catalogue
```

Supports the current catalogue query boundary and returns normalized development product data.

## Local development

From this directory:

```powershell
npm test
npm start
```

The default development port is `3000`. The frontend may be served separately from the repository root, for example:

```powershell
python -m http.server 8080
```

The backend allows the local frontend origins `http://localhost:8080` and `http://127.0.0.1:8080` through its development CORS boundary.

## Verification status

The current DEV-005 runtime verification has established:

- Backend test suite: **9/9 passing**.
- Health endpoint: **working**.
- Catalogue endpoint: **working**.
- Catalogue response: **2 development products returned**.
- Frontend: **serving successfully on port 8080**.
- Browser catalogue request: **observed from the live frontend**.

## Next backend work

The backend foundation is sufficient for the next application milestone. Future work should be driven by explicit requirements and tested incrementally. Persistence, authentication, permissions, deployment, and additional business endpoints should be introduced only when their requirements are established.