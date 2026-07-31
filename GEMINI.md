# System Prompt Guidelines per la Generazione di Codice Frontend

Questo documento definisce le linee guida stringenti che l'Assistente AI deve seguire nella generazione, modifica e refactoring del codice per questo progetto.

---

## 🛠️ Stack Tecnologico e Tooling

L'ambiente di sviluppo si basa su:

- **Build Tool:** Vite.js
- **Libreria/Framework:** React (Functional Components, Custom Hooks)
- **Linguaggio:** TypeScript (Strict Mode)
- **Styling:** TailwindCSS
- **Code Quality & Formatting:** ESLint & Prettier

---

## 📁 Architettura e Struttura delle Cartelle

Tutto il codice sorgente deve risiedere nella cartella `src/` e rispettare rigorosamente la seguente alberatura:

src/
├── components/ # Componenti riutilizzabili dell'interfaccia
│ ├── ui/ # Componenti UI atomici/presentazionali (es. Button, Input, Modal)
│ └── containers/ # Componenti contenitore o layout specifici di feature
├── pages/ # Componenti pagina di alto livello (routing)
├── hooks/ # Custom React Hooks per la gestione dello stato e della logica
├── services/ # Chiamate API esterne, SDK specifici e integrazioni
├── utils/ # Funzioni utility helper e pure functions globali
├── types/ # Definizione dei tipi TypeScript globali e interfacce
└── store/ # Gestione dello stato globale (Zustand, Jotai, Redux, React Context)

---

## 📜 Regole per la Scrittura del Codice

### 1. Singola Responsabilità & Esportazione

- **Un solo componente per file:** Ogni file `.tsx` presente nelle cartelle `components/` o `pages/` deve esportare **un solo ed unico componente React**.
- **Separazione della logica:** I componenti visuali devono contenere **la minor quantità di logica possibile**.
  - Estrarre la logica di stato e la gestione dei dati in **Custom Hooks**, nello **Store** (`src/store`), o in funzioni in `src/utils`.
  - La gestione delle chiamate di rete deve risiedere esclusivamente in `src/services`.
- **Esportazione:** Tutti i componenti devono essere esportati come **default export**. L'uso di named exports è consentito solo per funzioni helper o costanti strettamente correlate al componente.
- **Nomenclatura dei file:** Il nome del file deve corrispondere al nome del componente (es. `UserProfile.tsx` per il componente `UserProfile`).
- **Evita l'over-engineering:** Non creare componenti o hook inutilmente complessi o generici se non strettamente necessario.

### 2. Limite Dimensionale delle Righe di Codice

- **Limite standard:** Ogni file di componente non deve superare **300 righe di codice**.
- **Soglia di tolleranza:** È ammessa un'estensione massima fino a **350 righe** solo in casi eccezionali.
- **Refactoring obbligatorio:** Se un componente supera le 350 righe, l'AI ha l'obbligo di scomporlo e modularizzarlo in sotto-componenti o estratti logici.

### 3. Commenti nel Codice

- **Non invasivi e sintetici:** Inserire commenti **solo ed esclusivamente dove strettamente necessario**.
- **Cosa commentare:** Algoritmi complessi, passaggi non intuitivi o scelte architetturali particolari.
- **Cosa NON commentare:** Evitare commenti ridondanti o ovvi (es. `// Componente bottone`, `// Imposta lo stato`).
- **Formato dei commenti:** Utilizzare il formato JSDoc per funzioni, props e interfacce pubbliche.

### 4. Tipizzazione con TypeScript

- **No `any` implicito o esplicito:** Utilizzare sempre interfacce o tipi ben definiti.
- **Tipi globali vs locali:** I tipi condivisi e le strutture dati di dominio vanno posizionati in `src/types` all'interno di specifici file (`*.d.ts`) per contesto.
- **Props dei componenti:** Tutti i componenti devono avere le props tipizzate con interfacce o tipi TypeScript. Evitare l'uso di `any` o `object` generici.
- **Tipi per funzioni e callback:** Tutte le funzioni, incluse le callback passate come props, devono avere una tipizzazione chiara e specifica.
- **Tipi per gli stati:** Gli stati locali dei componenti devono essere tipizzati in modo esplicito, evitando inferenze implicite che possano portare a errori di runtime.
- **Tipi per le API:** Le risposte delle chiamate API devono essere tipizzate con interfacce dedicate, evitando l'uso di `any` o `unknown`.
- **Readonly e immutabilità:** Utilizzare `readonly` per proprietà che non devono essere mutate, specialmente in oggetti e array passati come props.

### 5. Best Practices di Scrittura e Leggibilità del Codice

- **Naming Convention:** Tutti i nomi di variabili, funzioni, costanti, interfacce, tipi, props e file devono essere rigorosamente scritti in **inglese** (es. `isFetching`, `userList`, `handleSubmit`).
- **Immutabilità rigorosa (`const` by default):**
  - Utilizzare **sempre** `const` per la dichiarazione di variabili, funzioni e componenti.
  - L'utilizzo di `let` è concesso **unicamente** quando il valore deve essere effettivamente riassegnato (es. cicli di accumulo o contatori mutabili). L'uso di `var` è severamente vietato.
- **Modern React & Clean Code:**
  - Preferire **Arrow Functions** per la dichiarazione di componenti e funzioni helper.
  - Sfruttare l'optional chaining (`?.`), nullish coalescing (`??`) e la destrutturazione avanzata per ridurre i blocchi `if/else` nidificati.
  - Evitare la logica inline complessa all'interno del JSX: estrarre le condizioni in variabili descrittive con `const` (es. `const hasAccess = user.role === 'admin' && isVerified;`).

### 6. Accessibilità e Gestione delle Classi CSS

- **Accessibilità (a11y):**
  - Tutti i componenti interattivi devono rispettare gli standard WAI-ARIA (es. attributi `aria-*`, ruoli semantici HTML5, gestione del focus da tastiera e testi per screen reader con `sr-only` o `aria-label`).
  - Garantire la navigabilità completa tramite tastiera (`Tab`, `Enter`, `Escape`).
- **Styling & Class Management (`tailwind-merge` & `clsx` / `classnames`):**
  - Per la gestione dinamica delle classi CSS e la risoluzione dei conflitti Tailwind, utilizzare sempre l'utility combinata `clsx` e `tailwind-merge` (incapsulata in una funzione helper globale come `cn()`).
  - Evitare concatenazioni manuali o confuse di stringhe nel JSX per le classi Tailwind.

---

## 🔄 Protocollo di Modifica e Verifica del Codice

Ad ogni modifica o nuova generazione di codice, l'AI deve verificare tassativamente:

1. **Lint Check (`npm run lint`):** Rispetto delle regole ESLint e Prettier.
2. **Type Check (`npx tsc --noEmit`):** Assenza di errori di tipo TypeScript.
3. **Build Check (`npm run build`):** Corretta compilazione del progetto con Vite.js.
