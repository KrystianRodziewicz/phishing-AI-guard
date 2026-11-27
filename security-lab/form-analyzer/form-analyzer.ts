export interface FormFinding {
    code:
    | 'INSECURE_PAGE_PROTOCOL'
    | 'INSECURE_ACTION_PROTOCOL'
    | 'CROSS_ORIGIN_ACTION'
    | 'PASSWORD_SENT_VIA_GET';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface FormAnalysisReport {
    formIndex: number;
    action: string;
    method: string;
    hasPasswordField: boolean;
    findings: FormFinding[];
}

const LOCAL_HOST = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalHost(hostname: string): boolean {
    return LOCAL_HOST.has(hostname);
}

/** Analizuje formularze w dokumencie bez odczytywania wartości pól (.value). */

export function analyzeForms(document: Document, pageUrl: string): FormAnalysisReport[] {
    const parsedPageUrl = new URL(pageUrl);
    const forms = Array.from(document.querySelectorAll('form'));
 
    return forms.map((form, formIndex) => {
        // Celowo nie czytamy wartości pól formularza, aby uniknąć naruszenia prywatności użytkownika, analizujemy wyłącznie strukturę i atrybuty DOM.
        const hasPasswordField = form.querySelector('input[type="password"]') !== null;
        const rawAction = form.getAttribute('action')?.trim() || parsedPageUrl.href;
        const method = (form.getAttribute('method') || 'GET').toUpperCase();
        const findings: FormFinding[] = [];

        if (!hasPasswordField) {
            return {
                formIndex,
                action: rawAction,
                method,
                hasPasswordField,
                findings,
            };
        }

        if (parsedPageUrl.protocol === 'http:' && !isLocalHost(parsedPageUrl.hostname)) {
            findings.push({
                code: 'INSECURE_PAGE_PROTOCOL',
                severity: 'high',
                message: 'Formularz z hasłem znajduje się na stronie otwartej po nieszyfrowanym HTTP.',
            });
        }

        let resolvedActionUrl: URL | null = null;
        try {
            resolvedActionUrl = new URL(rawAction, parsedPageUrl.href);
        } catch {
            resolvedActionUrl = null;
        }

        if (resolvedActionUrl) {
            if (
                resolvedActionUrl.protocol === 'http:' &&
                !isLocalHost(resolvedActionUrl.hostname)
            ) {
                findings.push({
                    code: 'INSECURE_ACTION_PROTOCOL',
                    severity: 'high',
                    message: `Adres wysyłki formularza (${resolvedActionUrl.href}) używa nieszyfrowanego HTTP.`,
                });
            }

            if (resolvedActionUrl.hostname !== parsedPageUrl.hostname) {
                findings.push({
                    code: 'CROSS_ORIGIN_ACTION',
                    severity: 'high',
                    message: `Formularz wysyła dane na inny host (${resolvedActionUrl.hostname}) niż bieżąca strona (${parsedPageUrl.hostname}).`,
                });
            }
        }

        if (method === 'GET') {
            findings.push({
                code: 'PASSWORD_SENT_VIA_GET',
                severity: 'high',
                message: 'Formularz z hasłem używa metody GET, co może ujawniać dane w adresie URL.',
            });
        }

        return {
            formIndex,
            action: resolvedActionUrl ? resolvedActionUrl.href : rawAction,
            method,
            hasPasswordField,
            findings,
        };
    });
}