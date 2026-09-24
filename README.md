# Spec to Linear

A small, runnable TypeScript reference for a reviewed **feature spec → ticket plan → Linear project and issues** workflow. It uses Cursor prompts for collaborative drafting, a deterministic architecture and ticket validator, and Composio's Linear connection for the final write. The sample is a fictional analytics inspector across one app and two packages; replace its architecture map with the real repository boundaries before using it on client work.

## See the flow without credentials

Requires Node 22.18+.

```bash
npm install
npm run preview
npm test
npm run typecheck
```

The preview prints a project, a parent feature issue, three ordered implementation tickets, acceptance criteria, package targets, estimates and dependencies. It ends with a 12-character approval code. Change a ticket or architecture rule and the code changes. `preview` makes no network calls.

For a short screen recording of the brainstorming step and a live Linear write, follow [`demo/LOOM-RUNBOOK.md`](demo/LOOM-RUNBOOK.md). The recording prompt uses this repository's own `src/linear.ts` and `src/plan.ts`, with `workflow-architecture.json` as its architecture map.

## Use it with a repository and Linear

1. Replace `architecture.json` with package names and rules derived from the real Turborepo, ESLint and dependency-cruiser configuration. This example checks named targets; the repository's own lint and boundary checks remain authoritative for imports.
2. Use `prompts/spec-author.md` in Cursor, Claude Code or Codex to discuss a feature with the team. Save the agreed result in the JSON shape of `examples/analytics-inspector.json`. Keep unresolved choices in `openQuestions`; the validator blocks publication while any remain.
3. Use `prompts/ticket-review.md` to split the spec into work that can be reviewed. Run the preview and get human approval of its code.
4. Connect Linear in a Composio developer project, run `composio dev init -y --no-browser` in this directory, and identify the connected project user with `composio dev connected-accounts list --toolkits linear`. Set `COMPOSIO_USER_ID` to that user's ID. Set `teamName` in the spec to an actual team in that workspace and map ticket label names to labels on that team.
5. Check access, then publish only the approved version:

```bash
COMPOSIO_USER_ID=your-connected-user-id node --experimental-strip-types src/cli.ts check-linear examples/analytics-inspector.json
COMPOSIO_USER_ID=your-connected-user-id node --experimental-strip-types src/cli.ts publish examples/analytics-inspector.json --approve CODE_FROM_PREVIEW
```

For another architecture map, pass `--architecture workflow-architecture.json` to both `preview` and `publish`. The approval code binds to the selected map as well as the spec.

Publication creates or reuses an exact-name project in the selected team, creates a parent feature issue, then sub-issues and `blocks` relationships in dependency order. Issue titles include stable spec keys. Before writing, the publisher searches for those keys and stops if a previous run left any issues; inspect partial runs instead of blindly replaying them. It does not merge code or operate Cursor unattended.

## Why these boundaries exist

- The model can help write the spec and ticket descriptions. Structural checks are deterministic, so unresolved questions, missing acceptance criteria, unknown packages and dependency cycles fail before any write.
- A human approves the exact preview. The approval code is a content hash of the spec and architecture map, so edits require a fresh review.
- The Linear adapter runs through a connected Composio developer-project user. No Linear token is stored in this repository.
- Linear writes are sequential and checked for success. A partial write is visible and stops the next run for manual reconciliation.

This is a new reference implementation built to demonstrate the workflow, not a claim that it has been operated inside a client's enterprise monorepo. The included example can be previewed offline; live publication requires a connected Linear workspace and an approved spec.

## Live smoke test

On 2026-09-24, this workflow created a [demo project in my Linear workspace](https://linear.app/ai-agency-corp/project/spec-to-linear-demo-analytics-inspector-d5d21e1ae4e9): parent issue `AI-43`, three labeled and estimated sub-issues `AI-44` through `AI-46`, and three blocking relationships. A read-back confirmed the project and `AI-46`'s parent, label, estimate and acceptance criteria. Replaying the same approved spec stops on the existing parent issue before any new write. The Linear link may require workspace access; the repository and offline preview are public.
