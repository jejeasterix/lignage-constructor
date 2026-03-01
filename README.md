# Générateur de Lignage Scolaire — Vidéo Synergie

## Contexte

Application web destinée aux **enseignants d'écoles élémentaires (maternelle et primaire)** en France. Développée par **Vidéo Synergie**, entreprise spécialisée dans l'intégration de solutions audiovisuelles et numériques pour l'éducation (ENI — Écrans Numériques Interactifs).

### Problème résolu

Les logiciels pour ENI (ActivInspire, myViewBoard) et les logiciels de tableaux blancs proposent des fonds de type "Seyes" (grands carreaux français), mais étant des produits internationaux, **les lignages ne correspondent jamais exactement aux attentes des enseignants français**. Cette application permet à chaque enseignant de **créer son propre lignage sur mesure** et de l'exporter pour l'utiliser sur son ENI ou pour l'impression.

---

## Stack technique

| Composant | Technologie | Version |
|---|---|---|
| Framework | React | 19.2.0 |
| Langage | TypeScript | 5.9.3 |
| Build | Vite | 7.3.1 |
| Styling | Inline CSS (objet `C` de palette) | — |
| Rendu | HTML Canvas (prévisualisation + export raster) | — |
| Export vectoriel | SVG natif (construction de chaîne XML) | — |
| Persistance | Aucune (pas de localStorage, ni backend) | — |

### Application 100% client-side

L'application est **100% client-side**. Aucune donnée n'est envoyée à un serveur. Les presets sauvegardés ne survivent pas au rechargement de la page (pas de persistance implémentée).

L'application **n'est pas encore publiée ni hébergée**. Elle fonctionne uniquement en local via `npm run dev` ou depuis un build statique (`npm run build`).

---

## Architecture

### Structure du projet

```
Lignage-constructor/
├── index.html              # Point d'entrée HTML
├── package.json            # Dépendances (React 19, Vite 7)
├── vite.config.ts          # Configuration Vite (plugin React)
├── tsconfig.json           # TypeScript composite config
├── tsconfig.app.json       # TS config app (strict: false)
├── tsconfig.node.json      # TS config build (strict: true)
├── eslint.config.js        # ESLint + React Hooks + TypeScript
├── lignage-generator.tsx   # Copie de référence (même contenu que App.tsx)
├── dist/                   # Build de production
├── public/                 # Assets statiques
└── src/
    ├── main.tsx            # Point d'entrée React (render <App />)
    ├── App.tsx             # Composant unique — toute la logique (605 lignes)
    └── index.css           # CSS global minimal (reset + overflow)
```

### Architecture monolithique

Toute l'application est contenue dans **un seul composant** `App` (`src/App.tsx` — 605 lignes). Il n'y a pas de décomposition en sous-composants.

---

## Fonctionnalités

### 1. Fond (arrière-plan)

- **Couleur unie** via color picker + champ hex
- **Image de fond** : upload fichier (state `bgImage` existe) — **non fonctionnel** : l'image est chargée en Data URL mais n'est pas rendue dans le canvas ni dans le SVG
- Bouton de suppression de l'image de fond (UI présente)

### 2. Système de niveaux de lignes (illimité)

Nombre illimité de niveaux superposés. Chaque niveau est indépendant.

#### Paramètres par niveau

| Paramètre | Type | Détail |
|---|---|---|
| `name` | texte | Nom personnalisé (ex: "Lignes principales H") |
| `axisH` | checkbox | Active/désactive les lignes horizontales |
| `axisV` | checkbox | Active/désactive les lignes verticales |
| `stepY` | nombre (px, min 1) | Espacement vertical entre lignes horizontales |
| `stepX` | nombre (px, min 1) | Espacement horizontal entre lignes verticales |
| `thickness` | nombre (px, pas 0.1, min 0.1) | Épaisseur du trait |
| `color` | color picker + hex | Couleur du trait |
| `style` | select | `solid` (Continu) / `dashed` (Tirets 6,4) / `dotted` (Pointillé 2,3) |
| `opacity` | slider 0-100% (pas 5%) | Transparence du niveau |
| `visible` | toggle (icône œil) | Masquer/afficher sans supprimer |

#### Actions sur les niveaux

- **Ajouter** : crée un niveau avec valeurs par défaut (H seul, 40px, violet, 80%)
- **Supprimer** : bouton ✕ rouge
- **Réordonner** : boutons ▲/▼ (swap adjacent, l'ordre détermine le z-index)
- **Déplier/replier** : clic sur l'en-tête du niveau (accordéon, un seul ouvert à la fois)
- **Visibilité** : bouton œil (opacité réduite quand masqué)

### 3. Marge

- **Activer/désactiver** : checkbox
- **Position** : distance depuis le bord gauche (px)
- **Épaisseur** : nombre (px, pas 0.1)
- **Couleur** : color picker + hex
- **Style** : Continu / Tirets / Pointillé
- Section repliable dans l'onglet Niveaux

### 4. Échelle et qualité (2 contrôles séparés)

| Contrôle | Plage | Pas | Rôle |
|---|---|---|---|
| **Échelle du quadrillage** (`gridScale`) | 25% — 300% | 5% | Multiplie les espacements (pas X/Y) et la position de la marge. Affecte la prévisualisation ET tous les exports. Ne modifie pas les dimensions de page. |
| **Qualité export** (`quality`) | ×1 — ×8 | ×1 | Multiplie la résolution du canvas pour les exports PNG/JPG uniquement. Défaut ×4. L'info-bulle affiche les dimensions résultantes. |

### 5. Format de page

| Format | Dimensions (px) | Notes |
|---|---|---|
| A4 | 794 × 1122 | Standard papier |
| A3 | 1122 × 1587 | Grand format |
| 16:9 (ENI) | 960 × 540 | Écran numérique interactif |
| 4:3 | 800 × 600 | Ratio classique |
| Personnalisé | Saisie libre (min 100) | Largeur + Hauteur en px |

- **Orientation** : Portrait / Paysage (boutons toggle)
- **Auto-orientation** : quand un format prédéfini est sélectionné, l'orientation se met à jour automatiquement selon les dimensions natives (portrait si h > w, paysage sinon). Le format "Personnalisé" ne déclenche pas d'auto-orientation.

### 6. Presets (modèles prédéfinis)

#### Presets intégrés (5)

| Preset | Fond | Niveaux | Marge |
|---|---|---|---|
| **Seyes (grands carreaux)** | #FFFFF5 (crème) | 3 : Principales H (80px, 1.5px, violet #7B68C8, 90%) + Interlignes H (20px, 0.5px, violet clair #B8A9E8, 60%) + Verticales (80px, 0.5px, violet clair, 60%) | Oui (80px, rose #FF6B8A, 1.5px) |
| **Petits carreaux (5mm)** | #FFFFFF | 1 : Quadrillage H+V (20px, 0.5px, bleu #A0C4E8, 70%) | Non |
| **Millimétré** | #FFFFFF | 3 : cm H+V (40px, 1px, tan #D4885A, 80%) + 5mm H+V (20px, 0.5px, 50%) + mm H+V (4px, 0.3px, 30%) | Non |
| **Lignes simples** | #FFFFFF | 1 : Horizontales seules (32px, 0.8px, gris #AABBCC, 70%) | Oui (80px) |
| **Vierge** | #FFFFFF | Aucun | Non |

#### Presets personnalisés

- **Sauvegarder** la configuration actuelle (nom + bg + layers + margin)
- **Charger** un preset sauvegardé
- **Supprimer** un preset sauvegardé
- Affichés dans une section verte distincte
- **Non persistants** : perdus au rechargement de la page

### 7. Export multi-formats

| Format | Méthode | Détails |
|---|---|---|
| **SVG** | Génération XML native | `<line>` pour chaque trait, `<rect>` pour le fond. Vectoriel, qualité infinie au zoom. Idéal ENI. |
| **PNG** | `Canvas.toBlob("image/png", 0.95)` | Résolution = dimensions page × qualité. Sans perte. |
| **JPG** | `Canvas.toBlob("image/jpeg", 0.95)` | Résolution = dimensions page × qualité. Compressé. |
| **PDF** | Fenêtre popup + `window.print()` | Embarque le SVG en base64 comme `<img>`. Page CSS `@page` aux dimensions exactes, marges zéro. Délai 500ms avant impression. |

Nom des fichiers exportés : `lignage.svg`, `lignage.png`, `lignage.jpg`.

### 8. Prévisualisation en temps réel

- **Canvas HTML** central, redessiné à chaque modification (layers, scale, format, bg, margin)
- **Mise à l'échelle responsive** via `ResizeObserver` : le canvas s'ajuste automatiquement à la zone disponible (padding 48px)
- Calcul : `previewScale = Math.min((containerW - 48) / pageW, (containerH - 48) / pageH)`
- Ombre portée et bordure pour distinguer la page du fond de l'interface

---

## Interface utilisateur

### Layout global

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO VS]  │  Générateur de Lignage              lien site │  Header
│             │  Créez vos fonds personnalisés pour ENI        │
├─────────────┬────────────────────────────────────────────────┤
│  [Niveaux]  │                                                │
│  [Page    ] │                                                │
│  [Presets ] │        Zone de prévisualisation                 │
│             │             (Canvas)                            │
│  Contenu    │        Auto-scale responsive                   │
│  de l'onglet│                                                │
│  actif      │                                                │
│  (scroll)   │                                                │
│             │                                                │
│  ─────────  │                                                │
│  [Exporter] │                                                │
│  SVG PNG    │                                                │
│  JPG PDF    │                                                │
├─────────────┴────────────────────────────────────────────────┤
│  Un outil [LOGO VS] • www.videosynergie.com                  │  Footer
└──────────────────────────────────────────────────────────────┘
```

- **Sidebar** : 350px fixe, fond blanc, ombre droite
- **3 onglets** : Niveaux, Page, Presets (navigation par boutons en haut)
- **Zone export** : en bas de la sidebar, section dépliable avec les 4 boutons de format
- **Preview** : flex 1, centrage vertical et horizontal

### Charte graphique

#### Logo Vidéo Synergie

- URL : `https://i.imgur.com/ciCS5KO.png`
- Header : hauteur 44px
- Footer : hauteur 24px

#### Palette de couleurs (objet `C`)

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#f0f4f8` | Fond général de l'app |
| `white` | `#ffffff` | Surfaces, cartes |
| `accent` | `#00b4d8` | Couleur d'accentuation principale (cyan) |
| `accentDark` | `#0096c7` | Accent hover/actif |
| `accentSoft` | `#00b4d812` | Fond accent léger (8% opacité) |
| `accentBorder` | `#00b4d835` | Bordure accent (21% opacité) |
| `surface` | `#ffffff` | Panneaux |
| `surfaceAlt` | `#f7f9fb` | Fond alternatif (expanded layers, footer sidebar) |
| `border` | `#dde4ec` | Bordures principales |
| `borderLight` | `#e8edf3` | Bordures secondaires (séparateurs internes) |
| `text` | `#1e293b` | Texte principal |
| `textMuted` | `#64748b` | Labels, texte secondaire |
| `textDim` | `#94a3b8` | Texte tertiaire (footer, infos) |
| `danger` | `#ef4444` | Suppression, erreur |
| `dangerBg` | `#fef2f2` | Fond bouton supprimer |
| `success` | `#10b981` | Sauvegarde, presets custom |
| `successBg` | `#ecfdf5` | Fond boutons presets custom |
| `shadow` | `rgba(0,0,0,0.06)` | Ombre légère |
| `shadowMd` | `rgba(0,0,0,0.1)` | Ombre moyenne (preview) |

#### Style

- **Thème clair uniquement** (pas de dark mode)
- Bordures arrondies : 6-10px
- Typographie : `'Inter', 'Segoe UI', system-ui, sans-serif` (polices système)
- Accent color sur checkboxes et sliders (`accentColor: #00b4d8`)
- Effets hover sur boutons d'export et presets (inline `onMouseEnter`/`onMouseLeave`)
- Boutons primaires : fond accent uni, ombre colorée, coins 8px

---

## Fonctions clés du code

### Rendu

| Fonction | Rôle |
|---|---|
| `renderToCanvas(canvas, resScale, gScale)` | Dessine le lignage sur un canvas. `resScale` multiplie la résolution, `gScale` multiplie les espacements. |
| `drawCanvas()` | Appelle `renderToCanvas` avec resScale=1 pour la prévisualisation. |
| `generateSVG()` | Construit le SVG XML complet (fond + lignes + marge). |

### Export

| Fonction | Rôle |
|---|---|
| `exportFile("svg")` | Crée un Blob SVG et déclenche le téléchargement. |
| `exportFile("png"/"jpg")` | Crée un canvas temporaire à la résolution quality×, convertit en Blob, télécharge. |
| `exportFile("pdf")` | Ouvre une popup avec le SVG en base64, déclenche `window.print()` après 500ms. |

### State

| Fonction | Rôle |
|---|---|
| `updateLayer(id, key, val)` | Mise à jour immutable d'une propriété d'un niveau. |
| `addLayer()` | Ajoute un niveau avec valeurs par défaut, l'ouvre en accordéon. |
| `removeLayer(id)` | Supprime un niveau, ferme l'accordéon si c'était le niveau ouvert. |
| `moveLayer(id, dir)` | Échange un niveau avec son voisin (-1 = monter, 1 = descendre). |
| `applyPreset(key)` | Charge un preset (intégré ou sauvegardé), régénère les IDs des niveaux. |
| `savePreset()` | Sauvegarde la config actuelle dans `savedPresets`. |
| `getPageSize()` | Retourne {w, h} en tenant compte du format et de l'orientation. |

### Utilitaires

| Fonction | Rôle |
|---|---|
| `uid()` | Génère un ID aléatoire (7 caractères alphanumériques). |
| `defaultLayer()` | Retourne un objet niveau avec valeurs par défaut. |
| `handleBgImage(e)` | Lit un fichier image uploadé et le stocke en Data URL. |

---

## Démarrage

```bash
# Installation
npm install

# Développement (hot reload)
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

---

## Limitations connues

| Limitation | Détail |
|---|---|
| **Image de fond non rendue** | Le state `bgImage` est alimenté par l'upload mais jamais utilisé dans `renderToCanvas()` ni `generateSVG()`. L'UI est présente mais la fonctionnalité est inopérante. |
| **Pas de persistance** | Les presets personnalisés sont perdus au rechargement (pas de `localStorage`). |
| **Architecture monolithique** | Tout dans un seul composant de 605 lignes. Pas de décomposition. |
| **TypeScript relâché** | `@ts-nocheck` en tête de fichier, `strict: false` dans `tsconfig.app.json`. |
| **Pas de debounce** | Le `ResizeObserver` et les sliders déclenchent des redessinages canvas à chaque frame. |

---

## Améliorations futures possibles

- Rendre fonctionnelle l'image de fond (canvas `drawImage` + SVG `<image>`)
- Persistance des presets via `localStorage`
- Offset X/Y par niveau (décalage du point de départ des lignes)
- Dupliquer un niveau existant
- Import/export de presets (JSON)
- Drag & drop pour réordonner les niveaux
- Zoom/pan dans la prévisualisation
- Mode plein écran de la prévisualisation
- Décomposition en composants (LayerEditor, PageSettings, PresetManager, etc.)
- Internationalisation (FR/EN)
- PWA pour usage hors-ligne

---

## Cas d'usage typiques

1. **Seyes personnalisé** : fond Seyes avec couleurs ou espacement adaptés aux CP
2. **Fond millimétré** : quadrillage fin avec 3 niveaux de précision pour les mathématiques
3. **Tableau simple** : quelques lignes horizontales et verticales espacées
4. **Fond pour ENI** : export en 16:9 SVG pour import dans ActivInspire ou myViewBoard
5. **Impression** : export PDF en A4 portrait pour photocopie

---

## Branding

- **Entreprise** : Vidéo Synergie
- **Site** : [www.videosynergie.com](https://www.videosynergie.com)
- **Logo** : `https://i.imgur.com/ciCS5KO.png`
- **Baseline** : Vente - Location - Intégration

---

*Dernière mise à jour de la documentation : 1er mars 2026*
