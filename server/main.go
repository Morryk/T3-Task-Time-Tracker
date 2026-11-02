package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

//go:embed dist/*
var embeddedFiles embed.FS

// Data models (mirror TypeScript types)
type Task struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Tags        []string     `json:"tags"`
	Records     []TimeRecord `json:"records"`
	Status      int          `json:"status"`
	CurrentTime int          `json:"currentTime"`
}

type TimeRecord struct {
	StartTime int     `json:"startTime"`
	EndTime   *int    `json:"endTime,omitempty"`
	Name      *string `json:"name,omitempty"`
	Duration  *int    `json:"duration,omitempty"`
}

type Storage struct {
	Tasks   []Task `json:"tasks"`
	Version int    `json:"version"`
}

var (
	dataFile   string
	dataMu     sync.RWMutex
	currentData Storage
)

func main() {
	// 1. Risolvi path eseguibile e file dati accanto ad esso
	exePath, err := os.Executable()
	if err != nil {
		log.Fatal(err)
	}
	exeDir := filepath.Dir(exePath)
	dataFile = filepath.Join(exeDir, "t3-data.json")

	// 2. Carica dati esistenti
	loadData()

	// 3. Setup routes
	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/tasks", handleTasks)
	mux.HandleFunc("/api/tasks/", handleTaskByID)

	// SPA static files + fallback
	mux.HandleFunc("/", spaHandler)

	// 4. Ottieni listener su porta libera (default 8080)
	ln, err := getListener()
	if err != nil {
		log.Fatal(err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	addr := fmt.Sprintf("localhost:%d", port)

	// 5. Apri browser dopo breve delay
	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(fmt.Sprintf("http://%s", addr))
	}()

	// 6. Avvia server
	log.Printf("T3 Task Tracker avviato su http://%s", addr)
	log.Printf("Dati salvati in: %s", dataFile)
	log.Fatal(http.Serve(ln, mux))
}

// ---------- Data Persistence ----------

func loadData() {
	dataMu.Lock()
	defer dataMu.Unlock()

	b, err := os.ReadFile(dataFile)
	if err != nil {
		if os.IsNotExist(err) {
			currentData = Storage{Tasks: []Task{}, Version: 1}
			return
		}
		log.Printf("Errore lettura dati: %v", err)
		currentData = Storage{Tasks: []Task{}, Version: 1}
		return
	}

	if err := json.Unmarshal(b, &currentData); err != nil {
		log.Printf("Errore parsing JSON: %v", err)
		currentData = Storage{Tasks: []Task{}, Version: 1}
	}
}

func saveData() {
	dataMu.RLock()
	b, err := json.MarshalIndent(currentData, "", "  ")
	dataMu.RUnlock()
	if err != nil {
		log.Printf("Errore serializzazione: %v", err)
		return
	}

	// Scrittura atomica: scrivi temp + rename
	tmpFile := dataFile + ".tmp"
	if err := os.WriteFile(tmpFile, b, 0644); err != nil {
		log.Printf("Errore scrittura temp: %v", err)
		return
	}
	if err := os.Rename(tmpFile, dataFile); err != nil {
		log.Printf("Errore rename: %v", err)
	}
}

// ---------- HTTP Handlers ----------

func handleTasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		dataMu.RLock()
		json.NewEncoder(w).Encode(currentData.Tasks)
		dataMu.RUnlock()
	case http.MethodPost:
		var task Task
		if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		dataMu.Lock()
		if task.ID == "" {
			base := time.Now().UnixMilli()
			id := fmt.Sprintf("%d", base)
			exists := true
			for i := 0; exists && i < 64; i++ {
				exists = false
				for _, t := range currentData.Tasks {
					if t.ID == id {
						exists = true
						break
					}
				}
				if exists {
					id = fmt.Sprintf("%d", base+int64(i+1))
				}
			}
			if exists {
				id = fmt.Sprintf("%d-%d", base, rand.Int63())
			}
			task.ID = id
		}
		currentData.Tasks = append([]Task{task}, currentData.Tasks...)
		dataMu.Unlock()
		saveData()
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(task)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleTaskByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id := strings.TrimPrefix(r.URL.Path, "/api/tasks/")
	if id == "" {
		http.Error(w, "Missing ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		dataMu.RLock()
		for _, t := range currentData.Tasks {
			if t.ID == id {
				json.NewEncoder(w).Encode(t)
				dataMu.RUnlock()
				return
			}
		}
		dataMu.RUnlock()
		http.Error(w, "Task not found", http.StatusNotFound)

	case http.MethodPut:
		var updates map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		dataMu.Lock()
		found := false
		for i, t := range currentData.Tasks {
			if t.ID == id {
				found = true
				// Apply updates (merge manuale campi noti)
				if name, ok := updates["name"].(string); ok {
					currentData.Tasks[i].Name = name
				}
				if tags, ok := updates["tags"].([]interface{}); ok {
					strTags := make([]string, len(tags))
					for j, v := range tags {
						if s, ok := v.(string); ok {
							strTags[j] = s
						}
					}
					currentData.Tasks[i].Tags = strTags
				}
				if records, ok := updates["records"].([]interface{}); ok {
					newRecords := make([]TimeRecord, len(records))
					for j, r := range records {
						if rm, ok := r.(map[string]interface{}); ok {
							rec := TimeRecord{}
							if st, ok := rm["startTime"].(float64); ok {
								rec.StartTime = int(st)
							}
							if et, ok := rm["endTime"].(float64); ok {
								val := int(et)
								rec.EndTime = &val
							}
							if nm, ok := rm["name"].(string); ok {
								rec.Name = &nm
							}
							if dr, ok := rm["duration"].(float64); ok {
								val := int(dr)
								rec.Duration = &val
							}
							newRecords[j] = rec
						}
					}
					currentData.Tasks[i].Records = newRecords
				}
				if status, ok := updates["status"].(float64); ok {
					currentData.Tasks[i].Status = int(status)
				}
				if ct, ok := updates["currentTime"].(float64); ok {
					currentData.Tasks[i].CurrentTime = int(ct)
				}
				break
			}
		}
		dataMu.Unlock()
		if !found {
			http.Error(w, "Task not found", http.StatusNotFound)
			return
		}
		saveData()
		w.WriteHeader(http.StatusOK)

	case http.MethodDelete:
		dataMu.Lock()
		newTasks := make([]Task, 0, len(currentData.Tasks))
		for _, t := range currentData.Tasks {
			if t.ID != id {
				newTasks = append(newTasks, t)
			}
		}
		currentData.Tasks = newTasks
		dataMu.Unlock()
		saveData()
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// ---------- SPA Handler (serve embedded files + index.html fallback) ----------

func spaHandler(w http.ResponseWriter, r *http.Request) {
	// Prova file embedded
	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "" {
		path = "index.html"
	}

	f, err := embeddedFiles.Open("dist/" + path)
	if err == nil {
		defer f.Close()
		stat, _ := f.Stat()
		if !stat.IsDir() {
			// Determina content type
			setContentType(w, path)
			io.Copy(w, f)
			return
		}
	}

	// Fallback: index.html per SPA routing
	index, _ := embeddedFiles.ReadFile("dist/index.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(index)
}

func setContentType(w http.ResponseWriter, path string) {
	switch {
	case strings.HasSuffix(path, ".html"):
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case strings.HasSuffix(path, ".js"):
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	case strings.HasSuffix(path, ".css"):
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case strings.HasSuffix(path, ".svg"):
		w.Header().Set("Content-Type", "image/svg+xml")
	case strings.HasSuffix(path, ".png"):
		w.Header().Set("Content-Type", "image/png")
	case strings.HasSuffix(path, ".json"):
		w.Header().Set("Content-Type", "application/json")
	case strings.HasSuffix(path, ".ico"):
		w.Header().Set("Content-Type", "image/x-icon")
	case strings.HasSuffix(path, ".woff2"):
		w.Header().Set("Content-Type", "font/woff2")
	case strings.HasSuffix(path, ".woff"):
		w.Header().Set("Content-Type", "font/woff")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}
}

// ---------- Utilities ----------

func getListener() (net.Listener, error) {
	for port := 8080; port <= 8180; port++ {
		ln, err := net.Listen("tcp", fmt.Sprintf("localhost:%d", port))
		if err == nil {
			return ln, nil
		}
	}
	return net.Listen("tcp", "localhost:0")
}

func openBrowser(url string) {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32.exe"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default: // linux
		cmd = "xdg-open"
		args = []string{url}
	}
	
	err := exec.Command(cmd, args...).Start()
	if err != nil {
		log.Printf("Impossibile aprire browser automaticamente: %v", err)
		log.Printf("Apri manualmente: %s", url)
	}
}
