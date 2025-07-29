const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import des services
const nlpService = require('./services/nlp');
const metricsService = require('./services/metrics');
const exportService = require('./services/export');

// Configuration Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de base
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://semantic-analysis-frontend.onrender.com',
    'https://abdelbaki-dek.github.io'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté'));
    }
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API Plateforme d\'Analyse Sémantique',
    version: '1.0.0',
    status: 'Running'
  });
});

// Upload et parsing du fichier
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    console.log(`📁 Fichier reçu: ${req.file.originalname}`);
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    let data;

    if (ext === '.csv') {
      data = await nlpService.parseCSV(req.file.path);
    } else if (ext === '.xlsx' || ext === '.xls') {
      data = await nlpService.parseExcel(req.file.path);
    }

    // Nettoie le fichier temporaire
    fs.unlinkSync(req.file.path);

    console.log(`✅ Parsing réussi: ${data.length} lignes`);

    res.json({
      success: true,
      rowCount: data.length,
      preview: data.slice(0, 3),
      columns: data.length > 0 ? Object.keys(data[0]) : []
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Analyse NLP complète
app.post('/analyze', async (req, res) => {
  try {
    const { data, textColumn } = req.body;

    if (!data || !textColumn) {
      return res.status(400).json({ error: 'Données et colonne de texte requises' });
    }

    console.log(`🧠 Début analyse de ${data.length} avis`);

    // 1. Prétraitement des textes
    const processedTexts = data.map((row, index) => ({
      id: index,
      original: row[textColumn] || '',
      processed: nlpService.preprocessText(row[textColumn] || ''),
      metadata: row
    })).filter(item => item.original.length > 0);

    // 2. Analyse des sentiments
    const sentimentResults = await nlpService.analyzeSentiments(processedTexts);

    // 3. Extraction des thématiques
    const thematicResults = await nlpService.extractThemes(processedTexts);

    // 4. Calcul des métriques détaillées
    const metrics = metricsService.calculateMetrics(sentimentResults, thematicResults);

    // 5. Génération des insights
    const insights = metricsService.generateInsights(sentimentResults, thematicResults, metrics);

    const results = {
      summary: {
        totalReviews: data.length,
        processedReviews: sentimentResults.length,
        analysisDate: new Date().toISOString()
      },
      sentiments: sentimentResults,
      themes: thematicResults,
      metrics: metrics,
      insights: insights
    };

    // Stockage temporaire des résultats pour export
    const sessionId = Date.now().toString();
    global.analysisResults = global.analysisResults || {};
    global.analysisResults[sessionId] = results;

    console.log(`🎉 Analyse terminée`);

    res.json({
      success: true,
      sessionId: sessionId,
      results: results
    });

  } catch (error) {
    console.error('❌ Erreur analyse:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export PDF
app.get('/export/pdf/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!global.analysisResults || !global.analysisResults[sessionId]) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const results = global.analysisResults[sessionId];
    const pdfBuffer = await exportService.generatePDF(results);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=analyse-sentiments.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export Excel
app.get('/export/excel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!global.analysisResults || !global.analysisResults[sessionId]) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    const results = global.analysisResults[sessionId];
    const excelBuffer = await exportService.generateExcel(results);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=analyse-sentiments.xlsx');
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 =====================================');
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔗 API disponible`);
  console.log('🚀 =====================================');
});

module.exports = app;
