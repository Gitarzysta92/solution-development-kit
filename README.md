# Solution Development Kit

## What It Is

The Solution Development Kit (SDK) is a **self-contained development and delivery workspace** for solution-level services and shared domain logic. It is an Nx monorepo that holds the SDK source (kernel, platform, extras, and feature modules), the CI/CD that builds and publishes container images and Helm charts, and the GitOps definitions that deploy its own CI runners and wire them into the broader platform.

Think of it as the **single place** where solution-domain code lives, gets built, versioned, and made available for deployment—without being tied to a single application repo. It was extracted from a larger application codebase so that solution services and contracts can evolve, build, and ship on their own cadence while staying clearly owned and governable.

---

## Architecture

### Domain and Code Layout

The repo follows a **feature-first, modular domain** layout:

- **Kernel** — Foundational primitives, ontology, and cross-cutting aspects (e.g. events, envelopes). No business logic; shared building blocks.
- **Platform** — Solution-level platform capabilities (e.g. queue abstractions) that features and applications rely on.
- **Extras** — Optional infrastructure adapters (Mongo, MySQL, MinIO, RabbitMQ, etc.) used by applications but kept out of core domain.
- **Features** — Each feature is a vertical slice: **core** (domain + contracts), **applications** (deployable services), **libs** (shared logic within the feature), and **provisioning** (Helm charts, env-specific values).

Dependencies flow in one direction: **applications and infrastructure depend on feature core and kernel**, never the reverse. Feature core owns the public contracts (events, queue names, payload shapes) that other services integrate with. There is no global “shared” bucket; contracts live in the feature that owns them (e.g. identity in identity core, discussion in discussion core). This keeps ownership explicit and limits blast radius when contracts change.

### Build and Publish

- **Nx** drives the build graph: libraries and applications are Nx projects with explicit build/test/lint targets. Application builds consume feature core and kernel as prior build steps.
- **CI** (GitHub Actions) is path-aware: pushes to application or Helm paths on main/develop trigger a matrix job that builds each affected app, produces a Docker image, and publishes it to a Nexus Docker registry, then packages and publishes the corresponding Helm chart to a Nexus Helm repository. Versioning is pipeline-derived (e.g. chart version from run number, app version from commit SHA).
- **Self-hosted runners** are provided by ARC (Actions Runner Controller). The repo defines an Argo CD AppProject and an Application that syncs the ARC runner scale set configuration from this repo (e.g. from `environments/dev/platform/...`). A separate bootstrap workflow creates/updates the Kubernetes secret used by ARC for GitHub auth. So the SDK repo not only builds its own services but also declares how and where its CI runs.

### GitOps and Environments

- **Argo CD** is used in a “platform pulls from this repo” style. The **argocd** directory contains bootstrap (e.g. AppProject, which repos and namespaces this project can deploy to) and **applications** that point at **this** repo’s paths (e.g. the ARC runner config under `environments/dev/platform/...`). So the platform cluster syncs runner and related config from the solution-development-kit repo; the SDK does not drive the whole platform, only the parts that belong to the solution.
- **Environments** hold environment-specific Kustomization overlays (e.g. dev). The ARC runner Application source path points at something like `environments/dev/platform/arc-runner-set-solution-development-kit-kustomization`. That kustomization may reference external bases (e.g. from platform-development-kit) and apply patches (runner name, GitHub config URL, secrets, scale). So “how the SDK’s runners look in dev” is fully defined in this repo and versioned with the code.

### Contract Ownership and Evolution

Contracts (event types, queue names, routing) live in **feature core** as the single source of truth. Applications and adapters (e.g. RabbitMQ publishers/consumers) import and use these types and constants; they do not redefine them. Evolution is additive where possible (new optional fields, new event kinds); when breaking changes are unavoidable, versioned event metadata allows old and new consumers to coexist. A contract change is done only when all affected producers and consumers in the repo are updated—keeping the monorepo the consistency boundary.

---

## How to Utilize It

**As a developer working on a feature** — Treat the feature’s core as the authority for “what is published or consumed.” Implement or change use cases in applications and wire transport (queues, HTTP) in infrastructure layers that depend on core. Run Nx build/test/lint for the projects you touch; use the dev-loop workflow to build and optionally push a single application image for fast iteration without running the full matrix.

**As a team adding a new service** — Add the application under the owning feature (e.g. under `sdk/features/<name>/applications/`), add a corresponding Nx project, add a Dockerfile and a Helm chart under that feature’s provisioning tree, and register the app in the CI workflow matrix (app name, image path, Nx project, chart path). Ensure the app and its chart consume contract types and identifiers from the feature core so producers and consumers stay aligned.

**As a platform operator** — Ensure the Argo CD bootstrap (project, permissions) is applied so that Applications from this repo can sync. Run the ARC auth bootstrap workflow with the right environment so the runner scale set can authenticate to GitHub. Configure repo-level variables and secrets (Nexus Docker host/registry, Helm repo URL, credentials) as documented in `.github/SECRETS.md` so that the build-and-publish and dev-loop workflows can push images and charts. The SDK’s environments directory is the source of truth for how solution-specific resources (like the ARC runner set) are configured per environment; adjust kustomizations and patches there rather than in the platform repo.

**As an integrator** — Depend on published artifacts: pull container images from the Nexus Docker registry and Helm charts from the Nexus Helm repository. Use the same contract types (e.g. from npm if published, or by referencing the same repo) so that producers and consumers stay compatible. Do not duplicate contract definitions elsewhere; treat the feature core as the only source of truth.

---

## Why This Exists

The SDK was split out from a larger application repository so that:

- **Ownership is clear** — Solution domain and its services live in one place, with a single cadence for builds, releases, and contract changes.
- **Coupling is controlled** — By forbidding a catch-all shared module and colocating contracts with the owning feature, teams avoid accidental cross-feature dependencies and keep the dependency graph predictable.
- **Change impact is bounded** — Contract and app changes are localized to a feature and its apps; CI is path-triggered so only affected apps are built and published.
- **Governance scales** — As more services are added, each feature remains the approval boundary for its contracts and apps; the Nx graph and Argo CD apps keep build and deployment explicit and auditable.

The design explicitly avoids a single “shared” or “common” module that accumulates unrelated dependencies and becomes unmaintainable. By making **feature core** the single source of truth for integration contracts and keeping applications and infrastructure as dependents, the kit stays robust as the solution grows.

---

## Getting Started

Install dependencies from the repo root, then use Nx to build, test, or lint the projects you need (e.g. a feature core library or an application). For CI and deployment, configure the variables and secrets described in `.github/SECRETS.md` and ensure the ARC auth bootstrap has been run for the target environment.
