
Control API Authentication Boundary
Purpose

WP-0006 introduces the first safe authentication boundary for the Control API.

The goal is not to implement the final identity platform.

The goal is to ensure management routes are no longer anonymous before more admin actions are added.

Auth Modes
static

Local development default.

The API key is read from:

CONTROL_API_DEV_API_KEY

If not provided, the fallback local key is:

dev-local-control-api-key

This mode is not for production.

database

Validates API keys against platform.api_keys.

The incoming API key is SHA-256 hashed, and the hash is compared with platform.api_keys.key_hash.

Only active, non-expired API keys are accepted.

disabled

Testing only.

This mode bypasses authentication and returns a test system principal.

It must not be used for real deployments.

API Key Headers

The Control API accepts API keys from:

Authorization: Bearer <api-key>
X-Control-Api-Key: <api-key>
X-API-Key: <api-key>

The preferred header is:

X-Control-Api-Key
Public Endpoints

The following endpoints are public:

GET /health
GET /version
Protected Endpoints

The following endpoints are protected:

GET /ready
organization endpoints
project endpoints
environment endpoints
audit event endpoints
Scope Model

Initial scopes:

*
management:*
organizations:read
organizations:write
projects:read
projects:write
environments:read
environments:write
audit:read

* and management:* are broad administrative scopes.

Later work packets should replace broad defaults with narrower generated keys.

API Key Storage

The platform should never store raw API keys.

Database mode stores:

key prefix
SHA-256 key hash
scopes
status
expiration
last used timestamp
Current Limitations

WP-0006 does not yet implement:

API key creation endpoint
API key rotation endpoint
API key revocation endpoint
organization-scoped authorization enforcement
user authentication
SSO
RBAC
OpenFGA/Cerbos authorization policies
audit actor propagation into create events

Those are later work packets.

Doctrine
Audit before admin actions.
API/CLI before dashboard.
Do not expose management routes anonymously.
Do not store raw API keys.
Keep authentication separate from full authorization.
