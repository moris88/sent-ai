import { spawn } from "node:child_process";

const appMode = process.env.VITE_APP || "web"; // Default a web se non specificato

console.log(`>>> Avvio dell'applicazione in modalità: ${appMode}`);

let command = "";

if (appMode === "desktop") {
  command = "pnpm dev:electron";
} else if (appMode === "web") {
  command = "pnpm dev:web";
} else {
  console.error(`Modalità sconosciuta: ${appMode}. Usa "desktop" o "web".`);
  process.exitCode = 1;
}

if (command) {
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("error", (err) => {
    console.error("Errore nell'avvio:", err);
  });
}
