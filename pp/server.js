const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');

// Import des services
const nlpService = require('./services/nlp');
const metricsService = require('./services/metrics');
const exportService = require('./services/export');

// Configuration Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité et performance
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// Middleware de base
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://analyse-semantique-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.csv, .xlsx, .xls).'));
    }
  }
});

// Middleware de logging en production
if (process.env.NODE_ENV === 'production') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API Plateforme d\'Analyse Sémantique',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /upload - Upload CSV/Excel',
      'POST /analyze - Analyse complète',
      'GET /export/pdf/:sessionId - Export PDF',
      'GET /export/excel/:sessionId - Export Excel'
    ]
  });
});

// Upload et parsing du fichier
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier uploadé',
        code: 'NO_FILE'
      });
    }

    console.log(`📁 Fichier reçu: ${req.file.originalname} (${Math.round(req.file.size / 1024)}KB)`);
    
    // Parse le fichier selon son extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    let data;

    try {
      if (ext === '.csv') {
        data = await nlpService.parseCSV(req.file.path);
      } else if (ext === '.xlsx' || ext === '.xls') {
        data = await nlpService.parseExcel(req.file.path);
      } else {
        throw new Error('Format de fichier non supporté');
      }
    } catch (parseError) {
      console.error('Erreur parsing:', parseError);
      return res.status(400).json({ 
        error: `Erreur lors du parsing du fichier: ${parseError.message}`,
        code: 'PARSE_ERROR'
      });
    }

    // Nettoie le fichier temporaire
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Avertissement nettoyage fichier:', cleanupError.message);
    }

    // Validation des données
    if (!data || data.length === 0) {
      return res.status(400).json({ 
        error: 'Fichier vide ou format invalide',
        code: 'EMPTY_FILE'
      });
    }

    console.log(`✅ Parsing réussi: ${data.length} lignes trouvées`);

    res.json({
      success: true,
      rowCount: data.length,
      preview: data.slice(0, 5), // Aperçu des 5 premières lignes
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: ext
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    
    // Nettoyage du fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Erreur nettoyage:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      error: error.message || 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Analyse NLP complète
app.post('/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { data, textColumn, options = {} } = req.body;

    // Validation des paramètres
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        error: 'Données invalides: tableau requis',
        code: 'INVALID_DATA'
      });
    }

    if (!textColumn) {
      return res.status(400).json({ 
        error: 'Colonne de texte requise',
        code: 'MISSING_TEXT_COLUMN'
      });
    }

    if (data.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à analyser',
        code: 'EMPTY_DATA'
      });
    }

    console.log(`🧠 Début analyse de ${data.length} avis sur colonne "${textColumn}"`);

    // 1. Prétraitement des textes
    console.log('📝 Prétraitement des textes...');
    const processedTexts = data.map((row, index) => {
      const originalText = row[textColumn];
      if (!originalText || typeof originalText !== 'string') {
        return null;
      }
      
      return {
        id: index,
        original: originalText,
        processed: nlpService.preprocessText(originalText),
        metadata: row
      };
    }).filter(Boolean); // Supprime les éléments null

    if (processedTexts.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun texte valide trouvé dans la colonne spécifiée',
        code: 'NO_VALID_TEXT'
      });
    }

    console.log(`✅ ${processedTexts.length}/${data.length} textes valides prétraités`);

    // 2. Analyse des sentiments
    console.log('😊 Analyse des sentiments...');
    const sentimentResults = await nlpService.analyzeSentiments(processedTexts);

    // 3. Extraction des thématiques
    console.log('🎯 Extraction des thématiques...');
    const thematicResults = await nlpService.extractThemes(processedTexts);

    // 4. Calcul des métriques détaillées
    console.log('📊 Calcul des métriques...');
    const metrics = metricsService.calculateMetrics(sentimentResults, thematicResults);

    // 5. Génération des insights
    console.log('💡 Génération des insights...');
    const insights = metricsService.generateInsights(sentimentResults, thematicResults, metrics);

    // Compilation des résultats
    const results = {
      summary: {
        totalReviews: data.length,
        processedReviews: sentimentResults.length,
        analysisDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        textColumn: textColumn
      },
      sentiments: sentimentResults,
      themes: thematicResults,
      metrics: metrics,
      insights: insights
    };

    // Stockage temporaire des résultats pour export (1 heure)
    const sessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
    global.analysisResults = global.analysisResults || {};
    global.analysisResults[sessionId] = {
      ...results,
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 heure
    };

    const duration = Date.now() - startTime;
    console.log(`🎉 Analyse terminée en ${Math.round(duration / 1000)}s`);

    res.json({
      success: true,
      sessionId: sessionId,
      results: results,
      performance: {
        duration: duration,
        throughput: Math.round((sentimentResults.length / duration) * 1000) // éléments/seconde
      }
    });

  } catch (error) {
    console.error('❌ Erreur analyse:', error);
    
    const duration = Date.now() - startTime;
    res.status(500).json({ 
      error: error.message || 'Erreur lors de l\'analyse',
      code: 'ANALYSIS_ERROR',
      duration: duration
    });
  }
});

// Export PDF
app.get('/export/pdf/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`📄 Demande export PDF pour session: ${sessionId}`);

    if (!global.analysisResults || !global.analysisResults[sessionId]) {
      return res.status(404).json({ 
        error: 'Session non trouvée ou expirée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    const results = global.analysisResults[sessionId];
    
    // Vérification de l'expiration
    if (results.expiresAt && Date.now() > results.expiresAt) {
      delete global.analysisResults[sessionId];
      return res.status(410).json({ 
        error: 'Session expirée',
        code: 'SESSION_EXPIRED'
      });
    }

    console.log('📝 Génération du PDF...');
    const pdfBuffer = await exportService.generatePDF(results);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=analyse-sentiments.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ PDF généré (${Math.round(pdfBuffer.length / 1024)}KB)`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur export PDF:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la génération du PDF',
      code: 'PDF_ERROR'
    });
  }
});

// Export Excel
app.get('/export/excel/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`📊 Demande export Excel pour session: ${sessionId}`);

    if (!global.analysisResults || !global.analysisResults[sessionId]) {
      return res.status(404).json({ 
        error: 'Session non trouvée ou expirée',
        code: 'SESSION_NOT_FOUND'
      });
    }

    const results = global.analysisResults[sessionId];
    
    // Vérification de l'expiration
    if (results.expiresAt && Date.now() > results.expiresAt) {
      delete global.analysisResults[sessionId];
      return res.status(410).json({ 
        error: 'Session expirée',
        code: 'SESSION_EXPIRED'
      });
    }

    console.log('📈 Génération du fichier Excel...');
    const excelBuffer = await exportService.generateExcel(results);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=analyse-sentiments.xlsx');
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log(`✅ Excel généré (${Math.round(excelBuffer.length / 1024)}KB)`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la génération du fichier Excel',
      code: 'EXCEL_ERROR'
    });
  }
});

// Nettoyage périodique des sessions expirées (toutes les 30 minutes)
setInterval(() => {
  if (global.analysisResults) {
    const now = Date.now();
    let cleanedCount = 0;
    
    Object.keys(global.analysisResults).forEach(sessionId => {
      const session = global.analysisResults[sessionId];
      if (session.expiresAt && now > session.expiresAt) {
        delete global.analysisResults[sessionId];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} sessions expirées nettoyées`);
    }
  }
}, 30 * 60 * 1000); // 30 minutes

// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  
  // Gestion spécifique des erreurs Multer
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'Fichier trop volumineux (max 100MB)',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({ 
      error: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
  
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR'
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur (Ctrl+C)...');
  process.exit(0);
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log('🚀 =====================================');
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔗 API disponible sur http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 =====================================');
});

// Gestion des erreurs du serveur
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} déjà utilisé`);
    process.exit(1);
  } else {
    console.error('❌ Erreur serveur:', error);
    throw error;
  }
});

module.exports = app;