const fs = require('fs');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const { pipeline } = require('@xenova/transformers');

// Cache des modèles
let sentimentModel = null;
let embeddingModel = null;

// Mots vides français et anglais
const STOP_WORDS = new Set([
  'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour',
  'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
  'par', 'grand', 'comme', 'autre', 'voir', 'très', 'bien', 'aussi', 'faire',
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must'
]);

// Initialisation des modèles
async function initializeModels() {
  try {
    if (!sentimentModel) {
      console.log('Chargement du modèle de sentiment...');
      sentimentModel = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    }
    
    if (!embeddingModel) {
      console.log('Chargement du modèle d\'embeddings...');
      embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des modèles:', error);
    throw error;
  }
}

// Prétraitement du texte
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text.toLowerCase();
  
  // Conservation des emojis avec leur sentiment
  const emojiSentiments = {
    '😊': 'positif', '😃': 'positif', '😄': 'positif', '😁': 'positif', '🙂': 'positif',
    '👍': 'positif', '❤️': 'positif', '💖': 'positif', '🥰': 'positif', '😍': 'positif',
    '😢': 'négatif', '😭': 'négatif', '😡': 'négatif', '😠': 'négatif', '👎': 'négatif',
    '💔': 'négatif', '😞': 'négatif', '😔': 'négatif', '😤': 'négatif', '🤬': 'négatif',
    '😐': 'neutre', '😑': 'neutre', '🤔': 'neutre', '😕': 'neutre'
  };
  
  // Extraction des emojis et leur remplacement par leur sentiment
  Object.entries(emojiSentiments).forEach(([emoji, sentiment]) => {
    if (processed.includes(emoji)) {
      processed = processed.replace(new RegExp(emoji, 'g'), ` sentiment_${sentiment} `);
    }
  });
  
  // Nettoyage de base
  processed = processed
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ') // Garde les accents
    .replace(/\s+/g, ' ')
    .trim();
  
  // Suppression des mots vides
  const words = processed.split(' ')
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  return words.join(' ');
}

// Parser CSV
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      encoding: 'utf8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Erreurs CSV:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => reject(error)
    });
  });
}

// Parser Excel
async function parseExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Erreur lecture Excel: ${error.message}`);
  }
}

// Analyse des sentiments
async function analyzeSentiments(processedTexts) {
  await initializeModels();
  
  const results = [];
  const batchSize = 10; // Traitement par batch pour éviter la surcharge
  
  for (let i = 0; i < processedTexts.length; i += batchSize) {
    const batch = processedTexts.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        try {
          const text = item.processed || item.original;
          if (!text || text.length < 3) {
            return {
              id: i + index,
              text: item.original,
              sentiment: 'neutre',
              confidence: 0.5,
              score: 0,
              metadata: item.metadata
            };
          }
          
          // Analyse avec le modèle Hugging Face
          const result = await sentimentModel(text);
          
          // Conversion des labels anglais vers français
          let sentiment = 'neutre';
          let score = 0;
          
          if (result && result.length > 0) {
            const topResult = result[0];
            if (topResult.label === 'POSITIVE') {
              sentiment = 'positif';
              score = topResult.score;
            } else if (topResult.label === 'NEGATIVE') {
              sentiment = 'négatif';
              score = -topResult.score;
            }
          }
          
          // Ajustement basé sur les emojis détectés
          if (text.includes('sentiment_positif')) {
            score = Math.min(score + 0.2, 1);
            sentiment = score > 0.1 ? 'positif' : sentiment;
          } else if (text.includes('sentiment_négatif')) {
            score = Math.max(score - 0.2, -1);
            sentiment = score < -0.1 ? 'négatif' : sentiment;
          }
          
          return {
            id: i + index,
            text: item.original,
            processedText: item.processed,
            sentiment: sentiment,
            confidence: result[0]?.score || 0.5,
            score: score,
            metadata: item.metadata
          };
          
        } catch (error) {
          console.error(`Erreur sentiment pour l'item ${i + index}:`, error);
          return {
            id: i + index,
            text: item.original,
            sentiment: 'neutre',
            confidence: 0.5,
            score: 0,
            error: error.message,
            metadata: item.metadata
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Log de progression
    if (i % 50 === 0) {
      console.log(`Sentiment analysé: ${Math.min(i + batchSize, processedTexts.length)}/${processedTexts.length}`);
    }
  }
  
  return results;
}

// Extraction des thématiques
async function extractThemes(processedTexts) {
  await initializeModels();
  
  try {
    // 1. Génération des embeddings
    console.log('Génération des embeddings...');
    const texts = processedTexts.map(item => item.processed).filter(text => text && text.length > 5);
    
    if (texts.length === 0) {
      return { themes: [], clusters: [] };
    }
    
    // Traitement par batch des embeddings
    const embeddings = [];
    const batchSize = 5;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(async (text) => {
          try {
            const result = await embeddingModel(text);
            return result.data || result;
          } catch (error) {
            console.error('Erreur embedding:', error);
            return null;
          }
        })
      );
      embeddings.push(...batchEmbeddings.filter(emb => emb !== null));
    }
    
    // 2. Clustering simple par similarité
    const themes = await clusterTexts(texts, embeddings);
    
    // 3. Extraction des mots-clés par thème
    const themesWithKeywords = themes.map(theme => ({
      ...theme,
      keywords: extractKeywords(theme.texts),
      examples: theme.texts.slice(0, 3) // 3 exemples par thème
    }));
    
    return {
      themes: themesWithKeywords,
      totalThemes: themesWithKeywords.length
    };
    
  } catch (error) {
    console.error('Erreur extraction thèmes:', error);
    return {
      themes: [{
        id: 0,
        name: 'Thème général',
        texts: processedTexts.map(item => item.original).slice(0, 10),
        size: processedTexts.length,
        keywords: ['général', 'avis', 'commentaire'],
        examples: processedTexts.map(item => item.original).slice(0, 3)
      }],
      totalThemes: 1
    };
  }
}

// Clustering simple des textes
async function clusterTexts(texts, embeddings) {
  if (!embeddings || embeddings.length === 0) return [];
  
  // Clustering simple par similarité cosinus
  const themes = [];
  const used = new Set();
  const threshold = 0.7; // Seuil de similarité
  
  for (let i = 0; i < embeddings.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = {
      id: themes.length,
      texts: [texts[i]],
      centroid: embeddings[i],
      indices: [i]
    };
    
    used.add(i);
    
    // Recherche des textes similaires
    for (let j = i + 1; j < embeddings.length; j++) {
      if (used.has(j)) continue;
      
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity > threshold) {
        cluster.texts.push(texts[j]);
        cluster.indices.push(j);
        used.add(j);
      }
    }
    
    // Nommage du thème basé sur les mots les plus fréquents
    cluster.name = generateThemeName(cluster.texts);
    cluster.size = cluster.texts.length;
    
    themes.push(cluster);
  }
  
  // Tri par taille décroissante
  return themes.sort((a, b) => b.size - a.size);
}

// Similarité cosinus
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Génération du nom de thème
function generateThemeName(texts) {
  const wordFreq = {};
  
  texts.forEach(text => {
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });
  
  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);
  
  return sortedWords.length > 0 ? 
    sortedWords.join(' + ').charAt(0).toUpperCase() + sortedWords.join(' + ').slice(1) :
    `Thème ${Math.random().toString(36).substring(7)}`;
}

// Extraction des mots-clés
function extractKeywords(texts, maxKeywords = 10) {
  const wordFreq = {};
  const totalWords = texts.length;
  
  texts.forEach(text => {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    uniqueWords.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
  });
  
  return Object.entries(wordFreq)
    .map(([word, freq]) => ({
      word,
      frequency: freq,
      score: freq / totalWords
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxKeywords);
}

module.exports = {
  preprocessText,
  parseCSV,
  parseExcel,
  analyzeSentiments,
  extractThemes,
  initializeModels
};
