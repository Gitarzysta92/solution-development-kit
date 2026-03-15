# Solution Development Kit

This workspace is an Nx-based development environment focused on the SDK extracted from `wappsA` (`wappsA/sdk`).

## Structure

- `sdk/`: the SDK source code (kernel, platform, extras, features)
- cross-service contracts live with their owning feature under `sdk/features/*/core`

## Feature Contract Libraries

### What this is

Feature contract libraries are the **single source of truth** for cross-service integration contracts (events, message schemas, and the minimal topology identifiers needed to route them).
They live inside the owning feature’s core module (for example: discussion contracts in discussion core, identity contracts in identity core).

### Architecture and dependency direction

This repository follows a **feature-first, modular domain** architecture:

- **Feature core**: owns domain concepts and the public contracts the outside world integrates with.
- **Applications/services**: implement use-cases and orchestrate infrastructure, but do not invent or redefine shared contracts.
- **Infrastructure/adapters**: publish/consume messages and map transport concerns onto the contracts defined by the feature.

The dependency direction is intentional: **apps and infrastructure depend on feature core contracts**, never the other way around.

### How to utilize it (conceptually)

When you build or change an application service:

- Treat the relevant feature core as the authoritative place to learn “what gets published/consumed”.
- Reuse the feature’s contract types and routing identifiers to keep producers and consumers aligned.
- Keep transport-specific mechanics (RabbitMQ client setup, retries, DLQs, etc.) outside the core; the core only defines what the integration means.

### Contract evolution and stability

Contracts should be evolved with compatibility in mind:

- Prefer additive changes (new optional fields, new event types) over breaking schema changes.
- Versioned event metadata is the mechanism to introduce breaking changes when unavoidable (old consumers can keep handling the previous version while new consumers move forward).
- A contract change is considered complete only when all affected producers/consumers in the repo align to the updated contract.

### Why we do this (and why `apps/shared` was removed)

We explicitly avoid a “catch‑all shared module” because it tends to become an unowned dependency magnet.
Colocating contracts with the feature that owns them gives:

- **Clear ownership** (who approves changes and why)
- **Lower coupling** (features don’t accidentally depend on unrelated shared code)
- **Predictable change impact** (contract diff is localized to the feature)
- **Better scalability** (as more services appear, governance stays manageable)

## Getting started

```bash
npm install
```

## Useful commands

```bash
npx nx show projects
npx nx build standard
```

