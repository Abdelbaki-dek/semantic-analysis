# 🚀 Plateforme d'Analyse Sémantique Avancée

Une plateforme complète d'analyse de sentiments et de thématiques pour avis clients, propulsée par l'IA et hébergée gratuitement sur Render.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

## 📋 Table des Matières

- [🎯 Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🚀 Installation](#-installation)
- [💻 Utilisation](#-utilisation)
- [📊 Analyses Disponibles](#-analyses-disponibles)
- [🔧 Configuration](#-configuration)
- [🌐 Déploiement](#-déploiement)
- [📈 Performance](#-performance)
- [🤝 Contribution](#-contribution)

## 🎯 Fonctionnalités

### ✨ Analyse Complète
- **Upload de fichiers** : CSV, Excel (.xlsx, .xls) jusqu'à 100MB
- **Analyse de sentiments** : Modèle DistilBERT avec scores précis (-1 à +1)
- **Extraction thématique** : Clustering automatique avec embeddings
- **Prise en compte des emojis** : Analyse sémantique des emojis et emoticônes
- **Métriques détaillées** : 15+ métriques de qualité et distribution

### 📊 Visualisations Interactives
- **Graphiques dynamiques** : Chart.js avec interactions
- **Distribution des sentiments** : Camembert et barres
- **Analyse thématique** : Top thèmes avec mots-clés
- **Métriques en temps réel** : Dashboard complet

### 📁 Exports Professionnels
- **Rapport PDF** : Document exécutif avec graphiques
- **Fichier Excel** : 5 feuilles avec données détaillées
- **Exemples d'avis** : Justification des résultats
- **Méthodologie incluse** : Transparence complète

### 🎨 Interface Moderne
- **Design responsive** : Mobile-first avec Tailwind CSS
- **UX optimisée** : Drag & drop, progression temps réel
- **Accessibilité** : Standards WCAG respectés
- **Performance** : Chargement < 3s, interactions fluides

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Services IA   │
│   (Next.js)     │◄──►│  (Express.js)   │◄──►│  (Transformers) │
│   Port 3000     │    │   Port 3001     │    │   Hugging Face  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Render CDN    │    │   File Storage  │
│   (Statique)    │    │   (Temporaire)  │
└─────────────────┘    └─────────────────┘
```

### 🔧 Stack Technique

#### Backend
- **Node.js 18+** : Runtime JavaScript moderne
- **Express.js** : Framework web minimaliste
- **Multer** : Gestion upload de fichiers
- **Transformers.js** : Modèles IA Hugging Face
- **PDFKit** : Génération PDF
- **ExcelJS** : Export Excel avancé

#### Frontend  
- **Next.js 14** : Framework React full-stack
- **Tailwind CSS** : Framework CSS utilitaire
- **Chart.js** : Visualisations interactives
- **React Dropzone** : Interface upload moderne

#### IA et NLP
- **DistilBERT** : Analyse de sentiments (Hugging Face)
- **all-MiniLM-L6-v2** : Embeddings sémantiques
- **Clustering cosinus** : Regroupement thématique
- **NLP.js** : Préprocessing avancé

## 🚀 Installation

### Prérequis
- Node.js 18+ ([Télécharger](https://nodejs.org/))
- npm 8+ (inclus avec Node.js)
- Git ([Télécharger](https://git-scm.com/))

### Installation Locale

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/plateforme-analyse-semantique.git
cd plateforme-analyse-semantique

# 2. Installer les dépendances
npm run install-all

# 3. Démarrer le développement
npm run dev
```

### URLs Locales
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health

## 💻 Utilisation

### 1. 📁 Upload de Fichier

```javascript
// Format CSV requis
"avis","date","note"
"Excellent service, très satisfait !","2024-01-15",5
"Produit décevant, qualité insuffisante","2024-01-16",2
"Correct sans plus, ça va","2024-01-17",3
```

**Colonnes supportées** :
- Texte principal (avis, commentaires, reviews)
- Métadonnées optionnelles (date, note, utilisateur)

### 2. 🎯 Configuration de l'Analyse

```javascript
// Options d'analyse disponibles
{
  textColumn: "avis",           // Colonne à analyser
  includeEmojis: true,          // Prise en compte des emojis
  detailedMetrics: true,        // Métriques avancées
  themeExtraction: true,        // Extraction thématique
  language: "auto"              // Détection automatique
}
```

### 3. 📊 Interprétation des Résultats

#### Scores de Sentiment
- **+0.7 à +1.0** : Très positif 😍
- **+0.3 à +0.7** : Positif 😊
- **+0.1 à +0.3** : Légèrement positif 🙂
- **-0.1 à +0.1** : Neutre 😐
- **-0.3 à -0.1** : Légèrement négatif 😕
- **-0.7 à -0.3** : Négatif 😞
- **-1.0 à -0.7** : Très négatif 😢

#### Métriques Clés
- **Score Global** : Moyenne pondérée des sentiments
- **Confiance** : Fiabilité de l'analyse (0-1)
- **Polarisation** : Écart-type des opinions
- **Diversité Thématique** : Richesse des sujets abordés

## 📊 Analyses Disponibles

### 🎭 Analyse de Sentiments
```javascript
// Exemple de résultat
{
  "sentiment": "positif",
  "score": 0.85,
  "confidence": 0.92,
  "text": "Service excellent, je recommande !",
  "features": {
    "emojis": ["😊"],
    "intensifiers": ["excellent"],
    "negations": []
  }
}
```

### 🎯 Extraction Thématique
```javascript
// Thèmes détectés
{
  "themes": [
    {
      "name": "Service Client",
      "size": 45,
      "percentage":}]
}

plateforme-analyse-semantique/
├── server.js                 # ✅ Backend Express avec tous les endpoints
├── package.json              # ✅ Dépendances backend
├── render.yaml               # ✅ Configuration déploiement automatique
├── services/
│   ├── nlp.js               # ✅ Service IA (sentiment + thèmes)
│   ├── metrics.js           # ✅ Calcul métriques avancées
│   └── export.js            # ✅ Génération PDF/Excel
├── utils/
│   └── preprocessing.js     # ✅ Préprocessing avancé avec emojis
├── frontend/
│   ├── package.json         # ✅ Dépendances frontend
│   ├── next.config.js       # ✅ Configuration Next.js
│   ├── tailwind.config.js   # ✅ Configuration Tailwind
│   ├── postcss.config.js    # ✅ Configuration PostCSS
│   ├── pages/
│   │   ├── _app.js          # ✅ Configuration Next.js
│   │   └── index.js         # ✅ Page principale avec upload
│   ├── components/
│   │   ├── Charts.js        # ✅ Graphiques interactifs Chart.js
│   │   ├── Insights.js      # ✅ Insights avec exemples
│   │   └── DownloadButtons.js # ✅ Export PDF/Excel
│   └── styles/
│       └── globals.css      # ✅ Styles Tailwind personnalisés
├── DEPLOYMENT.md            # ✅ Guide déploiement détaillé
└── README.md                # ✅ Documentation complète