# API Contract

## Principles
- JSON over HTTP for public/internal API routes.
- Validate every request body, params, and query with Zod.
- Authorization occurs before resource access.
- Organization scope is server-derived.
- Responses use stable application error codes rather than database/stack-trace details.

## Success envelope
APIs may return resource data directly for simple GETs. Mutations should use a consistent shape such as data plus requestId.

## Error envelope
Use an error object with code, safe message, and requestId. Never expose Prisma errors, SQL, filesystem paths, stack traces, secrets, or internal implementation details.

## Versioning
Breaking API changes require a documented decision and contract update. Prefer additive changes.
