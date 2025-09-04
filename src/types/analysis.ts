export type AnalysisMetric = {
  label: string;
  value: string | number;
};

export type AnalysisRecommendation = {
  title: string;
  rationale?: string;
};

export type AnalysisReport = {
  bbox: [number, number, number, number];
  isoDate: string; // YYYY-MM-DD
  summary?: string;
  metrics?: AnalysisMetric[];
  bullets?: string[];
  recommendations?: AnalysisRecommendation[];
  rawMarkdown?: string;
};


