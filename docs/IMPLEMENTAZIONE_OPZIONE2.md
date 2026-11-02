# Implementazione Opzione 2: Server Go Embedded + File JSON

## Obiettivo
Trasformare l'applicazione React/TypeScript/Vite in un eseguibile nativo standalone (Windows/Linux) che:
- Incorpora il frontend buildato nel binario Go
- Espone API REST per la persistenza dati
- Salva i dati in `t3-data.json` accanto all'eseguibile
- Supporta PWA completa (Service Worker, installazione, offline, auto-update)
- Funziona senza Node.js, npm, o dipendenze esterne lato utente

---

## Architettura Finale

```
📦 Distribuzione (Windows)
├── t3-windows.exe       ← ~5.5 MB, singolo binario Go (CGO_ENABLED=0)
├── t3-data.json         ← Creato automaticamente al primo salvataggio
└── (browser si apre su http://localhost:PORT)

📦 Distribuzione (Linux)
├── t3-linux             ← ~5 MB, singolo binario Go (CGO_ENABLED=0)
├── t3-data.json         ← Creato automaticamente
└── (browser si apre su http://localhost:PORT)
```

**Flusso utente:** Doppio click su `.exe` → Server Go avvia su porta libera → Browser apre `http://localhost:XXXX` → App React servita da file embedded → API REST su `/api/tasks` → Dati persistiti su file JSON locale.

---

## File Creati/Modificati

### 🆕 Nuovi File

#### 1. `server/main.go` (Server Go Embedded)
**Dimensione:** ~8.6 KB, 347 righe
**Funzionalità:**
- `//go:embed dist/*` - Incorpora tutto il build frontend nel binario
- **API REST** `/api/tasks`:
  - `GET` - Lista tutti i task
  - `POST` - Crea nuovo task
  - `GET /api/tasks/:id` - Ottiene singolo task
  - `PUT /api/tasks/:id` - Aggiorna task (merge parziale campi)
  - `DELETE /api/tasks/:id` - Elimina task
- **Persistenza JSON atomica** (`t3-data.json`):
  - `sync.RWMutex` per thread-safety
  - Scrittura atomica: file `.tmp` + `os.Rename()`
  - Caricamento all'avvio, salvataggio a ogni modifica
- **SPA Handler** con fallback a `index.html` per routing client-side
- **Content-Type detection** per estensioni (.js, .css, .svg, .json, .woff2, ecc.)
- **Porta libera auto-detect** (8080-8180)
- **Apertura browser automatica** cross-platform (Windows: rundll32, macOS: open, Linux: xdg-open)

#### 2. `utils/api.ts` (Client API TypeScript)
**Funzionalità:**
- Wrapper `fetch` tipizzato per tutte le operazioni CRUD
- Gestione errori centralizzata con `handleResponse()`
- Funzioni: `loadTasks()`, `createTask()`, `updateTask()`, `deleteTask()`
- Tipi TypeScript allineati con `types.ts`

#### 3. `build-go.ps1` (Build Script Windows PowerShell)
**Funzionalità:**
1. `npm run build` → genera `dist/`
2. Inizializza `go.mod` in `server/` se assente
3. `go mod tidy`
4. Cross-compile Windows: `GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o ../t3-windows.exe ./server`
5. Cross-compile Linux: `GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o ../t3-linux ./server`
6. Output binari nella root del progetto

#### 4. `build-go.sh` (Build Script Linux/macOS Bash)
**Funzionalità identiche a `.ps1` per ambienti Unix**

#### 5. `.github/workflows/release.yml` (CI/CD GitHub Actions)
**Trigger:** Push tag `v*` (es. `v1.0.0`)
**Job:** `build` su `ubuntu-latest`
**Steps:**
1. Checkout + Setup Node.js 20 + Setup Go 1.22
2. `npm ci` + `npm run build`
3. `go mod init` + `go mod tidy` in `server/`
4. Build Windows + Linux binaries
5. `sha256sum` per checksums
6. `softprops/action-gh-release@v1` crea Release con asset:
   - `t3-windows.exe`
   - `t3-linux`
   - `SHA256SUMS`

#### 6. `tailwind.config.js` (Config Tailwind CSS)
**Custom colors** allineati al design originale:
```js
colors: {
  'brand-primary': '#14b8a6',
  'brand-secondary': '#0f766e',
  'base-100': '#1f2937',
  'base-200': '#374151',
  'base-300': '#4b5563',
  'text-primary': '#f3f4f6',
  'text-secondary': '#9ca3af',
}
```

#### 7. `postcss.config.js` (Config PostCSS)
```js
plugins: { tailwindcss: {}, autoprefixer: {} }
```

#### 8. `index.css` (Import Tailwind + Utilities)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
+ Utility `.scrollbar-thin` per scrollbar custom

#### 9. `public/manifest.json` + `public/sw.js` + `public/vite.svg`
Asset statici copiati in `dist/` da Vite durante build

---

### 🔄 File Modificati

#### 1. `index.html`
**Rimosso:**
- `<script src="https://cdn.tailwindcss.com">` (CDN Tailwind)
- `<script type="importmap">` con React da CDN (aistudiocdn.com)
**Aggiunto:**
- `<link rel="stylesheet" href="/index.css">` (Tailwind via build Vite)
- React ora bundlato nel build Vite

#### 2. `App.tsx` - Migrazione localStorage → API REST
**Rimosso:**
- `useState` iniziale con `localStorage.getItem('tasks')`
- `useEffect` salvataggio `localStorage.setItem('tasks', ...)`
**Aggiunto:**
- `useState` vuoto + `isLoading` state
- `useEffect` mount: `loadTasks()` → `setTasks()` + `setIsLoading(false)`
- Loading spinner durante caricamento iniziale
- Tutte le funzioni handler ora `async` + chiamano API:
  - `handleAddTask` → `createTask()` + `setTasks` optimistic update
  - `handleStartTask` → `updateTask()` (status + records)
  - `handlePauseTask` → `updateTask()` (status)
  - `handleConfirmStopTask` → `updateTask()` (status, currentTime, records)
  - `handleDeleteTask` → `deleteTask()` + filter locale
  - `handleUpdateTask` → `updateTask()` (name, tags, records)
- Timer interval invariato (aggiorna solo `currentTime` locale, server persiste solo su stop/pause)

#### 3. `vite.config.ts` - Invariato (funziona out-of-the-box)

#### 4. `types.ts`, `utils/time.ts`, `components/*` - Invariati (compatibili)

---

## Dipendenze Aggiunte

### `package.json` - `devDependencies`
```json
{
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x"
}
```
*Installate via `npm install -D tailwindcss@3 postcss autoprefixer`*

### `server/go.mod` (generato al primo build)
```go
module t3-tracker
go 1.22
```
*Zero dipendenze esterne - solo stdlib Go*

---

## Build Process

### Sviluppo (invariato)
```bash
npm run dev
# Vite dev server su http://localhost:5173
# Hot reload, TypeScript checking
```

### Produzione - Build Binari
```bash
# Windows (PowerShell)
.\build-go.ps1

# Linux/macOS (Bash)
chmod +x build-go.sh && ./build-go.sh
```

**Output:**
```
t3-windows.exe   (~5.5 MB)
t3-linux         (~5 MB)
```

### Release Automatica (GitHub)
```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions builda e pubblica Release con asset
```

---

## Persistenza Dati

### Formato `t3-data.json`
```json
{
  "tasks": [
    {
      "id": "1703980800000",
      "name": "Sviluppo feature X",
      "tags": ["lavoro", "frontend"],
      "records": [
        {
          "startTime": 1703980800000,
          "endTime": 1703984400000,
          "name": "Implementazione API",
          "duration": 3600
        }
      ],
      "status": 0,
      "currentTime": 0
    }
  ],
  "version": 1
}
```

### Caratteristiche
- **File-based** (non localStorage/IndexedDB)
- **Atomic writes** (temp file + rename = no corruption)
- **Thread-safe** (RWMutex)
- **Portabile** (spostando exe + json mantieni dati)
- **Human-readable** (JSON indented)
- **Versionato** (campo `version` per future migrazioni)

---

## PWA / Service Worker

Il Service Worker in `public/sw.js` funziona **out-of-the-box** perché:
- App servita via HTTP (non `file://`)
- `sw.js` registrato da `index.html`
- Cache-first strategy per asset statici
- Offline support per asset cached
- Auto-update alla nuova release (nuovo hash asset)

**Nota:** Per installazione PWA serve HTTPS o `localhost` (requisito browser). Il server Go usa `localhost` → PWA installabile.

---

## Testing Checklist

### Build
- [x] `npm run build` → `dist/` generato correttamente
- [ ] `go build` → `t3-windows.exe` creato
- [ ] `go build` → `t3-linux` creato (cross-compile)

### Runtime Windows
- [ ] `.\t3-windows.exe` avvia senza errori
- [ ] Browser apre `http://localhost:XXXX`
- [ ] UI carica (React + Tailwind)
- [ ] Crea task → persiste in `t3-data.json`
- [ ] Avvia/Pausa/Stop timer → aggiorna JSON
- [ ] Chiudi browser → riapri exe → task presenti
- [ ] Filtri ricerca/stato funzionano
- [ ] Daily summary calcola correttamente
- [ ] Install PWA prompt appare
- [ ] Offline: disconnetti rete → app funziona (asset cached)

### Runtime Linux
- [ ] `./t3-linux` avvia (su VM/WSL)
- [ ] Stessi test funzionali Windows

### Edge Cases
- [ ] Porta 8080 occupata → usa 8081, 8082...
- [ ] `t3-data.json` mancante → crea vuoto
- [ ] `t3-data.json` corrotto → reset graceful
- [ ] Spostare exe + json in altra cartella → funziona
- [ ] Eseguire due istanze simultanee → porta diversa, dati separati

---

## Criticità Note / Rischi

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Firewall Windows blocca prima esecuzione | Alta | Medio | Logga URL; utente permette "Reti private" |
| Porta 8080-8180 tutte occupate | Bassa | Basso | Fallback a 8080 |
| Browser non si apre (ambiente headless) | Bassa | Basso | Logga URL in console |
| Antivirus false positive (Go static binary) | Media | Medio | Code signing per produzione reale |
| Dati corrotti scrittura concorrente | Bassa | Alto | RWMutex + atomic write |
| Utente cancella `t3-data.json` | Bassa | Medio | Backup manuale; v2: auto-backup |

---

## Stima Sforzo Totale

| Fase | Ore |
|------|-----|
| Setup Tailwind + Vite build | 1 |
| Server Go (`main.go`) | 2 |
| API client TypeScript (`api.ts`) | 0.5 |
| Migrazione `App.tsx` | 1.5 |
| Build scripts (ps1/sh) | 0.5 |
| GitHub Actions workflow | 0.5 |
| Asset PWA (manifest, sw, icon) | 0.5 |
| Test cross-platform | 2 |
| **Totale** | **~8.5 ore** |

---

## Comandi Rapidi

```bash
# Sviluppo
npm run dev

# Build frontend only
npm run build

# Build binari (richiede Go 1.21+)
.\build-go.ps1        # Windows
./build-go.sh         # Linux/macOS

# Test locale
.\t3-windows.exe

# Release
git tag v1.0.0 && git push origin v1.0.0
```

---

## Prossimi Step Opzionali (v2+)

1. **Code signing** certificato per evitare SmartScreen warning
2. **Auto-updater** integrato (check GitHub releases all'avvio)
3. **Backup automatico** `t3-data.json.backup` giornaliero
4. **Export/Import** JSON via UI
5. **Tray icon** (Go `systray` lib) per nascondere in system tray
6. **Multi-user** (database SQLite invece di JSON)
7. **Sync cloud** (opzionale, es. WebDAV, S3, Dropbox API)

---

## Note per Manutentori

- **Non modificare `dist/` manualmente** - è generato da `npm run build`
- **Server Go usa solo stdlib** - zero vulnerabilità supply chain
- **Cross-compile** funziona da qualsiasi OS (Windows→Linux, Linux→Windows)
- **CGO_ENABLED=0** = static binary, no glibc versioning issues su Linux
- **ldflags="-s -w"** = strip symbol table + DWARF debug info (riduce size ~30%)
- **Embed FS** richiede Go 1.16+ (usiamo 1.22)

---

*Documento generato durante implementazione Opzione 2 - Task Time Tracker v2*
