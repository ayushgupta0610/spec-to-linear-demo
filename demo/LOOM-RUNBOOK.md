# Two-minute Loom: brainstorm a change and watch tickets appear

This recording uses **Codex in the `spec-to-linear` repository** and your own connected Linear workspace. It demonstrates one real conversation and one real publish. Use a fresh feature ID and project name; a published feature cannot be replayed without reconciliation.

## Before recording

1. Clone the public repository into a fresh recording folder so Codex sees normal Git history. Run `npm install`, `npm test`, and `npm run typecheck` beforehand. Run `composio dev init -y --no-browser` in that clone and set `COMPOSIO_USER_ID` in the terminal session before recording. Open the clone and Linear side by side at readable zoom. Do not show an environment file, Composio configuration, or credentials on camera.
2. Choose the **Web3** team for the private demo. The public repo's example team is fictional; tell Codex to set `teamName` to `Web3` in this recording. Use a distinct project name such as `Spec Revision Workflow Demo`.
3. Open `src/linear.ts` around the existing-issue guard and `src/plan.ts` around the approval hash. These make the codebase insight easy to see when Codex refers to them.
4. Open Codex in this repository. Its `AGENTS.md` supplies the planning and approval boundaries. Set the terminal font large enough to read on a laptop screen.

## Conversation to record

**You:** “We publish approved specs to Linear, but today a second publish stops when an issue already exists. I want the team to revise an approved spec without duplicate tickets. Inspect `src/linear.ts`, `src/plan.ts`, `src/cli.ts`, and `workflow-architecture.json`, then help me scope the change. Ask only the decisions that affect behavior. Do not write Linear tickets yet.”

**Codex should identify:** `src/linear.ts` stops on existing titles, `src/plan.ts` hashes the reviewed content, and the planner is separate from the Linear adapter. If it misses one, ask: “Which current file handles that behavior?”

In a read-only rehearsal, Codex surfaced the two useful decisions: **what is the baseline for the diff**, and **what should happen when Linear contains manual edits or a ticket disappears**. Let it ask in its own words rather than reading a prepared answer before it has inspected the code.

**You, after its questions:** “Use the previous approved JSON spec as the baseline, then compare the corresponding Linear issues to detect drift. Show a field-level diff and require a new approval code before any update. Block the update if someone manually changed a managed field in Linear, but preserve assignees and statuses. If a ticket disappears from the spec, flag it for manual review rather than archiving it. Plan this as a new feature with ID `spec-revision-workflow-demo`, in the Web3 team and project `Spec Revision Workflow Demo`.”

**You:** “Write the agreed JSON spec as `examples/revision-plan.json`, with concrete acceptance criteria, estimates and dependencies. Preview it using `workflow-architecture.json`. Stop for my approval.”

Review the preview on camera. Point to one architecture-specific ticket and its dependency. Then say: **“I approve the plan with code `<code shown in preview>`. Publish it to Linear and give me the project link.”** Codex should run the check and publish commands for you. If it asks for terminal or network approval, approve the specific Composio command in the UI.

## Edit plan for 2:15 to 2:45

| Time | Show | Voiceover |
| --- | --- | --- |
| 0:00–0:15 | Repo and Linear side by side | “This is a small version of your spec-to-Linear workflow, built in TypeScript and connected to a real Linear workspace.” |
| 0:15–0:45 | Initial prompt, then Codex citing real files | “I describe a change. The agent reads the implementation and asks about the decisions that affect the design.” |
| 0:45–1:10 | Your answers and its revised scope | “Here I decide how updates, approvals and removed tickets should behave.” |
| 1:10–1:40 | Generated spec and preview | “The plan names affected modules, estimates work, orders dependencies, and includes acceptance criteria. Nothing has been written yet.” |
| 1:40–2:10 | Approval message and Codex tool execution; cut waiting time | “After I approve the exact plan, the agent creates the project and tickets through the Linear connection.” |
| 2:10–2:35 | Refresh Linear project, open one issue and its dependency | “Here are the tickets in Linear, with the parent, labels, estimates and dependency links. For your monorepo, I would derive this map from the actual package and boundary rules.” |

Keep the entire publish command and success result visible for a moment. Cut network waiting time, but do not imply a dry run was a live write. End on the Linear project, not a slide. The public GitHub repository belongs in the Upwork proposal; the Linear demo link may require workspace access.
