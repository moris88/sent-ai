import { spawn } from 'node:child_process';
import { config } from 'dotenv';

// Carica le variabili dal file .env
config();

const appMode = process.env.VITE_APP || 'web'; // Default a web se non specificato

console.log(`>>> Avvio dell'applicazione in modalità: ${appMode}`);

let command = '';
let args = [];

if (appMode === 'desktop') {
  command = 'npm';
  args = ['run', 'dev:electron', '--', '--no-sandbox'];
} else {
  command = 'npm';
  args = ['run', 'dev'];
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_APP: 'desktop',
    VITE_ENV: 'production',
  },
});

child.on('error', (err) => {
  console.error("Errore nell'avvio:", err);
});
