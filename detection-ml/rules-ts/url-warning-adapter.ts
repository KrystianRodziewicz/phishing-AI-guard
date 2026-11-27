import { analyzeUrl } from "../../extension/lib/url-analyzer.ts";
import type { Signal } from "../../extension/lib/url-analyzer.ts";
import type { AnalysisWarning } from "../../docs/analysis-contract.ts";

type WarningDefinition = Pick<
  AnalysisWarning,
  "category" | "severity" | "title"
>;

// Wstępne poziomy ważności do uzgodnienia z zespołem.
// Nie oznaczają prawdopodobieństwa phishingu.
const definitions: Record<string, WarningDefinition> = {
  http_address: {
    category: "domain",
    severity: "LOW",
    title: "Adres używa HTTP"
  },
  ip_address_host: {
    category: "domain",
    severity: "LOW",
    title: "Adres IP zamiast domeny"
  },
  userinfo_in_url: {
    category: "domain",
    severity: "MEDIUM",
    title: "Dane przed znakiem @"
  },
  brand_name_outside_official_domain: {
    category: "brand_mismatch",
    severity: "MEDIUM",
    title: "Nazwa marki poza domeną z listy"
  },
  brand_typo_candidate: {
    category: "brand_mismatch",
    severity: "MEDIUM",
    title: "Możliwa literówka w nazwie marki"
  }
};

function toWarning(
  signal: Signal,
  hostname: string | null,
  index: number
): AnalysisWarning {
  const definition = definitions[signal.code];

  if (!definition) {
    throw new Error(
      `Brak mapowania dla wskazówki: ${signal.code}`
    );
  }

  return {
    id: `url:${signal.code}:${index}`,
    ...definition,
    explanation: signal.message,
    ...(hostname ? { evidence: hostname } : {})
  };
}

export function analyzeUrlWarnings(input: unknown) {
  const result = analyzeUrl(input);

  const warnings: AnalysisWarning[] =
    result.status === "invalid_input"
      ? []
      : result.signals.map((signal, index) =>
          toWarning(signal, result.hostname, index)
        );

  return {
    ...result,
    warnings
  };
}
