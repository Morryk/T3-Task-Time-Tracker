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
- **Vite**: Come build tool e server di sviluppo.
- **Tailwind CSS**: Per uno styling rapido e personalizzato direttamente nell'HTML.
- **Nessun Backend**: L'applicazione è interamente client-side, garantendo privacy e velocità.

## Esecuzione in Locale

Questa applicazione è costruita con React, TypeScript e Vite. Per eseguirla in locale, hai bisogno di Node.js e npm (o un altro package manager come yarn o pnpm) installati sul tuo computer.

Il setup precedente che suggeriva un semplice server statico non era corretto, poiché non poteva compilare il codice TypeScript/JSX. La nuova configurazione con Vite risolve questo problema.

1.  **Clona il Repository**
    ```bash
    git clone https://github.com/tuo-username/t3-task-time-tracker.git
    cd t3-task-time-tracker
    ```

2.  **Installa le Dipendenze**
    Esegui questo comando nella cartella principale del progetto per installare React, Vite e tutte le altre dipendenze necessarie.
    ```bash
    npm install
    ```

3.  **Avvia il Server di Sviluppo**
    Una volta completata l'installazione, avvia il server di sviluppo di Vite:
    ```bash
    npm run dev
    ```

4.  **Apri nel Browser**
    Vite ti mostrerà un URL nel terminale (solitamente `http://localhost:5173`). Apri questo indirizzo nel tuo browser per vedere l'applicazione in esecuzione. Il server si ricaricherà automaticamente ogni volta che modifichi un file sorgente.