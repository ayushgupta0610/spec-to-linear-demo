export type Ticket = {
  key: string;
  title: string;
  package: string;
  goal: string;
  acceptance: string[];
  estimate: number;
  labels: string[];
  dependsOn: string[];
};

export type FeatureSpec = {
  featureId: string;
  projectName: string;
  teamName: string;
  summary: string;
  decisions: string[];
  openQuestions: string[];
  tickets: Ticket[];
};

export type Architecture = {
  packages: { name: string; kind: string; mayDependOn: string[] }[];
  rules: string[];
};
