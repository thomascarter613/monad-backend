# API Key Management

## Purpose

API keys are the first management API credential mechanism for Open Backend Cloud.

They are intentionally narrow and operational.

They are not the final user-authentication system.

## Current Capabilities

The Control API supports:

- creating API keys
- listing API keys
- revoking API keys
- rotating API keys
- hashing API keys before persistence
- revealing API key secret material only once
- recording API key lifecycle actions in audit events

## Endpoints

```text
POST /api-keys
GET /api-keys
POST /api-keys/:apiKeyId/revoke
POST /api-keys/:apiKeyId/rotate
```

## One-Time Secret Reveal

The raw API key is returned only when creating or rotating a key.

List responses do not include:

* raw API key
* key hash

List responses only include safe metadata:

* id
* organization id
* name
* key prefix
* scopes
* status
* expiration
* last used timestamp
* created timestamp
* updated timestamp

## Scopes

Current scopes:

* `*`
* `management:*`
* `api_keys:read`
* `api_keys:write`
* `organizations:read`
* `organizations:write`
* `projects:read`
* `projects:write`
* `environments:read`
* `environments:write`
* `audit:read`

## Audit Events

API key operations emit:

* `api_key.created`
* `api_key.revoked`
* `api_key.rotated`

Other management actions now record the calling principal where available.

## Limitations

This work packet does not yet implement:

* user login
* SSO
* RBAC
* organization-scoped enforcement
* API key creation UI
* API key expiration enforcement in memory mode
* actor propagation into every future service
* key usage analytics beyond `last_used_at` in database auth

## Doctrine

* Do not store raw API keys.
* Reveal raw API keys only once.
* Audit before admin actions.
* Prefer narrow scopes over broad management keys.
* Keep API key auth separate from final human identity.
