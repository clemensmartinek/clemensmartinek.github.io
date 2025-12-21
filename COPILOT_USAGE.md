# Copilot Usage Guidelines

## Richtlinien für die Verwendung von Tailwind CSS

1. **Verwendung von Tailwind CSS**: Alle Stile müssen mit Tailwind CSS erstellt werden. Direkte CSS-Definitionen sind nur in der `theme.css`-Datei erlaubt.

2. **Light- und Dark-Theme-Kompatibilität**: Alle Inhalte müssen sowohl für das Light- als auch für das Dark-Theme optimiert sein.

   - Die `dark`-Klasse wird auf dem `<html>`-Element gesetzt, nicht auf `<body>`
   - Jedes sichtbare Element benötigt sowohl Light- als auch Dark-Varianten

3. **Strukturierung**:

   - Jede Seite sollte ihre eigene JavaScript-Datei haben, die denselben Namen wie die Seite trägt (z.B. `index.html` → `index.js`)
   - Sprache auf der gesamten Seite: **Deutsch**

4. **Wiederverwendbarkeit**: Die Tailwind-Konfiguration wurde in die Datei `tailwind.config.js` ausgelagert, um sie leicht wiederverwenden zu können.

## Navigation Guidelines

### Index-Seite (`index.html`)

- Zeigt das vollständige Navigationsmenü mit Dropdown
- Menüpunkt: **"Investitionen"** (nicht "Investments" oder "Home")
- Dropdown-Menü enthält Unterseiten

### Unterseiten (z.B. `stablecoin-lending.html`)

- Zeigen **NUR** einen "Zurück"-Button
- Kein vollständiges Navigationsmenü
- Zurück-Button führt immer zur `index.html`

### Navigation-Struktur

```html
<!-- Index-Seite -->
<nav>
	<div>Investitionen (Dropdown)</div>
	<button>Theme Toggle</button>
</nav>

<!-- Unterseiten -->
<nav>
	<a href="index.html">← Zurück</a>
	<button>Theme Toggle</button>
</nav>
```

## Beispiele für Theme-kompatible Klassen

### Hintergrundfarben

- `bg-white dark:bg-slate-800`
- `bg-gray-50 dark:bg-slate-700/50`
- `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`

### Textfarben

- `text-gray-800 dark:text-gray-100`
- `text-gray-600 dark:text-gray-400`
- `text-gray-700 dark:text-gray-300`

### Borders

- `border-gray-200 dark:border-slate-700`
- `border-gray-100 dark:border-slate-700`

### Buttons & Interactive Elements

- `bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600`

## Wichtige Regeln

- ❌ **KEIN** Inline-CSS oder direkte Stile in HTML-Elementen
- ❌ **KEINE** CSS-Definitionen außerhalb von `theme.css`
- ✅ Verwende immer Tailwind-Klassen mit `dark:`-Varianten
- ✅ Teste alle Änderungen sowohl im Light- als auch im Dark-Theme
- ✅ Verwende `document.documentElement` für Theme-Wechsel (nicht `document.body`)

## Theme-Toggle Implementierung

```javascript
// Correct: Verwende document.documentElement (= <html>)
const htmlElement = document.documentElement;
htmlElement.classList.toggle("dark");

// Wrong: document.body verwenden
document.body.classList.toggle("dark"); // ❌
```
