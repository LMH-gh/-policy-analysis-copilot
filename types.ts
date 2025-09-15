export enum AnalysisStep {
  BACKGROUND = '背景与术语分析',
  INTERPRETATION = '逐句解读',
  VULNERABILITY = '潜在漏洞分析',
  OUTLOOK = '未来政策走向预判',
  SYNTHESIS = '综合报告生成',
}

export interface AnalysisBackground {
  summary: string;
  glossary: {
    term: string;
    definition: string;
  }[];
}

export interface AnalysisInterpretation {
  sentence: string;
  whatItSays: string;
  whyItSaysIt: string;
}

export interface AnalysisVulnerability {
  category: string;
  vulnerability: string;
  example: string;
}

export interface AnalysisOutlook {
  vulnerability: string;
  prediction: string;
}

export interface AnalysisSynthesis {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    content: string;
    example?: string;
  }[];
  conclusion: string;
}

export interface AnalysisResult {
  background?: AnalysisBackground;
  interpretation?: {
    sentences: AnalysisInterpretation[];
  };
  vulnerabilities?: {
    vulnerabilities: AnalysisVulnerability[];
  };
  outlook?: {
    predictions: AnalysisOutlook[];
  };
  synthesis?: AnalysisSynthesis;
}