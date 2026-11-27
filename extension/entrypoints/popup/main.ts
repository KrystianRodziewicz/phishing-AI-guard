import './style.css';
import { analyzeUrl, type AnalysisResult } from '../../lib/url-analyzer';
import { getActiveTabUrl, isWebPageUrl } from '../../lib/active-tab';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Nie znaleziono elementu app');
}

app.innerHTML = `
  <main>
    <h1>Phishing AI Guard</h1>
    <p>Wstępna analiza adresu strony</p>

    <button id="check-tab" type="button">Sprawdź tę stronę</button>

    <form id="check-form">
      <label for="address">Albo wklej adres do sprawdzenia</label>
      <input
        id="address"
        type="text"
        placeholder="https://demobnak.example"
        autocomplete="off"
        spellcheck="false"
        required
      />
      <button type="submit" class="secondary">Sprawdź adres</button>
    </form>

    <section
      id="result"
      aria-live="polite"
      aria-atomic="true"
      hidden
    ></section>

    <p class="note">
      Analiza działa lokalnie na podstawie prostych reguł
      Obecna lista marek zawiera tylko fikcyjny DemoBank
      Brak wskazówek nie potwierdza bezpieczeństwa
    </p>
  </main>
`;

const form = document.querySelector<HTMLFormElement>('#check-form');
const input = document.querySelector<HTMLInputElement>('#address');
const output = document.querySelector<HTMLElement>('#result');
const tabButton = document.querySelector<HTMLButtonElement>('#check-tab');

if (!form || !input || !output || !tabButton) {
  throw new Error('Nie znaleziono elementów formularza');
}

const addressInput = input;
const resultPanel = output;
const checkTabButton = tabButton;

function showMessage(title: string, text: string): void {
  const heading = document.createElement('h2');
  heading.textContent = title;

  const message = document.createElement('p');
  message.textContent = text;

  resultPanel.replaceChildren(heading, message);
  resultPanel.hidden = false;
}

function renderResult(result: AnalysisResult): void {
  if (result.status === 'invalid_input') {
    showMessage(
      'Nie udało się sprawdzić adresu',
      result.message ?? 'Niepoprawny adres',
    );
    return;
  }

  resultPanel.replaceChildren();
  resultPanel.hidden = false;

  const heading = document.createElement('h2');
  heading.textContent = result.signals.length > 0
    ? 'Znaleziono wskazówki wymagające sprawdzenia'
    : 'Brak wskazówek z obecnych reguł';

  const host = document.createElement('p');
  host.textContent = `Właściwy host: ${result.hostname}`;

  resultPanel.append(heading, host);

  if (result.signals.length > 0) {
    const list = document.createElement('ul');

    for (const signal of result.signals) {
      const item = document.createElement('li');
      item.textContent = signal.message;
      list.append(item);
    }

    resultPanel.append(list);
  }

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = result.note;

  resultPanel.append(note);
}

checkTabButton.addEventListener('click', async () => {
  checkTabButton.disabled = true;

  try {
    const url = await getActiveTabUrl();

    if (!url) {
      showMessage(
        'Nie udało się odczytać adresu',
        'Przeglądarka nie udostępniła adresu tej karty.',
      );
      return;
    }

    if (!isWebPageUrl(url)) {
      showMessage(
        'Tej strony nie sprawdzamy',
        'To strona wewnętrzna przeglądarki albo plik z dysku. ' +
          'Sprawdzamy tylko strony internetowe (http i https).',
      );
      return;
    }

    // Show the checked address so the user knows what was analyzed.
    addressInput.value = url;
    renderResult(analyzeUrl(url));
  } catch {
    showMessage(
      'Nie udało się odczytać adresu',
      'Spróbuj zamknąć i ponownie otworzyć okienko rozszerzenia.',
    );
  } finally {
    checkTabButton.disabled = false;
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderResult(analyzeUrl(addressInput.value));
});
