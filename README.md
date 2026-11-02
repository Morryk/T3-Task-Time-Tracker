# T3 — Task Time Tracker

## Descrizione

T3 (Task Time Tracker) è un'applicazione di tracciamento del tempo **standalone e portabile**: un server Go incapsula il frontend React in un unico eseguibile — nessuna installazione, nessuna config, nessun database. Doppio click, e il tuo time tracker è in funzione sul browser.

Progettata per chiunque (sviluppatori, designer, studenti, freelance) abbia bisogno di sapere com'é stata spesa la giornata, con il minimo attrito: avvia, metti in pausa, fermi — e ottieni riepiloghi precisi per task e per giorno.

## Caratteristiche Principali

- **Eseguibile Standalone**: il frontend è *embeddato* nel binario (`go:embed`): nessuna cartella `dist` da distribuire, nessun server da configurare.
- **Creazione Semplice dei Task**: aggiungi rapidamente nuovi task fornendo un nome e, opzionalmente, dei tag per una migliore organizzazione (es. `lavoro`, `progetto-x`, `studio`).
- **Controllo Preciso del Tempo**:
  - **Avvia**: inizia a tracciare il tempo per un task.
  - **Pausa**: la sessione corrente viene chiusa e salvata con la durata precisa; alla ripresa si apre una nuova sessione — zero tempo "fantasma" né in pausa né a app chiusa.
  - **Stop**: termina la sessione di lavoro corrente, dandole un nome personale, e la salva nella cronologia del task.
  - **Ricarica a prova di errore**: se chiudi il browser o ricarichi la pagina con un timer in esecuzione, il tempo accumulato viene ricalcolato alla riapertura dal timestamp di start, senza perdere un secondo.
- **Gestione dei Task**:
  - **Modifica Task**: rinomina o cambia tag in qualsiasi momento (quando non è in esecuzione).
  - **Eliminazione Sicura**: elimina i task che non ti servono più (solo dopo averli fermati).
- **Cronologia Dettagliata delle Sessioni**: ogni task ha una cronologia espandibile con data, ora di inizio, ora di fine e durata di ogni sessione.
- **Nomi per le Sessioni**: etichetta ogni sessione con un nome significativo (es. "Implementazione login", "Correzione bug #123").
- **Filtro e Ricerca**: ricerca testuale per nome o tag, filtro per stato (`In Esecuzione`, `In Pausa`, `Fermati`, `Tutti`).
- **Riepiloghi Giornalieri**: il tempo totale tracciato ogni giorno, per una visione d'insieme della produttività.
- **Persistenza su File JSON**: tutti i dati vivono in un file umanamente leggibile (`t3-data.json`) accanto all'eseguibile — sopravvive a chiusure del browser, riavvii del PC e spostamenti della cartella. Nessun cloud, nessun account.
- **Installabile come App (PWA)**: manifest e Service Worker inclusi — installala dal menu del browser e usala a finestra piena; le API non finiscono mai in cache, i dati restano sempre aggiornati.
- **Design Responsivo**: interfaccia adattiva per desktop, tablet e mobile.

## Uso Rapido (senza installare nulla)

1. Scarica `t3-windows.exe` (o `t3-linux`) dalla pagina **Releases** del repository, oppure compilalo come descritto sotto.
2. **Doppio click** sull'eseguibile: apre automaticamente il browser su `http://localhost:8080`.
3. Lavora. I dati si salvano da soli in `t3-data.json`, creato accanto all'eseguibile al primo avvio.

Dettagli utili:

- **Porta intelligente**: se la 8080 è occupata, il server tenta le successive fino alla 8180, poi si affida a una porta casuale libera (l'indirizzo esatto è stampato in console).
- **Trasportabile**: copia o sposta *l'eseguibile insieme al suo `t3-data.json`* e i tuoi dati ti seguono — chiavetta USB, altro PC, altra cartella, indifferente.
- **Prima esecuzione su Windows**: il firewall potrebbe chiedere conferma per l'ascolto su `localhost`: consenti l'accesso alle **reti private**.
- **Singolo utente**: le istanze simultanee del server sulla stessa cartella condividono lo stesso file dati (ultima scrittura vince) — usa una sola istanza per cartella dati.

## Stack Tecnologico

- **Frontend**: React 18 + TypeScript + Vite 5 + Tailwind CSS.
- **Server**: **Go 1.22+ solo con la libreria standard** — serving statico via `go:embed`, REST su `/api/tasks`, persistenza atomica (**mutex RWMutex** + scrittura su file temporaneo + `rename`).
- **Zero dipendenze runtime del server**: nessun framework Go esterno, nessun database.

## Sviluppo in Locale

Prerequisiti: **Node.js 18+** con npm e **Go 1.22+**.

```bash
git clone https://github.com/Morryk/t3-task-time-tracker.git
cd t3-task-time-tracker
npm ci            # installazione pulita, versioni da package-lock.json
npm run dev       # server di sviluppo Vite (http://localhost:5173)
```

In sviluppo il frontend chiama le API del server Go: per avere anche il backend, lancia `./build-go.sh` una prima volta e avvia il binario generato (o sviluppa il frontend da solo con i dati mock).

## Compilare gli Eseguibili

```bash
./build-go.sh         # Linux/macOS
.\build-go.ps1        # Windows (PowerShell)
```

Lo script, in un colpo solo:

1. installa le dipendenze (`npm ci`);
2. compila il frontend (`npm run build`);
3. sincronizza `dist/` dentro `server/dist/` (il punto che il `go:embed` legge);
4. compila i binari incrociati dalla cartella `server/`;
5. lascia `t3-windows.exe` e `t3-linux` nella root del progetto, pronti all'uso.

Qualsiasi passo fallisca, lo script si interrompe con esito diverso da zero: niente binari mezzi.

## Release Automatiche (pipeline)

La pipeline GitHub Actions (`.github/workflows/release.yml`) pubblica una Release ad ogni tag `v*`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Il workflow su runner Ubuntu:

1. setup di Node 20 e Go 1.22 (con cache npm);
2. `npm ci` + `npm run build` + sync `dist → server/dist`;
3. build incrociata di `t3-windows.exe` e `t3-linux`;
4. generazione di `SHA256SUMS`;
5. pubblicazione della **Release** con i due binari + checksum e note generate automaticamente.

## Formato dei Dati

`t3-data.json`, scritto accanto all'eseguibile, formattato e indentato:

```json
{
  "tasks": [
    {
      "id": "1751708432401",
      "name": "Sviluppo feature di login",
      "tags": ["lavoro", "backend"],
      "status": 0,
      "currentTime": 0,
      "records": [
        { "startTime": 1751700000000, "endTime": 1751703123456 }
      ]
    }
  ],
  "version": 1
}
```

Note sul formato:

- `status`: `0` = fermo, `1` = in esecuzione (con record *aperto*, ovvero `endTime: null`);
- `currentTime`: secondi accumulati dalla sessione aperta, ricalcolati lato client al caricamento;
- la durata totale del task è la somma delle durate dei record.

## Struttura del Progetto

```
├── App.tsx                    # interfaccia principale React
├── index.tsx / index.html     # entry points
├── components/                # componenti UI (TaskItem, DailySummary, ...)
├── utils/                     # client API e helper
├── types.ts                   # tipi condivisi
├── public/                    # manifest.json + sw.js (PWA)
├── server/                    # server Go: main.go (go:embed, REST, persistenza)
├── build-go.sh / .ps1         # build completa (frontend + binari)
├── docs/                      # documentazione storica del progetto
└── .github/workflows/         # pipeline release
```

## Note Tecniche

- Il file `t3-data.json` con i tuoi dati reali è **escluso dal repository** (gitignored): non finirà mai in un commit o in una release.
- Se il file dati viene corrotto o manca, l'app riparte vuota in sicurezza e ricrea il file alla prima scrittura.
- Le API REST non vengono mai servite dalla cache del Service Worker: ciò che vedi è sempre lo stato reale dei dati.
