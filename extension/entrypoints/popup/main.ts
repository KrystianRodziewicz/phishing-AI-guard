import './style.css';
import { analyzeUrl } from '../../lib/url-analyzer';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Nie znaleziono elementu app');
}

app.innerHTML = `
  <main>
    <h1>Phishing AI Guard</h1>
    <p>Wstępna analiza adresu bez otwierania strony</p>

    <form id="check-form">
      <label for="address">Adres do sprawdzenia</label>
      <input
        id="address"
        type="text"
        placeholder="https://demobnak.example"
        autocomplete="off"
        spellcheck="false"
        required
      />
      <button type="submit">Sprawdź adres</button>
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

if (!form || !input || !output) {
  throw new Error('Nie znaleziono elementów formularza');
}

const addressInput = input;
const resultPanel = output;

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const result = analyzeUrl(addressInput.value);

  resultPanel.replaceChildren();
  resultPanel.hidden = false;

  const heading = document.createElement('h2');

  if (result.status === 'invalid_input') {
    heading.textContent = 'Sprawdź wpisany adres';

    const message = document.createElement('p');
    message.textContent = result.message ?? 'Niepoprawny adres';

    resultPanel.append(heading, message);
    return;
  }

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
});
