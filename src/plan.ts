import { createHash } from "node:crypto";
import type { Architecture, FeatureSpec, Ticket } from "./model.ts";

export function validateAndOrder(spec: FeatureSpec, architecture: Architecture): Ticket[] {
  const fail = (message: string): never => { throw new Error(message); };
  if (!spec.featureId || !spec.projectName || !spec.teamName || !spec.summary) fail("Spec identity and summary are required");
  if (spec.openQuestions.length) fail(`Resolve open questions before publishing: ${spec.openQuestions.join("; ")}`);
  if (!spec.tickets.length) fail("At least one ticket is required");
  const packageNames = new Set(architecture.packages.map((item) => item.name));
  const byKey = new Map<string, Ticket>();
  for (const ticket of spec.tickets) {
    if (!ticket.key || byKey.has(ticket.key)) fail(`Missing or duplicate ticket key: ${ticket.key}`);
    if (!ticket.title || !ticket.goal || !ticket.acceptance.length || ticket.acceptance.some((item) => !item.trim())) fail(`Ticket ${ticket.key} needs a title, goal and acceptance criteria`);
    if (!packageNames.has(ticket.package)) fail(`Unknown package on ${ticket.key}: ${ticket.package}`);
    if (!Number.isInteger(ticket.estimate) || ticket.estimate < 1) fail(`Invalid estimate on ${ticket.key}`);
    byKey.set(ticket.key, ticket);
  }
  const ordered: Ticket[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (!byKey.has(key)) fail(`Unknown dependency: ${key}`);
    if (visiting.has(key)) fail(`Dependency cycle at ${key}`);
    if (visited.has(key)) return;
    visiting.add(key);
    const ticket = byKey.get(key)!;
    for (const dependency of ticket.dependsOn) visit(dependency);
    visiting.delete(key);
    visited.add(key);
    ordered.push(ticket);
  };
  for (const ticket of spec.tickets) visit(ticket.key);
  return ordered;
}

export function approvalHash(spec: FeatureSpec, architecture: Architecture): string {
  return createHash("sha256").update(JSON.stringify({ spec, architecture })).digest("hex").slice(0, 12);
}

export function marker(featureId: string, ticketKey: string): string {
  return `spec-to-linear:${featureId}:${ticketKey}`;
}

export function issueDescription(spec: FeatureSpec, ticket: Ticket): string {
  return [
    ticket.goal,
    "",
    `Target package: \`${ticket.package}\``,
    "",
    "Acceptance criteria:",
    ...ticket.acceptance.map((item) => `- ${item}`),
    "",
    `Spec marker: ${marker(spec.featureId, ticket.key)}`
  ].join("\n");
}

export function preview(spec: FeatureSpec, architecture: Architecture): string {
  const ordered = validateAndOrder(spec, architecture);
  const lines = [`# ${spec.projectName}`, "", spec.summary, "", `Linear parent issue: [${spec.featureId}/feature] ${spec.projectName}`, "", "## Decisions", ...spec.decisions.map((item) => `- ${item}`), "", "## Architecture rules", ...architecture.rules.map((item) => `- ${item}`), "", "## Proposed Linear tickets"];
  for (const ticket of ordered) {
    lines.push("", `### ${ticket.key}: ${ticket.title}`, `Package: ${ticket.package} | Estimate: ${ticket.estimate} | Depends on: ${ticket.dependsOn.join(", ") || "none"}`, "", issueDescription(spec, ticket));
  }
  lines.push("", `Approval code: ${approvalHash(spec, architecture)}`);
  return lines.join("\n");
}
