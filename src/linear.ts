import { spawnSync } from "node:child_process";
import type { FeatureSpec, Ticket } from "./model.ts";
import { issueDescription, marker } from "./plan.ts";

type ToolResponse = { successful: boolean; data?: Record<string, unknown>; error?: unknown };
type RecordValue = Record<string, unknown>;

function object(value: unknown): RecordValue {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as RecordValue;
  throw new Error(`Expected an object, received ${JSON.stringify(value)}`);
}

function array(value: unknown): RecordValue[] {
  if (!Array.isArray(value)) throw new Error(`Expected an array, received ${JSON.stringify(value)}`);
  return value.map(object);
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error(`Expected a nonempty string, received ${JSON.stringify(value)}`);
  return value;
}

export function callLinear(slug: string, args: RecordValue = {}): RecordValue {
  const userId = process.env.COMPOSIO_USER_ID;
  if (!userId) throw new Error("Set COMPOSIO_USER_ID to the connected developer-project user ID");
  const command = spawnSync("composio", ["dev", "playground-execute", slug, "--user-id", userId, "-d", JSON.stringify(args)], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (command.error || command.status !== 0) throw new Error(`${slug}: ${command.error?.message ?? command.stderr ?? command.stdout}`);
  let response: ToolResponse;
  try { response = JSON.parse(command.stdout) as ToolResponse; }
  catch { throw new Error(`${slug}: unexpected CLI output: ${command.stdout}`); }
  if (!response.successful) throw new Error(`${slug}: ${JSON.stringify(response.error)}`);
  return object(response.data);
}

function idFrom(data: RecordValue, names: string[]): string {
  for (const name of names) {
    const candidate = data[name];
    if (candidate && typeof candidate === "object" && typeof (candidate as RecordValue).id === "string") return text((candidate as RecordValue).id);
  }
  if (typeof data.id === "string") return data.id;
  throw new Error(`Could not find created ID in ${JSON.stringify(data)}`);
}

function pageItems(slug: string, field: string, args: RecordValue = {}): RecordValue[] {
  const all: RecordValue[] = [];
  let after: string | undefined;
  do {
    const data = callLinear(slug, { ...args, ...(after ? { after } : {}), first: 50 });
    all.push(...array(data[field]));
    const page = object(data.page_info);
    after = page.hasNextPage === true ? text(page.endCursor) : undefined;
  } while (after);
  return all;
}

function exactMatches(items: RecordValue[], field: string, value: string): RecordValue[] {
  return items.filter((item) => item[field] === value);
}

export function checkLinear(spec: FeatureSpec): { teamId: string; teamName: string; projectNames: string[]; projectIds: string[] } {
  const teams = pageItems("LINEAR_LIST_LINEAR_TEAMS", "teams");
  const matches = exactMatches(teams, "name", spec.teamName);
  if (matches.length !== 1) throw new Error(`Expected one Linear team named ${spec.teamName}, found ${matches.length}`);
  const team = matches[0]!;
  const projects = pageItems("LINEAR_LIST_LINEAR_PROJECTS", "projects");
  return { teamId: text(team.id), teamName: spec.teamName, projectNames: projects.map((item) => text(item.name)), projectIds: array(team.projects).map((item) => text(item.id)) };
}

function teamIssues(teamId: string): RecordValue[] {
  const issues: RecordValue[] = [];
  let after: string | undefined;
  do {
    const data = callLinear("LINEAR_LIST_ISSUES_BY_TEAM_ID", { team_id: teamId, first: 250, ...(after ? { after } : {}) });
    issues.push(...array(data.issues));
    const page = object(data.page_info);
    after = page.has_next_page === true ? text(page.end_cursor) : undefined;
  } while (after);
  return issues;
}

export function publish(spec: FeatureSpec, tickets: Ticket[]): void {
  const { teamId, projectIds } = checkLinear(spec);
  const projects = pageItems("LINEAR_LIST_LINEAR_PROJECTS", "projects");
  const projectMatches = exactMatches(projects, "name", spec.projectName).filter((item) => projectIds.includes(text(item.id)));
  if (projectMatches.length > 1) throw new Error(`Multiple projects named ${spec.projectName}; choose a unique name`);

  // A partial prior run needs inspection. Never create another copy of an issue blindly.
  const existing = teamIssues(teamId);
  for (const key of ["feature", ...tickets.map((ticket) => ticket.key)]) {
    const prefix = `[${spec.featureId}/${key}]`;
    if (existing.some((issue) => typeof issue.title === "string" && issue.title.startsWith(prefix))) {
      throw new Error(`Existing issue found for ${key}; reconcile the previous run before retrying`);
    }
  }

  const labels = pageItems("LINEAR_LIST_LINEAR_LABELS", "labels", { team_id: teamId }).filter((item) => item.is_group !== true);
  const labelIds = new Map(labels.map((item) => [text(item.name), text(item.id)]));
  for (const ticket of tickets) for (const label of ticket.labels) if (!labelIds.has(label)) throw new Error(`Missing team label: ${label}`);

  const projectId = projectMatches.length === 1
    ? text(projectMatches[0]!.id)
    : idFrom(callLinear("LINEAR_CREATE_LINEAR_PROJECT", { name: spec.projectName, team_ids: [teamId], description: spec.summary.slice(0, 255) }), ["project"]);

  const parentDescription = [spec.summary, "", "Decisions:", ...spec.decisions.map((item) => `- ${item}`), "", `Spec marker: ${marker(spec.featureId, "feature")}`].join("\n");
  const parentId = idFrom(callLinear("LINEAR_CREATE_LINEAR_ISSUE", { team_id: teamId, project_id: projectId, title: `[${spec.featureId}/feature] ${spec.projectName}`, description: parentDescription }), ["issue"]);
  const issueIds = new Map<string, string>();
  for (const ticket of tickets) {
    const issue = callLinear("LINEAR_CREATE_LINEAR_ISSUE", {
      team_id: teamId,
      project_id: projectId,
      parent_id: parentId,
      title: `[${spec.featureId}/${ticket.key}] ${ticket.title}`,
      description: issueDescription(spec, ticket),
      estimate: ticket.estimate,
      label_ids: ticket.labels.map((label) => labelIds.get(label)!)
    });
    issueIds.set(ticket.key, idFrom(issue, ["issue"]));
    process.stdout.write(`Created ${ticket.key}: ${issueIds.get(ticket.key)}\n`);
  }
  for (const ticket of tickets) for (const dependency of ticket.dependsOn) {
    callLinear("LINEAR_CREATE_LINEAR_ISSUE_RELATION", { issue_id: issueIds.get(dependency)!, related_issue_id: issueIds.get(ticket.key)!, relation_type: "blocks" });
    process.stdout.write(`Linked ${dependency} blocks ${ticket.key}\n`);
  }
  process.stdout.write(`Created project ${projectId} and parent feature ${parentId}\n`);
  try {
    const project = object(callLinear("LINEAR_GET_LINEAR_PROJECT", { project_id: projectId }).project);
    if (typeof project.url === "string") process.stdout.write(`Project URL: ${project.url}\n`);
  } catch {
    process.stdout.write(`Project URL lookup unavailable; open project ID ${projectId} in Linear\n`);
  }
}
