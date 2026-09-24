import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Architecture, FeatureSpec } from "./model.ts";
import { approvalHash, preview, validateAndOrder } from "./plan.ts";
import { checkLinear, publish } from "./linear.ts";

const [command, specPath = "examples/analytics-inspector.json", flag, code] = process.argv.slice(2);
if (!command || !["preview", "check-linear", "publish"].includes(command)) {
  throw new Error("Usage: node --experimental-strip-types src/cli.ts <preview|check-linear|publish> <spec.json> [--approve <code>]");
}
const spec = JSON.parse(readFileSync(resolve(specPath), "utf8")) as FeatureSpec;
const architecture = JSON.parse(readFileSync(resolve("architecture.json"), "utf8")) as Architecture;
const tickets = validateAndOrder(spec, architecture);
if (command === "preview") process.stdout.write(`${preview(spec, architecture)}\n`);
if (command === "check-linear") process.stdout.write(`${JSON.stringify(checkLinear(spec), null, 2)}\n`);
if (command === "publish") {
  const expected = approvalHash(spec, architecture);
  if (flag !== "--approve" || code !== expected) throw new Error(`Approval code mismatch. Run preview, review it, then pass --approve ${expected}`);
  publish(spec, tickets);
}
