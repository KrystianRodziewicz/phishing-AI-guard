export type TypoKind =
  | "substitution"
  | "transposition"
  | "deletion"
  | "insertion";

export interface Signal {
  code: string;
  message: string;
  brand?: string;
  matched_token?: string;
  typo_type?: TypoKind;
}

export interface AnalysisResult {
  status: "invalid_input" | "signals_found" | "no_signals_found";
  hostname: string | null;
  signals: Signal[];
  message?: string;
  note: string;
}

const NOTE =
  "To wstępna analiza adresu. " +
  "Sygnały nie potwierdzają phishingu. " +
  "Brak sygnałów nie potwierdza bezpieczeństwa.";

const BRANDS = [
  {
    token: "demobank",
    name: "DemoBank",
    officialDomains: ["demobank.example"]
  }
];

export function typoKind(
  candidate: string,
  original: string
): TypoKind | null {
  if (candidate === original) return null;

  if (candidate.length === original.length) {
    const positions: number[] = [];

    for (let i = 0; i < original.length; i++) {
      if (candidate[i] !== original[i]) positions.push(i);
    }

    if (positions.length === 1) return "substitution";

    if (positions.length === 2) {
      const [a, b] = positions;

      if (a === undefined || b === undefined) {
        return null;
      }

      if (
        b === a + 1 &&
        candidate[a] === original[b] &&
        candidate[b] === original[a]
      ) {
        return "transposition";
      }
    }
  }

  if (candidate.length === original.length - 1) {
    for (let i = 0; i < original.length; i++) {
      if (original.slice(0, i) + original.slice(i + 1) === candidate) {
        return "deletion";
      }
    }
  }

  if (candidate.length === original.length + 1) {
    for (let i = 0; i < candidate.length; i++) {
      if (candidate.slice(0, i) + candidate.slice(i + 1) === original) {
        return "insertion";
      }
    }
  }

  return null;
}

function analyzeBrand(host: string): Signal[] {
  const signals: Signal[] = [];

  for (const brand of BRANDS) {
    const official = brand.officialDomains.some(
      domain => host === domain || host.endsWith("." + domain)
    );

    // Pomijamy tylko reguły marki. Inne reguły nadal działają.
    if (official) continue;

    if (host.includes(brand.token)) {
      signals.push({
        code: "brand_name_outside_official_domain",
        brand: brand.name,
        message:
          "Adres zawiera nazwę " + brand.name +
          " poza domenami z naszej listy."
      });
      continue;
    }

    // To porównanie części hosta. Nie ustala głównej domeny.
    const tokens = host.split(/[.-]/).filter(Boolean);

    for (const token of tokens) {
      const kind = typoKind(token, brand.token);
      if (kind === null) continue;

      signals.push({
        code: "brand_typo_candidate",
        brand: brand.name,
        matched_token: token,
        typo_type: kind,
        message:
          "Część adresu przypomina nazwę " + brand.name +
          " z możliwą literówką. Wymaga sprawdzenia."
      });
      break;
    }
  }

  return signals;
}

function invalid(message: string): AnalysisResult {
  return {
    status: "invalid_input",
    hostname: null,
    signals: [],
    message,
    note: NOTE
  };
}

export function analyzeUrl(input: unknown): AnalysisResult {
  // Sprawdzamy dane również podczas działania programu.
  // Sam TypeScript nie zastępuje tej kontroli.
  if (typeof input !== "string") {
    return invalid("Adres musi być tekstem.");
  }

  const text = input.trim();

  if (!text) return invalid("Nie podano adresu.");

  if (/[\s\u0000-\u001f\u007f\\]/u.test(text)) {
    return invalid("Adres zawiera niedozwolone znaki lub spacje.");
  }

  let url: URL;

  try {
    const address = text.includes("://") ? text : "https://" + text;
    url = new URL(address);
  } catch {
    return invalid("Nie udało się odczytać adresu.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return invalid("Obsługujemy tylko adresy HTTP i HTTPS.");
  }

  // URL normalizuje adres podobnie jak przeglądarka.
  let host = url.hostname.toLowerCase();

  // Dla IPv6 usuwamy nawiasy z wyświetlanego hosta.
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }

  if (host.endsWith(".")) host = host.slice(0, -1);

  const isIp =
    host.includes(":") ||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);

  if (!isIp) {
    const valid =
      host.length > 0 &&
      host.length <= 253 &&
      host.split(".").every(label =>
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
      );

    if (!valid) return invalid("Niepoprawna nazwa hosta.");
  }

  const signals: Signal[] = isIp ? [] : analyzeBrand(host);

  if (isIp) {
    signals.push({
      code: "ip_address_host",
      message:
        "Adres używa numeru IP zamiast domeny. " +
        "Może to być także poprawna usługa lokalna."
    });
  }

  if (url.protocol === "http:") {
    signals.push({
      code: "http_address",
      message: "Adres używa HTTP zamiast HTTPS."
    });
  }

  if (url.username || url.password) {
    signals.push({
      code: "userinfo_in_url",
      message:
        "Adres zawiera dane przed znakiem @. " +
        "Sprawdź właściwy host."
    });
  }

  return {
    status: signals.length ? "signals_found" : "no_signals_found",
    hostname: host,
    signals,
    note: NOTE
  };
}
