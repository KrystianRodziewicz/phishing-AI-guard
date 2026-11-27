export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type WarningCategory =
  | "domain"
  | "brand_mismatch"
  | "form"
  | "prompt_injection"
  | "ml_model";

export interface AnalysisWarning {
  id: string;
  category: WarningCategory;
  severity: RiskLevel;
  title: string;
  explanation: string;
  evidence?: string;
}

export interface PageAnalysisInput {
  url: string;
  title: string;
  hostname: string;
  protocol: string;
  forms: {
    hasPasswordField: boolean;
    action: string | null;
    method: string;
  }[];
  hiddenTexts: string[];
  visibleTextSample: string;
}

export interface AnalysisResult {
  url: string;
  timestamp: string;
  riskLevel: RiskLevel;
  riskScore: number;
  source: "rules" | "ml" | "rules+ml";
  warnings: AnalysisWarning[];
}
