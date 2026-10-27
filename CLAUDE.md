# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SentAI is an AI email-writing assistant (React 19 + TypeScript + Tailwind 4 + Vite) that ships as both a web app (PWA) and an Electron desktop app from the same `src/` code. UI text and code comments are in Italian.

## Commands (pnpm)

- `pnpm dev` — reads `.env` and runs `scripts/start.js`, which launches `dev:web` (Vite on :3000) or `dev:electron` depending on `VITE_APP` (`web` | `desktop`).
- `pnpm dev:web` / `pnpm dev:electron` — run a target directly.
- `pnpm lint` — Biome check on `./src` (config in `biome.json`).
- `pnpm build` — `tsc -b` + Vite web build.
- `pnpm build:electron` — cleans `dist/` and `out/`, builds with electron-vite, packages Windows (zip) and Linux (AppImage/deb) into `dist/`.

There is no test suite. CI (`.github/workflows/ci.yml`) runs lint, `build`, and `build:electron` on PRs, so make sure all three pass.

## Environment

`.env` needs `VITE_APP` (`web`/`desktop`) and `VITE_ENV` (`development` enables dev behavior in `electron/main.ts`). API keys are not in `.env`: users enter them in the in-app settings, and they are kept in client storage.

## Architecture

- **Two build configs:** `vite.config.ts` (web + PWA) and `electron.vite.config.ts` (main `electron/main.ts`, preload `electron/preload.ts`, renderer = `src/`). Output goes to `out/` (Electron) and `dist/`.
- **Web vs desktop persistence:** `src/hooks/useAppHooks.ts` checks `import.meta.env.VITE_APP` and picks a backend. Desktop uses `useStorage`, which goes through `window.electronAPI` (preload) to the `save-data`/`load-data` IPC handlers. Those write `<key>.json` under Electron's `userData`. Web uses `useDrafts`/localStorage. Both are adapted to one interface that `App.tsx` consumes, so any change to draft operations must be made in both paths. `src/utils/storage.ts` and `LocalStorageLimitModal` handle the ~5MB localStorage limit on web.
- **AI layer:** all provider calls live in `src/services/ai.ts` (`refineEmail`, `reviseEmail`, `generateTitle`, `generateSubject`, `querySavedEmails`, `getModels`). They dispatch on `Provider` (`gemini` | `openai` | `anthropic` | `lmstudio`) and call the provider SDKs straight from the renderer. LM Studio uses raw `fetch` with URL normalization to `/api/v1`, and its URL can come from localStorage (`sentai_lmstudio_url`). To add a provider, extend `Provider` and every dispatch function.
- **State/logic hooks:** `useEmailLogic` orchestrates the editor and AI actions. Components in `src/components/` are mostly presentational modals and panels. Shared types are in `src/types/` (including the `electronAPI` typing in `electron.d.ts`).
- PDF export uses `pdfjs-dist` (`src/utils/pdf.ts`).

## Conventions

- Commit messages: Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `chore`, …) per `.github/copilot-commit-message-instructions.md`. Recent history uses Italian descriptions.
- Code review guidance (`.github/copilot-instructions.md`): avoid `any` and unsafe casts, handle errors in every async/network call, avoid `dangerouslySetInnerHTML`, and keep accessibility in mind (semantic elements, labels, keyboard navigation). Review comments are written in Italian.
- A jscpd code-duplication workflow runs in CI, so extract repeated logic instead of copying it.
