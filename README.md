# SentAI

SentAI è un assistente per la gestione e la scrittura delle email. Usa modelli di intelligenza artificiale per creare, riscrivere e perfezionare i messaggi in base a tono, lingua, struttura e contesto.

## Features

- **Scrittura assistita:** crea e perfeziona email a partire da una bozza e da istruzioni personalizzate.
- **Gestione delle bozze:** salva, modifica, elimina e organizza le email e le conversazioni.
- **Provider multipli:** supporta Google Gemini, OpenAI, Anthropic e LM Studio.
- **Esportazione PDF:** esporta le email rifinite in formato PDF.
- **Modalità web e desktop:** usa SentAI nel browser oppure come applicazione Electron.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Build tool:** Vite ed Electron Vite
- **Desktop:** Electron
- **AI services:** OpenAI, Anthropic, Google Gemini, LM Studio

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12 o superiore
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Configurazione

Crea un file `.env` nella root del progetto. Per l'applicazione web:

```env
VITE_APP="web"
VITE_ENV="development"
```

Per l'applicazione desktop Electron:

```env
VITE_APP="desktop"
VITE_ENV="development"
```

Le chiavi API non sono richieste nel file `.env`: possono essere inserite dalla finestra delle impostazioni dell'applicazione. SentAI supporta i provider `gemini`, `openai`, `anthropic` e `lmstudio`.

### Running the App

Con `.env` configurato su `VITE_APP="web"`:

```bash
pnpm dev
```

L'applicazione web sarà disponibile su `http://localhost:3000`.

Con `.env` configurato su `VITE_APP="desktop"`:

```bash
pnpm dev
```

Electron avvierà automaticamente il server Vite del renderer e la finestra desktop. In alternativa, puoi avviare direttamente i due target:

```bash
pnpm dev:web
pnpm dev:electron
```

### Lint

```bash
pnpm lint
```

### Building for Production

```bash
pnpm build
```

Per creare i pacchetti desktop per Windows e Linux:

```bash
pnpm build:electron
```

Gli artefatti vengono generati nella cartella `dist/`.

## ⚙️ Configurazione

Per utilizzare l'applicazione, dovrai inserire le tue chiavi API nel pannello delle impostazioni dell'app:

- **Google Gemini**: Ottieni una chiave su [Google AI Studio](https://aistudio.google.com/).
- **OpenAI**: Ottieni una chiave sulla [piattaforma OpenAI](https://platform.openai.com/).
- **Anthropic**: Ottieni una chiave sulla [piattaforma Anthropic](https://console.anthropic.com/).

## 📝 Licenza

Questo progetto è distribuito sotto la licenza MIT. Vedere il file `LICENSE` per ulteriori dettagli.
