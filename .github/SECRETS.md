# Required secrets and variables for GitHub Actions

This document lists all secrets and variables used by workflows in this repository. Configure them in **Settings → Secrets and variables → Actions** (repo-level).

---

## Workflow: SDK Applications – Build Image & Publish Helm

**File:** `.github/workflows/sdk-applications-helm.workflow.yml`  
**Runner:** `self-hosted`

### Repo-level (automatic)

| Name            | Description |
|-----------------|-------------|
| `GITHUB_TOKEN`  | Provided by GitHub (e.g. for checkout). No setup needed. |

### Repo-level variables (Settings → Secrets and variables → Actions → Variables)

| Name                 | Description | Example |
|----------------------|-------------|---------|
| `NEXUS_DOCKER_HOST` | Docker registry host (no scheme, no path) for the tenant connector endpoint. | `solution-development-kit-images.nexus.dev.threesixty.dev` |
| `NEXUS_DOCKER_REGISTRY` | Full Docker registry base URL (no scheme, no trailing slash). Image URL will be `$NEXUS_DOCKER_REGISTRY/$image_path` (e.g. `.../features/identity/authenticator`). | `solution-development-kit-images.nexus.dev.threesixty.dev` |
| `NEXUS_HELM_REPOSITORY_URL` | Full Nexus Helm hosted repository URL used for chart upload and connectivity checks. | `https://nexus.dev.threesixty.dev/repository/solution-development-kit-charts/` |

### Repo-level secrets (Settings → Secrets and variables → Actions → Secrets)

| Name               | Description |
|--------------------|-------------|
| `NEXUS_USERNAME`   | Nexus user with write access to the Docker and Helm chart repositories (e.g. CI user). |
| `NEXUS_PASSWORD`   | Password or token for `NEXUS_USERNAME`. |

---

## Checklist

- [ ] `NEXUS_DOCKER_HOST` (variable) set to your tenant docker registry host.
- [ ] `NEXUS_DOCKER_REGISTRY` (variable) set to the full Docker registry base URL.
- [ ] `NEXUS_HELM_REPOSITORY_URL` (variable) set to your Nexus Helm hosted repository URL.
- [ ] `NEXUS_USERNAME` (secret) set to the CI user.
- [ ] `NEXUS_PASSWORD` (secret) set to the CI user’s password or token.
- [ ] Self-hosted runner has Docker and network access to Nexus.
- [ ] In Nexus: enable Docker connector on the tenant repository and map ingress host (e.g. `solution-development-kit-images.nexus.dev.threesixty.dev`) to that connector port.

---

## Workflow: ARC Runner Auth - Bootstrap (SDK)

**File:** `.github/workflows/arc-runner-auth-bootstrap.workflow.yml`  
**Runner:** `self-hosted`

This workflow creates/updates Kubernetes secret `arc-github-auth-solution-development-kit` in namespace `solution-development-kit`.

### Environment secret

| Name | Description |
|------|-------------|
| `ARC_GITHUB_TOKEN` | GitHub token used by ARC runner scale set auth (`github_token` key in Kubernetes secret). |
