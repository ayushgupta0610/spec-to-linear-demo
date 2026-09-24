# Ticket review prompt

Read the approved spec and check each ticket against the repository boundaries. Every ticket needs one target package, a concrete goal, observable acceptance criteria and an estimate in the team's scale. Add `dependsOn` keys where one ticket's deliverable is needed before another can begin. Prefer small tickets that can be reviewed in one pull request. Explain any cross-package sequence to the team, then run `npm run preview` and ask for approval of the exact preview code before publishing.
