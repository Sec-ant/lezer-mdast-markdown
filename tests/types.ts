export interface NormalizedNode {
  type: string;
  from: number;
  to: number;
  children: NormalizedNode[];
  props?: Record<string, unknown>;
}

export interface Fixture {
  markdown: string;
}
