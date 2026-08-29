# Workflow & Branching

## Jira

- **Project:** [DAS — Dashbuilder](https://planetkevin.atlassian.net/jira/software/projects/DAS/boards/68/backlog)
- **Board:** [Backlog / Board 68](https://planetkevin.atlassian.net/jira/software/projects/DAS/boards/68/backlog)

All work is tracked in Jira. A matching `feature/DAS-<n>-…` branch is required. **Kevin opens the ticket and names the branch — or he explicitly tells the agent to.** Agents do not invent DAS-n+1 mid-stream (DAS-164).

## Mandatory gate (agents)

**Do not write code, edit docs, or change config until you are on the ticket Kevin named:**

1. A **DAS Jira ticket already exists** (or Kevin just told you to create one via REST with `.env` — `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_KEY`, `JIRA_PROJECT_KEY=DAS` — key confirmed).
2. A **feature branch** exists: `feature/DAS-<n>-<kebab-summary>` where `<n>` matches that key.
3. You are **on that branch**.

Using ticket numbers in commits or docs without a real Jira issue is forbidden. If git history references tickets that Jira lacks, **stop and tell Kevin** — do not open replacements on your own.

See also: `.cursor/rules/01-jira-ticket-and-branch.mdc` (always-applied agent rule).

## Branching policy

**Feature branches only.** Never commit directly to `main` or `development`.

```
main ─────────────────────────────────────────────► (releases)
  │
  └── development ────────────────────────────────► (integration)
        │
        └── feature/DAS-123-short-description ───► (work)
```

### Branch naming

```
feature/DAS-<ticket-number>-<kebab-case-summary>
```

Examples:

- `feature/DAS-1-project-foundation`
- `feature/DAS-2-monorepo-scaffold`
- `feature/DAS-15-table-component-export`

### Workflow steps

1. **Ticket** — Kevin’s existing DAS key, or a new issue **only if he asked**.
2. **Confirm ticket key** (e.g. `DAS-37`) — do not proceed on assumption.
3. **Branch** — use the matching `feature/DAS-<n>-<kebab-case-summary>`. Create it from `development` only if he asked.
4. **Implement** on that branch only — one ticket at a time.
5. **Run `npm run verify`** (and `npm run verify:all` for UI/e2e-affecting changes).
6. **Kevin commits and merges** — agents draft messages; Kevin is sole committer/merger.

## Pre-commit verification

Before every commit on a feature branch, run:

```bash
npm run verify
```

This runs **lint**, **typecheck**, and **unit tests** in order. Do not commit if verify fails.

| Command | What it checks |
|---------|----------------|
| `npm run lint` | ESLint across client, server, core |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) across all projects |
| `npm run test` | Unit tests (Jest + Vitest) |
| `npm run verify` | All of the above |

When Playwright is set up (DAS-8+), also run `npm run e2e` before merging feature branches that touch the builder UI.

| Command | What it checks |
|---------|----------------|
| `npm run e2e` | Playwright smoke (starts server + client) |
| `npm run verify:all` | verify + e2e |

## Remote and push policy

**Agents never push to the remote.** No exceptions.

Kevin is the only person who pushes, and only these branches go to the remote:

- `development` — when Kevin decides
- `main` — when Kevin decides

Feature branches stay **local** unless Kevin explicitly chooses otherwise. Agents must not run `git push`, suggest pushing feature branches, or assume anything has been published to GitHub.

## Commit messages

Agents draft commit messages; Kevin performs commits.

### Format

```
<type>(DAS-<n>): <short summary>

<optional body — why, not just what>
```

### Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Tooling, deps, config |
| `refactor` | Code change without behavior change |
| `test` | Tests |

### Example

```
docs(DAS-1): add project foundation and architecture docs

Establish vision, architecture, component model, export pipeline,
domain model, and workflow conventions for RosettaDash.
```

## Pull requests

- Title: `[DAS-n] Summary matching Jira ticket`
- Body: link Jira ticket, summary, test plan
- One ticket per PR preferred; large epics may span multiple PRs with clear ordering

## Agent responsibilities

| Agent (required) | Human (Kevin) |
|------------------|---------------|
| **Create Jira ticket before any work** | Prioritize backlog |
| **Create matching feature branch before any work** | Merge locally |
| Draft code and docs on the ticket branch only | Commit locally |
| Propose commit messages | Approve/edit and commit |
| Run `npm run verify` / suggest `verify:all` | Final review |
| **Never push** | Push `development` or `main` when decided |

### Agent checklist (every task)

- [ ] Jira ticket created and key confirmed
- [ ] Branch `feature/DAS-<n>-…` checked out from `development`
- [ ] Ticket number in branch matches Jira key
- [ ] No work started on wrong branch or without ticket

## Repository notes

- **GitHub:** `https://github.com/KevinEverywhere/rosettadash.git`
- **Integration branch:** `development`
- **Current ticket:** [DAS-114](https://planetkevin.atlassian.net/browse/DAS-114) — Storybook Controls, Actions, and Interactions
- **Current branch:** `feature/DAS-114-storybook-controls-actions-interactions`

## Related documents

- [Roadmap](./10-roadmap.md)
