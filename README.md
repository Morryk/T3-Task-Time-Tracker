# T3 - Task Time Tracker

## Descrizione

T3 (Task Time Tracker) è un'applicazione web moderna, semplice ed elegante progettata per aiutarti a monitorare il tempo che dedichi ai tuoi task. Che tu sia uno sviluppatore, un designer, uno studente o chiunque abbia bisogno di gestire il proprio tempo in modo efficace, T3 ti offre gli strumenti per farlo con il minimo sforzo.

L'interfaccia pulita e intuitiva ti permette di concentrarti su ciò che conta davvero: il tuo lavoro. Con pochi click, puoi avviare, mettere in pausa e fermare i timer, ottenendo un resoconto dettagliato di come impieghi la tua giornata.

## Caratteristiche Principali

- **Creazione Semplice dei Task**: Aggiungi rapidamente nuovi task fornendo un nome e, opzionalmente, dei tag per una migliore organizzazione (es. `lavoro`, `progetto-x`, `studio`).

- **Controllo Preciso del Tempo**:
  - **Avvia**: Inizia a tracciare il tempo per un task.
  - **Pausa**: Metti in pausa il timer quando prendi una pausa, senza perdere il conteggio.
  - **Stop**: Termina la sessione di lavoro corrente, salvandola nella cronologia del task.

- **Gestione dei Task**:
  - **Modifica Task**: Modifica il nome e i tag di un task esistente in qualsiasi momento (quando non è in esecuzione).
  - **Eliminazione Sicura**: Elimina i task che non ti servono più (solo dopo averli fermati).

- **Cronologia Dettagliata delle Sessioni**:
  - Ogni task ha una cronologia espandibile che mostra tutte le sessioni di lavoro completate.
  - Per ogni sessione, puoi visualizzare la data, l'ora di inizio, l'ora di fine e la durata totale.

- **Nomi per le Sessioni**: Quando fermi un timer, hai la possibilità di dare un nome specifico a quella sessione (es. "Implementazione login", "Correzione bug #123"), per un tracciamento ancora più granulare.

- **Filtro e Ricerca**:
  - **Ricerca Testuale**: Cerca rapidamente tra i tuoi task per nome o per tag.
  - **Filtro per Stato**: Filtra la visualizzazione per mostrare solo i task `In Esecuzione`, `In Pausa`, `Fermati` o `Tutti`.

- **Riepiloghi Giornalieri**: Una sezione riepilogativa mostra il tempo totale tracciato per ogni giorno, permettendoti di avere una visione d'insieme della tua produttività nel tempo.

- **Design Responsivo**: L'applicazione è completamente responsiva e funziona perfettamente su desktop, tablet e dispositivi mobili.

- **Persistenza dei Dati**: Tutti i tuoi task e i relativi record di tempo vengono salvati nel `localStorage` del tuo browser. Ciò significa che i tuoi dati rimangono disponibili anche se chiudi o aggiorni la pagina.

## Stack Tecnologico

- **React**: Per la costruzione di un'interfaccia utente reattiva e modulare.
- **TypeScript**: Per un codice più robusto, sicuro e manutenibile.
- **Tailwind CSS**: Per uno styling rapido e personalizzato direttamente nell'HTML.
- **Nessun Backend**: L'applicazione è interamente client-side, garantendo privacy e velocità.

## Come Utilizzare

1.  **Aggiungi un Task**: Scrivi il nome del task nel campo di testo principale e premi "Add Task".
2.  **Inizia a Tracciare**: Clicca sull'icona ▶️ (play) per avviare il timer.
3.  **Gestisci il Timer**: Usa i pulsanti ⏸️ (pausa) e ⏹️ (stop) per controllare il tracciamento.
4.  **Visualizza la Cronologia**: Clicca sulla freccia vicino al nome del task per espandere e vedere le sessioni passate.
5.  **Filtra i Task**: Usa la barra di ricerca e i pulsanti di stato per trovare facilmente ciò che cerchi.

## Esecuzione in Locale

Dato che l'applicazione utilizza i moduli JavaScript (ES Modules) direttamente nel browser, non puoi semplicemente aprire il file `index.html` dal tuo file system. Hai bisogno di un server web locale per servire i file correttamente.

Ecco alcuni modi semplici per avviare un server locale:

1.  **Clona il Repository**
    ```bash
    git clone https://github.com/tuo-username/t3-task-time-tracker.git
    cd t3-task-time-tracker
    ```

2.  **Avvia un Server Web**

    *   **Opzione 1: Con Node.js**
        Se hai Node.js installato, puoi usare il pacchetto `serve`. Esegui questo comando nella cartella del progetto:
        ```bash
        npx serve
        ```
        L'applicazione sarà disponibile all'indirizzo indicato nel terminale (solitamente `http://localhost:3000`).

    *   **Opzione 2: Con Python**
        Se hai Python installato, puoi usare il suo server HTTP integrato.
        - Per Python 3:
          ```bash
          python3 -m http.server
          ```
        - Per Python 2:
          ```bash
          python -m SimpleHTTPServer
          ```
        L'applicazione sarà disponibile su `http://localhost:8000`.

    *   **Opzione 3: Con l'estensione "Live Server" di VS Code**
        Se usi Visual Studio Code, puoi installare l'estensione [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer). Una volta installata, clicca con il tasto destro sul file `index.html` e seleziona "Open with Live Server".

3.  **Apri nel Browser**
    Apri il tuo browser e naviga all'URL fornito dal server locale (es. `http://localhost:3000` o `http://localhost:8000`).
