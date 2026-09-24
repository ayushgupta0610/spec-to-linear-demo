# Agent instructions for this repository

When the user asks to plan a feature, inspect the relevant source and the architecture map before drafting. For changes to this workflow, use `workflow-architecture.json`; for the fictional analytics example, use `architecture.json`.

Ask at most two questions when the answers materially change scope or write behavior. After the user answers, create a JSON spec matching `examples/analytics-inspector.json`. Put unresolved decisions in `openQuestions`. Run the preview with the same architecture map that informed the spec, and show the approval code and proposed ticket count.

The user controls publishing. After they explicitly approve the shown plan, run `check-linear`, then `publish` with that approval code. Report the created Linear project and issue links or identifiers. Do not implement the feature when the request is to plan it.
