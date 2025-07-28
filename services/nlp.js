const fs = require('fs');
const Papa = require('papaparse');
const XLSX = require('xlsx');

// Dictionnaires de mots pour l'analyse de sentiment
const POSITIVE_WORDS = [
  // Français
  'excellent', 'parfait', 'génial', 'super', 'formidable', 'magnifique', 'fantastique',
  'merveilleux', 'extraordinaire', 'remarquable', 'exceptionnel', 'impressionnant',
  'bon', 'bien', 'top', 'cool', 'sympa', 'agréable', 'satisfait', 'content', 'heureux',
  'recommande', 'adore', 'aime', 'plait', 'réussi', 'qualité', 'rapide', 'efficace',
  
  // Anglais
  'excellent', 'perfect', 'amazing', 'awesome', 'fantastic', 'wonderful', 'great',
  'good', 'nice', 'love', 'like', 'recommend', 'satisfied', 'happy', 'pleased',
  'quality', 'fast', 'efficient', 'outstanding', 'remarkable', 'impressive'
];

const NEGATIVE_WORDS = [
  // Français
  'mauvais', 'horrible', 'terrible', 'nul', 'catastrophe', 'désastre', 'affreux',
  'décevant', 'déçu', 'frustrant', 'irritant', 'énervant', 'insupportable',
  'problème', 'souci', 'panne', 'bug', 'erreur', 'lent', 'cher', 'expensive',
  'déteste', 'hais', 'regrette', 'éviter', 'jamais', 'plus', 'arnaque',
  
  // Anglais
  'bad', 'terrible', 'horrible', 'awful', 'worst', 'hate', 'dislike', 'disappointing',
  'frustrated', 'annoying', 'problem', 'issue', 'slow', 'expensive', 'avoid',
  'never', 'regret', 'waste', 'useless', 'broken', 'failed'
];

// Mots d'intensification
const INTENSIFIERS = {
  // Positifs
  'très': 1.5, 'vraiment': 1.4, 'super': 1.6, 'ultra': 1.7, 'extrêmement': 1.8,
  'absolument': 1.5, 'totalement': 1.4, 'complètement': 1.3, 'parfaitement': 1.6,
  'really': 1.4, 'very': 1.5, 'extremely': 1.8, 'absolutely': 1.5, 'totally': 1.4,
  
  // Négatifs (négations)
  'pas': -1, 'non': -1, 'ne': -0.8, 'jamais': -1.2, 'aucun': -1.1, 'sans': -0.9,
  'not': -1, 'no': -1, 'never': -1.2, 'nothing': -1.1, 'without': -0.9
};

// Dictionnaire des emojis
const EMOJI_SCORES = {
  '😍': 2, '🥰': 2, '😘': 1.8, '💖': 1.8, '❤️': 1.8, '💕': 1.6, '🎉': 1.5, '🥳': 1.5,
  '😊': 1.2, '😃': 1.2, '😄': 1.2, '😁': 1.2, '🙂': 1, '👍': 1, '👌': 1, '✅': 0.8,
  '😐': 0, '😑': 0, '🤔': 0, '😕': -0.3,
  '😞': -1, '😔': -1, '😣': -1.2, '😤': -1.2, '👎': -1.2, '😪': -0.8,
  '😢': -1.8, '😭': -1.8, '😡': -2, '😠': -2, '🤬': -2, '💔': -1.8, '😱': -1.5
};

// Prétraitement du texte
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text.toLowerCase();
  
  // Nettoyer les caractères spéciaux mais garder les emojis
  processed = processed
    .replace(/[^\w\s\u00C0-\u017F\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return processed;
}

// Parser CSV
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        encoding: 'utf8',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Erreurs CSV:', results.errors.slice(0, 3));
          }
          console.log(`✅ CSV parsé: ${results.data.length} lignes`);
          resolve(results.data);
        },
        error: (error) => {
          console.error('Erreur parsing CSV:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Erreur lecture fichier CSV:', error);
      reject(error);
    }
  });
}

// Parser Excel
async function parseExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✅ Excel parsé: ${data.length} lignes`);
    return data;
  } catch (error) {
    console.error('Erreur lecture Excel:', error);
    throw new Error(`Erreur lecture Excel: ${error.message}`);
  }
}

// Analyse des sentiments
async function analyzeSentiments(processedTexts) {
  console.log(`🧠 Analyse de ${processedTexts.length} textes...`);
  const results = [];
  
  processedTexts.forEach((item, index) => {
    try {
      const originalText = item.original || '';
      const processedText = item.processed || '';
      
      if (!originalText || originalText.length < 3) {
        results.push({
          id: index,
          text: originalText,
          sentiment: 'neutre',
          confidence: 0.5,
          score: 0,
          metadata: item.metadata || {}
        });
        return;
      }
      
      // Analyse du sentiment
      const sentimentAnalysis = analyzeSingleText(originalText, processedText);
      
      results.push({
        id: index,
        text: originalText,
        processedText: processedText,
        sentiment: sentimentAnalysis.sentiment,
        confidence: sentimentAnalysis.confidence,
        score: sentimentAnalysis.score,
        details: sentimentAnalysis.details,
        metadata: item.metadata || {}
      });
      
    } catch (error) {
      console.error(`Erreur analyse item ${index}:`, error);
      results.push({
        id: index,
        text: item.original || '',
        sentiment: 'neutre',
        confidence: 0.5,
        score: 0,
        error: error.message,
        metadata: item.metadata || {}
      });
    }
  });
  
  console.log(`✅ Analyse terminée: ${results.length} textes analysés`);
  return results;
}

// Analyse d'un seul texte
function analyzeSingleText(originalText, processedText) {
  const text = (processedText || originalText).toLowerCase();
  const words = text.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let totalWords = 0;
  
  // Analyse des emojis
  Object.keys(EMOJI_SCORES).forEach(emoji => {
    const count = (originalText.match(new RegExp(emoji, 'g')) || []).length;
    if (count > 0) {
      const score = EMOJI_SCORES[emoji] * count;
      if (score > 0) positiveScore += score;
      else negativeScore += Math.abs(score);
    }
  });
  
  // Analyse des mots
  words.forEach((word, index) => {
    if (word.length < 3) return;
    
    let wordScore = 0;
    let isPositive = false;
    let isNegative = false;
    
    // Vérifier si c'est un mot positif
    if (POSITIVE_WORDS.includes(word)) {
      wordScore = 1;
      isPositive = true;
    }
    
    // Vérifier si c'est un mot négatif
    if (NEGATIVE_WORDS.includes(word)) {
      wordScore = 1;
      isNegative = true;
    }
    
    if (wordScore > 0) {
      totalWords++;
      
      // Chercher des intensificateurs dans un rayon de 2 mots
      let intensifier = 1;
      for (let i = Math.max(0, index - 2); i < Math.min(words.length, index + 3); i++) {
        if (i !== index && INTENSIFIERS[words[i]]) {
          intensifier = Math.abs(INTENSIFIERS[words[i]]);
          // Si c'est une négation, inverser le sentiment
          if (INTENSIFIERS[words[i]] < 0) {
            isPositive = !isPositive && isNegative;
            isNegative = !isNegative && !isPositive;
          }
          break;
        }
      }
      
      wordScore *= intensifier;
      
      if (isPositive) positiveScore += wordScore;
      if (isNegative) negativeScore += wordScore;
    }
  });
  
  // Calcul du score final
  const totalScore = positiveScore + negativeScore;
  let finalScore = 0;
  let confidence = 0.5;
  
  if (totalScore > 0) {
    finalScore = (positiveScore - negativeScore) / totalScore;
    confidence = Math.min(0.5 + (totalScore / 10), 0.95);
  }
  
  // Détermination du sentiment
  let sentiment = 'neutre';
  if (finalScore > 0.2) sentiment = 'positif';
  else if (finalScore < -0.2) sentiment = 'négatif';
  
  return {
    sentiment,
    score: Math.max(-1, Math.min(1, finalScore)),
    confidence: Math.round(confidence * 1000) / 1000,
    details: {
      positiveScore: Math.round(positiveScore * 100) / 100,
      negativeScore: Math.round(negativeScore * 100) / 100,
      totalWords,
      emojiCount: Object.keys(EMOJI_SCORES).filter(emoji => originalText.includes(emoji)).length
    }
  };
}

// Extraction des thématiques
async function extractThemes(processedTexts) {
  console.log(`🎯 Extraction des thèmes pour ${processedTexts.length} textes...`);
  
  try {
    // Comptage des mots fréquents
    const wordFreq = {};
    const minWordLength = 4;
    const stopWords = new Set(['avec', 'pour', 'dans', 'sont', 'cette', 'tout', 'bien', 'très', 'plus', 'même', 'leur', 'that', 'this', 'with', 'from', 'they', 'were', 'been', 'have', 'their']);
    
    processedTexts.forEach(item => {
      const words = (item.processed || '').split(/\s+/);
      words.forEach(word => {
        if (word.length >= minWordLength && !stopWords.has(word) && !/^\d+$/.test(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });
    
    // Mots les plus fréquents
    const topWords = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= 2) // Au moins 2 occurrences
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);
    
    if (topWords.length === 0) {
      return {
        themes: [{
          id: 0,
          name: 'Thème général',
          texts: processedTexts.map(item => item.original).slice(0, 3),
          size: processedTexts.length,
          keywords: [{ word: 'général', frequency: processedTexts.length }],
          examples: processedTexts.map(item => item.original).slice(0, 2)
        }],
        totalThemes: 1
      };
    }
    
    // Création des thèmes
    const themes = [];
    const usedTexts = new Set();
    
    topWords.forEach(([word, frequency], index) => {
      // Trouver les textes contenant ce mot
      const relatedTexts = processedTexts.filter(item => {
        const contains = (item.processed || '').includes(word);
        const notUsed = !usedTexts.has(item.id || index);
        return contains && notUsed;
      });
      
      if (relatedTexts.length >= 2) { // Au moins 2 textes pour former un thème
        // Marquer ces textes comme utilisés
        relatedTexts.forEach(item => usedTexts.add(item.id || item.original));
        
        // Trouver des mots-clés associés
        const themeKeywords = findRelatedKeywords(word, relatedTexts, wordFreq);
        
        themes.push({
          id: themes.length,
          name: `Thème: ${word.charAt(0).toUpperCase() + word.slice(1)}`,
          texts: relatedTexts.map(item => item.original),
          size: relatedTexts.length,
          keywords: themeKeywords,
          examples: relatedTexts.map(item => item.original).slice(0, 3)
        });
      }
    });
    
    // Limiter à 8 thèmes maximum
    const finalThemes = themes.slice(0, 8).sort((a, b) => b.size - a.size);
    
    console.log(`✅ ${finalThemes.length} thèmes extraits`);
    
    return {
      themes: finalThemes,
      totalThemes: finalThemes.length
    };
    
  } catch (error) {
    console.error('Erreur extraction thèmes:', error);
    return {
      themes: [{
        id: 0,
        name: 'Thème général',
        texts: processedTexts.map(item => item.original).slice(0, 5),
        size: processedTexts.length,
        keywords: [{ word: 'analyse', frequency: 1 }],
        examples: processedTexts.map(item => item.original).slice(0, 3)
      }],
      totalThemes: 1
    };
  }
}

// Trouver des mots-clés associés à un thème
function findRelatedKeywords(mainWord, relatedTexts, wordFreq) {
  const keywords = [{ word: mainWord, frequency: wordFreq[mainWord] || 0 }];
  
  // Compter les mots dans les textes de ce thème
  const themeWordFreq = {};
  relatedTexts.forEach(item => {
    const words = (item.processed || '').split(/\s+/);
    words.forEach(word => {
      if (word.length >= 4 && word !== mainWord) {
        themeWordFreq[word] = (themeWordFreq[word] || 0) + 1;
      }
    });
  });
  
  // Ajouter les 3 mots les plus fréquents de ce thème
  const topThemeWords = Object.entries(themeWordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  topThemeWords.forEach(([word, freq]) => {
    keywords.push({ word, frequency: freq });
  });
  
  return keywords.slice(0, 5); // Maximum 5 mots-clés par thème
}

module.exports = {
  preprocessText,
  parseCSV,
  parseExcel,
  analyzeSentiments,
  extractThemes
};
