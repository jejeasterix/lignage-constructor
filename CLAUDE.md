# CLAUDE.md — Lignage-Constructor

## Projet

Générateur de lignage scolaire pour ENI (Écrans Numériques Interactifs).
Application **100% client-side** React + TypeScript + Vite.
Développé par **Vidéo Synergie**.
Non publié / non hébergé — développement local uniquement.

## Commandes

```bash
npm run dev      # Serveur de dev Vite (hot reload)
npm run build    # Build prod (tsc -b && vite build)
npm run preview  # Prévisualiser le build
npm run lint     # ESLint
```

## Architecture

**Monolithique** — toute l'app est dans `src/App.tsx` (~605 lignes).
Pas de sous-composants, pas de store externe, pas de CSS externe.

```
src/
  main.tsx       # Point d'entrée (render <App />)
  App.tsx        # TOUT le code : state, rendu, UI, export
  index.css      # Reset CSS minimal
```

Le fichier `lignage-generator.tsx` à la racine est une copie de référence (ne pas modifier).

## Conventions de code

### Styling
- **Inline CSS uniquement** via objets JS (pas de Tailwind, pas de CSS modules)
- Palette de couleurs centralisée dans l'objet `C` en haut de App.tsx
- Objets de style réutilisables : `inp` (inputs), `btnPrimary`, `btnSmall()`, `sel` (selects)
- Ne pas ajouter de fichiers CSS — tout reste inline

### Couleurs clés
- Accent : `#00b4d8` (cyan Vidéo Synergie)
- Accent hover : `#0096c7`
- Danger : `#ef4444`
- Success : `#10b981`
- Texte : `#1e293b`
- Fond app : `#f0f4f8`

### State
- `useState` / `useCallback` / `useEffect` uniquement (pas de useReducer, pas de context)
- Mise à jour immutable des layers via `.map()` et spread
- IDs générés par `uid()` (Math.random base36)

### TypeScript
- `@ts-nocheck` en tête de App.tsx, `strict: false` dans tsconfig.app.json
- Pas de types/interfaces explicites pour l'instant
- Ne pas ajouter de types stricts sans demande explicite

## Pipeline de rendu

1. **Prévisualisation** : `drawCanvas()` → `renderToCanvas(canvas, 1, gridScale)` — Canvas API
2. **Export SVG** : `generateSVG()` — construction XML string, éléments `<line>` + `<rect>`
3. **Export PNG/JPG** : canvas temporaire à résolution `quality×`, puis `toBlob()`
4. **Export PDF** : popup avec SVG base64 en `<img>`, `window.print()` après 500ms

La prévisualisation se redessine automatiquement via `useEffect` sur les dépendances.
Le `ResizeObserver` sur le container ajuste l'échelle d'affichage.

## Modèle de données

### Layer (niveau de lignes)
```
{ id, name, axisH, axisV, stepY, stepX, thickness, color, style, opacity, visible }
```

### Margin
```
{ enabled, position, color, thickness, style }
```

### Styles de trait
- `"solid"` → pas de dash
- `"dashed"` → dasharray [6, 4]
- `"dotted"` → dasharray [2, 3]

## Limitations actuelles (bugs/incomplétudes)

- **Image de fond** : state `bgImage` alimenté par upload mais **jamais rendu** dans le canvas ni le SVG
- **Pas de persistance** : presets custom perdus au rechargement (pas de localStorage)
- **Pas de tests** : aucun framework de test installé
- **Monolithique** : tout dans un seul composant

## Points d'attention

- Le canvas se redessine à chaque changement de state — pas de debounce
- L'auto-orientation se déclenche au changement de format (sauf "custom")
- `gridScale` affecte les espacements ET la position de la marge
- `quality` n'affecte que les exports PNG/JPG (pas SVG ni la preview)
- Les presets appliqués régénèrent les IDs des layers via `uid()`
- Les lignes commencent à `step` (pas à 0) — il n'y a pas de ligne sur le bord

## Branding Vidéo Synergie

- Logo : `https://i.imgur.com/ciCS5KO.png`
- Site : `https://www.videosynergie.com`
- Couleur marque : cyan `#00b4d8`
- Thème clair uniquement (pas de dark mode)
- Typo : `'Inter','Segoe UI',system-ui,sans-serif`

## Langue

L'interface et les commentaires sont en **français**. Communiquer en français.
