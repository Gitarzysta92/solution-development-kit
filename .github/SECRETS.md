# Required secrets and variables for GitHub Actions

This document lists all secrets and variables used by workflows in this repository. Configure them in **Settings → Secrets and variables → Actions** (repo-level).

---

## Workflow: SDK Applications – Build Image & Publish Helm

**File:** `.github/workflows/sdk-applications-helm.workflow.yml`  
**Runner:** `self-hosted`

### Repo-level (automatic)

| Name            | Description |
|-----------------|-------------|
| `GITHUB_TOKEN`  | Provided by GitHub. Used to push Docker images to GHCR and for checkout. No setup needed. |

### Repo-level variables (Settings → Secrets and variables → Actions → Variables)

| Name                 | Description | Example |
|----------------------|-------------|---------|
| `NEXUS_HOST`        | Nexus server hostname (no scheme, no path). Used for `helm registry login`. | `nexus.dev.threesixty.dev` |
| `NEXUS_HELM_REGISTRY` | Full OCI registry URL for Helm push. | `oci://nexus.dev.threesixty.dev/repository/sdk-helm` |

### Repo-level secrets (Settings → Secrets and variables → Actions → Secrets)

| Name               | Description |
|--------------------|-------------|
| `NEXUS_USERNAME`   | Nexus user with write access to the Helm chart repository (e.g. CI user). |
| `NEXUS_PASSWORD`   | Password or token for `NEXUS_USERNAME`. |

---

## Checklist

- [ ] `NEXUS_HOST` (variable) set to your Nexus host.
- [ ] `NEXUS_HELM_REGISTRY` (variable) set to the OCI URL of your chart repo.
- [ ] `NEXUS_USERNAME` (secret) set to the CI user.
- [ ] `NEXUS_PASSWORD` (secret) set to the CI user’s password or token.
- [ ] Self-hosted runner is registered and has network access to Nexus (and GHCR for images).
