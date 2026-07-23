import { spawn } from 'node:child_process';
import { config } from 'dotenv';

// Carica le variabili dal file .env
config();

const appMode = process.env.VITE_APP || 'web'; // Default a web se non specificato

console.log(`>>> Avvio dell'applicazione in modalità: ${appMode}`);

let command = '';
let args = [];

if (appMode === 'desktop') {
  command = 'pnpm';
  args = ['run', 'dev:electron'];
} else {
  command = 'pnpm';
  args = ['run', 'dev:web'];
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error("Errore nell'avvio:", err);
});
