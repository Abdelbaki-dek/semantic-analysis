// Utilitaires pour le préprocessing avancé des textes

// Expressions régulières pour différents types de contenu
const REGEX_PATTERNS = {
  // Emojis et emoticônes
  emojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  emoticons: /[:;=]-?[()DPO]|[()DPO]-?[:;=]|\^_\^|>_<|<_<|>.<|\^\^|=\)|:\*|<3/g,
  
  // URLs et mentions
  urls: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  mentions: /@[a-zA-Z0-9_]+/g,
  hashtags: /#[a-zA-Z0-9_]+/g,
  
  // Numéros et références
  phone: /\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/g,
  numbers: /\b\d+([.,]\d+)?\b/g,
  
  // Ponctuation répétée
  repeatedPunctuation: /[.!?]{2,}/g,
  repeatedSpaces: /\s{2,}/g,
  
  // Caractères spéciaux
  specialChars: /[^\w\s\u00C0-\u017F]/g,
};

// Dictionnaire des emojis avec leur sentiment
const EMOJI_SENTIMENTS = {
  // Très positifs
  '😍': { sentiment: 'très_positif', score: 0.9 },
  '🥰': { sentiment: 'très_positif', score: 0.9 },
  '😘': { sentiment: 'très_positif', score: 0.8 },
  '💖': { sentiment: 'très_positif', score: 0.8 },
  '❤️': { sentiment: 'très_positif', score: 0.8 },
  '💕': { sentiment: 'très_positif', score: 0.8 },
  '🎉': { sentiment: 'très_positif', score: 0.7 },
  '🥳': { sentiment: 'très_positif', score: 0.7 },
  
  // Positifs
  '😊': { sentiment: 'positif', score: 0.6 },
  '😃': { sentiment: 'positif', score: 0.6 },
  '😄': { sentiment: 'positif', score: 0.6 },
  '😁': { sentiment: 'positif', score: 0.6 },
  '🙂': { sentiment: 'positif', score: 0.5 },
  '👍': { sentiment: 'positif', score: 0.5 },
  '👌': { sentiment: 'positif', score: 0.5 },
  '✅': { sentiment: 'positif', score: 0.4 },
  
  // Neutres
  '😐': { sentiment: 'neutre', score: 0 },
  '😑': { sentiment: 'neutre', score: 0 },
  '🤔': { sentiment: 'neutre', score: 0 },
  '😕': { sentiment: 'neutre', score: -0.1 },
  
  // Négatifs
  '😞': { sentiment: 'négatif', score: -0.5 },
  '😔': { sentiment: 'négatif', score: -0.5 },
  '😣': { sentiment: 'négatif', score: -0.6 },
  '😤': { sentiment: 'négatif', score: -0.6 },
  '👎': { sentiment: 'négatif', score: -0.5 },
  '😪': { sentiment: 'négatif', score: -0.4 },
  
  // Très négatifs
  '😢': { sentiment: 'très_négatif', score: -0.8 },
  '😭': { sentiment: 'très_négatif', score: -0.8 },
  '😡': { sentiment: 'très_négatif', score: -0.9 },
  '😠': { sentiment: 'très_négatif', score: -0.9 },
  '🤬': { sentiment: 'très_négatif', score: -0.9 },
  '💔': { sentiment: 'très_négatif', score: -0.8 },
  '😱': { sentiment: 'très_négatif', score: -0.7 },
};

// Dictionnaire des emoticônes textuelles
const EMOTICON_SENTIMENTS = {
  ':)': { sentiment: 'positif', score: 0.5 },
  ':-)': { sentiment: 'positif', score: 0.5 },
  '=)': { sentiment: 'positif', score: 0.5 },
  ':D': { sentiment: 'positif', score: 0.7 },
  ':-D': { sentiment: 'positif', score: 0.7 },
  '=D': { sentiment: 'positif', score: 0.7 },
  ':P': { sentiment: 'positif', score: 0.4 },
  ':-P': { sentiment: 'positif', score: 0.4 },
  '^_^': { sentiment: 'positif', score: 0.6 },
  '^^': { sentiment: 'positif', score: 0.5 },
  '<3': { sentiment: 'très_positif', score: 0.8 },
  ':*': { sentiment: 'positif', score: 0.6 },
  
  ':(': { sentiment: 'négatif', score: -0.5 },
  ':-(': { sentiment: 'négatif', score: -0.5 },
  '=(': { sentiment: 'négatif', score: -0.5 },
  '>.>': { sentiment: 'négatif', score: -0.4 },
  '<_<': { sentiment: 'négatif', score: -0.4 },
  '>_<': { sentiment: 'négatif', score: -0.6 },
  
  ':|': { sentiment: 'neutre', score: 0 },
  ':-|': { sentiment: 'neutre', score: 0 },
  '=|': { sentiment: 'neutre', score: 0 },
};

// Mots d'intensification et d'atténuation
const INTENSIFIERS = {
  // Intensification positive
  'très': 1.3, 'vraiment': 1.3, 'super': 1.4, 'hyper': 1.4, 'ultra': 1.4,
  'extrêmement': 1.5, 'incroyablement': 1.5, 'absolument': 1.3, 'totalement': 1.3,
  'parfaitement': 1.4, 'complètement': 1.3, 'énormément': 1.4, 'exceptionnellement': 1.5,
  
  // Atténuation
  'un peu': 0.7, 'assez': 0.8, 'plutôt': 0.8, 'relativement': 0.7,
  'moyennement': 0.6, 'légèrement': 0.5, 'quelque peu': 0.6, 'faiblement': 0.4,
  
  // Négation
  'pas': -1, 'non': -1, 'jamais': -1.2, 'aucun': -1.1, 'rien': -1.1,
  'ne': -0.8, 'sans': -0.9, 'aucune': -1.1, 'nullement': -1.3,
};

// Mots vides étendus (français et anglais)
const EXTENDED_STOP_WORDS = new Set([
  // Français
  'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour',
  'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
  'par', 'grand', 'comme', 'autre', 'voir', 'très', 'bien', 'aussi', 'faire',
  'du', 'la', 'des', 'les', 'au', 'aux', 'je', 'tu', 'nous', 'vous', 'ils',
  'elles', 'me', 'te', 'lui', 'leur', 'leurs', 'mon', 'ma', 'mes', 'ton', 'ta',
  'tes', 'notre', 'votre', 'vos', 'qui', 'quoi', 'dont', 'où', 'quand', 'comment',
  'pourquoi', 'si', 'oui', 'non', 'ou', 'ni', 'mais', 'car', 'donc', 'alors',
  'cette', 'ces', 'cet', 'celui', 'celle', 'ceux', 'celles', 'ici', 'là', 'déjà',
  'encore', 'toujours', 'jamais', 'souvent', 'parfois', 'peut', 'être', 'avoir',
  'fait', 'faire', 'dit', 'dire', 'va', 'aller', 'vient', 'venir', 'doit', 'devoir',
  
  // Anglais
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
  'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'who', 'what', 'where', 'when', 'why', 'how', 'which',
  'if', 'yes', 'no', 'not', 'so', 'very', 'just', 'now', 'then', 'here', 'there',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once', 'more',
]);

// Fonction principale de préprocessing avancé
function advancedPreprocessText(text, options = {}) {
  if (!text || typeof text !== 'string') return { processed: '', features: {} };
  
  const features = {
    originalLength: text.length,
    emojis: [],
    emoticons: [],
    sentimentModifiers: [],
    urls: [],
    mentions: [],
    hashtags: [],
    intensifiers: [],
    negations: [],
  };
  
  let processed = text;
  
  // 1. Extraction et traitement des emojis
  const emojiMatches = processed.match(REGEX_PATTERNS.emojis) || [];
  emojiMatches.forEach(emoji => {
    if (EMOJI_SENTIMENTS[emoji]) {
      features.emojis.push({
        emoji,
        ...EMOJI_SENTIMENTS[emoji]
      });
      processed = processed.replace(emoji, ` EMOJI_${EMOJI_SENTIMENTS[emoji].sentiment.toUpperCase()} `);
    }
  });
  
  // 2. Extraction et traitement des emoticônes
  const emoticonMatches = processed.match(REGEX_PATTERNS.emoticons) || [];
  emoticonMatches.forEach(emoticon => {
    if (EMOTICON_SENTIMENTS[emoticon]) {
      features.emoticons.push({
        emoticon,
        ...EMOTICON_SENTIMENTS[emoticon]
      });
      processed = processed.replace(emoticon, ` EMOTICON_${EMOTICON_SENTIMENTS[emoticon].sentiment.toUpperCase()} `);
    }
  });
  
  // 3. Extraction des URLs, mentions, hashtags
  features.urls = processed.match(REGEX_PATTERNS.urls) || [];
  features.mentions = processed.match(REGEX_PATTERNS.mentions) || [];
  features.hashtags = processed.match(REGEX_PATTERNS.hashtags) || [];
  
  // Remplacement par des tokens
  processed = processed.replace(REGEX_PATTERNS.urls, ' URL ');
  processed = processed.replace(REGEX_PATTERNS.emails, ' EMAIL ');
  processed = processed.replace(REGEX_PATTERNS.mentions, ' MENTION ');
  processed = processed.replace(REGEX_PATTERNS.hashtags, ' HASHTAG ');
  processed = processed.replace(REGEX_PATTERNS.phone, ' PHONE ');
  
  // 4. Normalisation de la casse
  processed = processed.toLowerCase();
  
  // 5. Détection des intensificateurs et négations
  const words = processed.split(/\s+/);
  words.forEach((word, index) => {
    if (INTENSIFIERS[word]) {
      features.intensifiers.push({
        word,
        multiplier: INTENSIFIERS[word],
        position: index
      });
      
      if (INTENSIFIERS[word] < 0) {
        features.negations.push({
          word,
          position: index
        });
      }
    }
  });
  
  // 6. Nettoyage des caractères spéciaux et ponctuation
  processed = processed.replace(REGEX_PATTERNS.repeatedPunctuation, '.');
  processed = processed.replace(REGEX_PATTERNS.specialChars, ' ');
  processed = processed.replace(REGEX_PATTERNS.repeatedSpaces, ' ');
  
  // 7. Suppression des mots vides (optionnel)
  if (options.removeStopWords !== false) {
    const filteredWords = processed.split(/\s+/)
      .filter(word => word.length > 2 && !EXTENDED_STOP_WORDS.has(word));
    processed = filteredWords.join(' ');
  }
  
  // 8. Suppression des mots trop courts ou trop longs
  if (options.filterWordLength !== false) {
    const filteredWords = processed.split(/\s+/)
      .filter(word => word.length >= 2 && word.length <= 50);
    processed = filteredWords.join(' ');
  }
  
  // 9. Normalisation finale
  processed = processed.trim().replace(/\s+/g, ' ');
  
  // 10. Calcul des métriques finales
  features.processedLength = processed.length;
  features.wordCount = processed.split(/\s+/).filter(w => w.length > 0).length;
  features.compressionRatio = features.originalLength > 0 ? 
    features.processedLength / features.originalLength : 0;
  features.sentimentScore = calculateTextSentimentScore(features);
  
  return {
    processed,
    features
  };
}

// Calcul du score de sentiment basé sur les features
function calculateTextSentimentScore(features) {
  let score = 0;
  let count = 0;
  
  // Score des emojis
  features.emojis.forEach(emoji => {
    score += emoji.score;
    count++;
  });
  
  // Score des emoticônes
  features.emoticons.forEach(emoticon => {
    score += emoticon.score;
    count++;
  });
  
  // Application des modificateurs (intensificateurs/négations)
  if (features.intensifiers.length > 0) {
    const avgMultiplier = features.intensifiers.reduce((sum, int) => sum + int.multiplier, 0) / features.intensifiers.length;
    if (count > 0) {
      score *= Math.abs(avgMultiplier);
      if (avgMultiplier < 0) score *= -1;
    }
  }
  
  return count > 0 ? Math.max(-1, Math.min(1, score / count)) : 0;
}

// Fonction de détection de la langue
function detectLanguage(text) {
  const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par'];
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'];
  
  const words = text.toLowerCase().split(/\s+/);
  let frenchScore = 0;
  let englishScore = 0;
  
  words.forEach(word => {
    if (frenchWords.includes(word)) frenchScore++;
    if (englishWords.includes(word)) englishScore++;
  });
  
  if (frenchScore > englishScore) return 'fr';
  if (englishScore > frenchScore) return 'en';
  return 'unknown';
}

// Fonction de nettoyage spécialisé pour différents domaines
function domainSpecificCleaning(text, domain = 'general') {
  let cleaned = text;
  
  switch (domain) {
    case 'ecommerce':
      // Nettoyage spécifique e-commerce
      cleaned = cleaned.replace(/ref\s*:\s*\w+/gi, ''); // Références produit
      cleaned = cleaned.replace(/sku\s*:\s*\w+/gi, ''); // SKU
      cleaned = cleaned.replace(/\b\d+[€$£¥]\b/g, 'PRIX'); // Prix
      break;
      
    case 'restaurant':
      // Nettoyage spécifique restaurant
      cleaned = cleaned.replace(/\b\d{1,2}h\d{2}\b/g, 'HEURE'); // Heures
      cleaned = cleaned.replace(/table\s+\d+/gi, 'TABLE'); // Numéros de table
      break;
      
    case 'hotel':
      // Nettoyage spécifique hôtel
      cleaned = cleaned.replace(/chambre\s+\d+/gi, 'CHAMBRE'); // Numéros de chambre
      cleaned = cleaned.replace(/\b\d+\s*étoiles?\b/gi, 'ETOILES'); // Classification étoiles
      cleaned = cleaned.replace(/check[-\s]?in|check[-\s]?out/gi, 'CHECKINOUT'); // Check-in/out
      break;
      
    case 'healthcare':
      // Nettoyage spécifique santé
      cleaned = cleaned.replace(/dr\.?\s+\w+/gi, 'DOCTEUR'); // Noms de docteurs
      cleaned = cleaned.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, 'DATE'); // Dates
      break;
      
    case 'automotive':
      // Nettoyage spécifique automobile
      cleaned = cleaned.replace(/\b\d{4}\s*(km|miles)\b/gi, 'KILOMETRAGE'); // Kilométrage
      cleaned = cleaned.replace(/\b[A-Z]{2}-\d{3}-[A-Z]{2}\b/g, 'PLAQUE'); // Plaques d'immatriculation
      break;
      
    case 'finance':
      // Nettoyage spécifique finance
      cleaned = cleaned.replace(/\b\d+[€$£¥]\b/g, 'MONTANT'); // Montants
      cleaned = cleaned.replace(/\bIBAN\s*[A-Z0-9]+\b/gi, 'IBAN'); // IBAN
      break;
      
    default:
      // Nettoyage général
      break;
  }
  
  return cleaned;
}

// Fonction de validation de la qualité du texte
function validateTextQuality(text) {
  const quality = {
    score: 0,
    issues: [],
    recommendations: []
  };
  
  // Longueur du texte
  if (text.length < 10) {
    quality.issues.push('Texte trop court (< 10 caractères)');
    quality.recommendations.push('Textes plus longs pour une meilleure analyse');
  } else if (text.length > 5000) {
    quality.issues.push('Texte très long (> 5000 caractères)');
    quality.recommendations.push('Considérer une segmentation');
  } else {
    quality.score += 20;
  }
  
  // Ratio caractères/mots
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength = text.length / words.length;
  
  if (avgWordLength < 3) {
    quality.issues.push('Mots très courts en moyenne');
  } else if (avgWordLength > 8) {
    quality.issues.push('Mots très longs en moyenne');
  } else {
    quality.score += 15;
  }
  
  // Présence de ponctuation
  const punctuationCount = (text.match(/[.!?;:,]/g) || []).length;
  if (punctuationCount === 0) {
    quality.issues.push('Aucune ponctuation détectée');
  } else {
    quality.score += 10;
  }
  
  // Répétition excessive de caractères
  const repeatedChars = text.match(/(.)\1{3,}/g);
  if (repeatedChars && repeatedChars.length > 0) {
    quality.issues.push('Caractères répétés excessivement');
    quality.recommendations.push('Vérifier la qualité de saisie');
  } else {
    quality.score += 10;
  }
  
  // Présence de contenu informatif
  const infoWords = ['parce que', 'car', 'donc', 'mais', 'cependant', 'néanmoins', 'toutefois', 'because', 'however', 'therefore'];
  const hasInfoWords = infoWords.some(word => text.toLowerCase().includes(word));
  if (hasInfoWords) {
    quality.score += 15;
  }
  
  // Diversité lexicale
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / words.length;
  if (lexicalDiversity > 0.7) {
    quality.score += 15;
  } else if (lexicalDiversity < 0.3) {
    quality.issues.push('Faible diversité lexicale');
  }
  
  // Présence de mots vides (indicateur de structure)
  const stopWordCount = words.filter(w => EXTENDED_STOP_WORDS.has(w.toLowerCase())).length;
  const stopWordRatio = stopWordCount / words.length;
  if (stopWordRatio > 0.1 && stopWordRatio < 0.6) {
    quality.score += 15;
  }
  
  // Score final
  quality.score = Math.min(100, quality.score);
  
  // Classification de la qualité
  if (quality.score >= 80) {
    quality.level = 'Excellente';
  } else if (quality.score >= 60) {
    quality.level = 'Bonne';
  } else if (quality.score >= 40) {
    quality.level = 'Moyenne';
  } else {
    quality.level = 'Faible';
  }
  
  return quality;
}

// Fonction d'extraction des entités nommées basiques
function extractBasicEntities(text) {
  const entities = {
    dates: [],
    numbers: [],
    capitalized: [],
    repeated: []
  };
  
  // Extraction des dates
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // JJ/MM/AAAA
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,   // JJ-MM-AAAA
    /\b\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{2,4}\b/gi,
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{2,4}\b/gi
  ];
  
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    entities.dates.push(...matches);
  });
  
  // Extraction des nombres significatifs
  const numberMatches = text.match(/\b\d+([.,]\d+)?([€$£¥%]|\s*(euros?|dollars?|livres?|yens?|pourcents?))\b/gi) || [];
  entities.numbers = numberMatches;
  
  // Mots avec majuscules (possibles noms propres)
  const capitalizedMatches = text.match(/\b[A-ZÀÁÂÄÆÇÉÈÊËÏÎÔÖÙÛÜŸÑ][a-zàáâäæçéèêëïîôöùûüÿñ]+\b/g) || [];
  entities.capitalized = capitalizedMatches.filter(word => !EXTENDED_STOP_WORDS.has(word.toLowerCase()));
  
  // Mots répétés (possibles mots-clés importants)
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    if (word.length > 3 && !EXTENDED_STOP_WORDS.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  entities.repeated = Object.entries(wordCount)
    .filter(([word, count]) => count > 1)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  return entities;
}

// Fonction de calcul de lisibilité
function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Index de Flesch (adapté)
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  let readabilityLevel;
  if (fleschScore >= 90) readabilityLevel = 'Très facile';
  else if (fleschScore >= 80) readabilityLevel = 'Facile';
  else if (fleschScore >= 70) readabilityLevel = 'Assez facile';
  else if (fleschScore >= 60) readabilityLevel = 'Standard';
  else if (fleschScore >= 50) readabilityLevel = 'Assez difficile';
  else if (fleschScore >= 30) readabilityLevel = 'Difficile';
  else readabilityLevel = 'Très difficile';
  
  return {
    fleschScore: Math.round(fleschScore),
    level: readabilityLevel,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    sentenceCount: sentences.length,
    wordCount: words.length,
    syllableCount: syllables
  };
}

// Fonction de comptage des syllabes (approximatif)
function countSyllables(word) {
  if (!word || word.length === 0) return 0;
  
  word = word.toLowerCase();
  
  // Approximation basée sur les voyelles
  const vowels = 'aeiouyàáâäæéèêëïîôöùûüÿ';
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Ajustements
  if (word.endsWith('e') && count > 1) count--;
  if (word.endsWith('le') && count > 1) count--;
  
  return Math.max(1, count);
}

// Fonction de comparaison de textes
function compareTexts(text1, text2) {
  const processed1 = advancedPreprocessText(text1);
  const processed2 = advancedPreprocessText(text2);
  
  const words1 = new Set(processed1.processed.split(/\s+/));
  const words2 = new Set(processed2.processed.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  const jaccardSimilarity = intersection.size / union.size;
  const commonWords = Array.from(intersection);
  
  return {
    similarity: Math.round(jaccardSimilarity * 1000) / 1000,
    commonWords: commonWords.slice(0, 10), // Top 10 mots communs
    uniqueWords1: [...words1].filter(x => !words2.has(x)).slice(0, 5),
    uniqueWords2: [...words2].filter(x => !words1.has(x)).slice(0, 5)
  };
}

// Fonction de segmentation intelligente pour gros textes
function intelligentTextSegmentation(text, maxSegmentLength = 500) {
  if (text.length <= maxSegmentLength) {
    return [text];
  }
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const segments = [];
  let currentSegment = '';
  
  sentences.forEach(sentence => {
    const trimmedSentence = sentence.trim();
    if ((currentSegment + trimmedSentence).length <= maxSegmentLength) {
      currentSegment += (currentSegment ? '. ' : '') + trimmedSentence;
    } else {
      if (currentSegment) {
        segments.push(currentSegment + '.');
      }
      currentSegment = trimmedSentence;
    }
  });
  
  if (currentSegment) {
    segments.push(currentSegment + '.');
  }
  
  return segments;
}

// Fonction de nettoyage spécialisé pour réseaux sociaux
function cleanSocialMediaText(text) {
  let cleaned = text;
  
  // Nettoyage spécifique réseaux sociaux
  cleaned = cleaned.replace(/@[a-zA-Z0-9_]+/g, 'MENTION'); // Mentions
  cleaned = cleaned.replace(/#[a-zA-Z0-9_]+/g, 'HASHTAG'); // Hashtags
  cleaned = cleaned.replace(/RT\s+/g, ''); // Retweets
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, 'URL'); // URLs
  
  // Correction de l'écriture SMS
  const smsCorrections = {
    'vs': 'vous',
    'tt': 'tout',
    'bcp': 'beaucoup',
    'tjrs': 'toujours',
    'jms': 'jamais',
    'qd': 'quand',
    'pr': 'pour',
    'ds': 'dans',
    'ms': 'mais',
    'dc': 'donc',
    'pcq': 'parce que',
    'u': 'you',
    'ur': 'your',
    'r': 'are',
    'b4': 'before',
    '2': 'to',
    '4': 'for'
  };
  
  Object.entries(smsCorrections).forEach(([sms, correct]) => {
    const regex = new RegExp(`\\b${sms}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correct);
  });
  
  return cleaned;
}

// Fonction de détection des aspects (pour analyse fine)
function detectAspects(text, domain = 'general') {
  const aspectsKeywords = {
    restaurant: {
      'service': ['service', 'serveur', 'personnel', 'accueil', 'attente'],
      'nourriture': ['plat', 'cuisine', 'goût', 'saveur', 'qualité', 'fraîcheur'],
      'ambiance': ['ambiance', 'décor', 'musique', 'bruit', 'atmosphère'],
      'prix': ['prix', 'cher', 'coût', 'tarif', 'rapport qualité prix']
    },
    hotel: {
      'chambre': ['chambre', 'lit', 'propreté', 'confort', 'literie'],
      'service': ['personnel', 'réception', 'accueil', 'service'],
      'localisation': ['emplacement', 'quartier', 'transport', 'centre ville'],
      'équipements': ['wifi', 'piscine', 'parking', 'climatisation', 'télé']
    },
    ecommerce: {
      'produit': ['produit', 'qualité', 'matériau', 'finition', 'design'],
      'livraison': ['livraison', 'expédition', 'délai', 'transport', 'colis'],
      'prix': ['prix', 'coût', 'tarif', 'promotion', 'rapport qualité prix'],
      'service client': ['sav', 'support', 'aide', 'réponse', 'contact']
    }
  };
  
  const aspects = {};
  const domainKeywords = aspectsKeywords[domain] || aspectsKeywords.general || {};
  
  Object.entries(domainKeywords).forEach(([aspect, keywords]) => {
    const mentions = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (mentions.length > 0) {
      aspects[aspect] = {
        mentions: mentions.length,
        keywords: mentions
      };
    }
  });
  
  return aspects;
}

// Fonction de calcul de polarité contextuelle
function calculateContextualPolarity(text, window = 3) {
  const words = text.toLowerCase().split(/\s+/);
  const polarityScores = [];
  
  words.forEach((word, index) => {
    // Vérifier si le mot a une polarité connue
    if (EMOJI_SENTIMENTS[word] || INTENSIFIERS[word]) {
      const baseScore = EMOJI_SENTIMENTS[word]?.score || 
                       (INTENSIFIERS[word] > 0 ? 0.5 : -0.5);
      
      // Analyser le contexte (mots précédents et suivants)
      const contextStart = Math.max(0, index - window);
      const contextEnd = Math.min(words.length, index + window + 1);
      const context = words.slice(contextStart, contextEnd);
      
      // Détecter les négations dans le contexte
      const hasNegation = context.some(w => INTENSIFIERS[w] < 0);
      const hasIntensification = context.some(w => INTENSIFIERS[w] > 1);
      
      let adjustedScore = baseScore;
      if (hasNegation) adjustedScore *= -1;
      if (hasIntensification) adjustedScore *= 1.5;
      
      polarityScores.push({
        word,
        position: index,
        baseScore,
        adjustedScore,
        context: context.join(' ')
      });
    }
  });
  
  return polarityScores;
}

// Fonction de génération de statistiques avancées
function generateAdvancedStats(text) {
  const stats = {
    basic: {},
    linguistic: {},
    sentiment: {},
    complexity: {}
  };
  
  // Statistiques de base
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  stats.basic = {
    characterCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: Math.round((words.length / sentences.length) * 100) / 100,
    avgCharsPerWord: Math.round((text.length / words.length) * 100) / 100
  };
  
  // Statistiques linguistiques
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const longWords = words.filter(w => w.length > 6);
  const shortWords = words.filter(w => w.length <= 3);
  
  stats.linguistic = {
    uniqueWordCount: uniqueWords.size,
    lexicalDiversity: Math.round((uniqueWords.size / words.length) * 1000) / 1000,
    longWordPercentage: Math.round((longWords.length / words.length) * 1000) / 10,
    shortWordPercentage: Math.round((shortWords.length / words.length) * 1000) / 10
  };
  
  // Analyse des caractères spéciaux
  const uppercaseCount = (text.match(/[A-ZÀÁÂÄÆÇÉÈÊËÏÎÔÖÙÛÜŸÑ]/g) || []).length;
  const punctuationCount = (text.match(/[.!?;:,]/g) || []).length;
  const digitCount = (text.match(/\d/g) || []).length;
  
  stats.complexity = {
    uppercasePercentage: Math.round((uppercaseCount / text.length) * 1000) / 10,
    punctuationDensity: Math.round((punctuationCount / words.length) * 1000) / 1000,
    digitPercentage: Math.round((digitCount / text.length) * 1000) / 10
  };
  
  // Analyse préliminaire de sentiment
  const processed = advancedPreprocessText(text);
  stats.sentiment = {
    preliminaryScore: processed.features.sentimentScore,
    emojiCount: processed.features.emojis.length,
    emoticonCount: processed.features.emoticons.length,
    intensifierCount: processed.features.intensifiers.length
  };
  
  return stats;
}

// Fonction de validation des données d'entrée
function validateInputData(data, textColumn) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  // Vérification du format des données
  if (!Array.isArray(data)) {
    validation.isValid = false;
    validation.errors.push('Les données doivent être un tableau');
    return validation;
  }
  
  if (data.length === 0) {
    validation.isValid = false;
    validation.errors.push('Le tableau de données est vide');
    return validation;
  }
  
  // Vérification de la colonne de texte
  const firstRow = data[0];
  if (!firstRow || typeof firstRow !== 'object') {
    validation.isValid = false;
    validation.errors.push('Format de données invalide');
    return validation;
  }
  
  const columns = Object.keys(firstRow);
  if (!textColumn || !columns.includes(textColumn)) {
    validation.isValid = false;
    validation.errors.push(`Colonne '${textColumn}' non trouvée. Colonnes disponibles: ${columns.join(', ')}`);
    return validation;
  }
  
  // Analyse de la qualité des données
  let emptyTexts = 0;
  let shortTexts = 0;
  let longTexts = 0;
  const textLengths = [];
  
  data.forEach((row, index) => {
    const text = row[textColumn];
    
    if (!text || typeof text !== 'string') {
      emptyTexts++;
    } else {
      const length = text.trim().length;
      textLengths.push(length);
      
      if (length === 0) emptyTexts++;
      else if (length < 10) shortTexts++;
      else if (length > 1000) longTexts++;
    }
  });
  
  // Warnings basés sur la qualité
  const emptyRatio = emptyTexts / data.length;
  const shortRatio = shortTexts / data.length;
  const longRatio = longTexts / data.length;
  
  if (emptyRatio > 0.1) {
    validation.warnings.push(`${Math.round(emptyRatio * 100)}% de textes vides ou invalides`);
  }
  
  if (shortRatio > 0.3) {
    validation.warnings.push(`${Math.round(shortRatio * 100)}% de textes très courts (< 10 caractères)`);
    validation.suggestions.push('Considérer le filtrage des textes trop courts pour améliorer la précision');
  }
  
  if (longRatio > 0.1) {
    validation.warnings.push(`${Math.round(longRatio * 100)}% de textes très longs (> 1000 caractères)`);
    validation.suggestions.push('Les textes longs peuvent être segmentés pour une meilleure analyse');
  }
  
  // Statistiques des longueurs
  if (textLengths.length > 0) {
    const avgLength = textLengths.reduce((a, b) => a + b, 0) / textLengths.length;
    const minLength = Math.min(...textLengths);
    const maxLength = Math.max(...textLengths);
    
    validation.statistics = {
      avgTextLength: Math.round(avgLength),
      minTextLength: minLength,
      maxTextLength: maxLength,
      validTexts: textLengths.length,
      totalRows: data.length
    };
  }
  
  return validation;
}

// Fonction de nettoyage et préparation des données
function prepareDataForAnalysis(data, textColumn, options = {}) {
  const prepared = {
    cleanData: [],
    skippedRows: [],
    statistics: {
      processed: 0,
      skipped: 0,
      cleaned: 0
    }
  };
  
  data.forEach((row, index) => {
    const text = row[textColumn];
    
    // Filtrer les textes invalides
    if (!text || typeof text !== 'string' || text.trim().length < (options.minLength || 5)) {
      prepared.skippedRows.push({
        index,
        reason: 'Texte trop court ou invalide',
        originalText: text
      });
      prepared.statistics.skipped++;
      return;
    }
    
    // Préprocessing selon les options
    let processedText = text;
    
    if (options.cleanSocialMedia) {
      processedText = cleanSocialMediaText(processedText);
      prepared.statistics.cleaned++;
    }
    
    if (options.domain) {
      processedText = domainSpecificCleaning(processedText, options.domain);
    }
    
    // Segmentation pour textes longs
    if (options.maxLength && processedText.length > options.maxLength) {
      const segments = intelligentTextSegmentation(processedText, options.maxLength);
      
      segments.forEach((segment, segIndex) => {
        prepared.cleanData.push({
          ...row,
          [textColumn]: segment,
          originalIndex: index,
          segmentIndex: segIndex,
          isSegmented: true
        });
      });
    } else {
      prepared.cleanData.push({
        ...row,
        [textColumn]: processedText,
        originalIndex: index,
        isSegmented: false
      });
    }
    
    prepared.statistics.processed++;
  });
  
  return prepared;
}

// Fonction de post-traitement des résultats
function postProcessResults(results, originalData) {
  const postProcessed = {
    ...results,
    qualityMetrics: {
      confidence: {
        high: 0,    // > 0.8
        medium: 0,  // 0.5 - 0.8
        low: 0      // < 0.5
      },
      textQuality: {
        excellent: 0, // Score > 80
        good: 0,      // Score 60-80
        average: 0,   // Score 40-60
        poor: 0       // Score < 40
      }
    },
    recommendations: []
  };
  
  // Analyse de la qualité des résultats
  if (results.sentiments) {
    results.sentiments.forEach(sentiment => {
      // Classification par confiance
      if (sentiment.confidence > 0.8) {
        postProcessed.qualityMetrics.confidence.high++;
      } else if (sentiment.confidence > 0.5) {
        postProcessed.qualityMetrics.confidence.medium++;
      } else {
        postProcessed.qualityMetrics.confidence.low++;
      }
      
      // Évaluation de la qualité du texte
      const quality = validateTextQuality(sentiment.text);
      if (quality.score > 80) {
        postProcessed.qualityMetrics.textQuality.excellent++;
      } else if (quality.score > 60) {
        postProcessed.qualityMetrics.textQuality.good++;
      } else if (quality.score > 40) {
        postProcessed.qualityMetrics.textQuality.average++;
      } else {
        postProcessed.qualityMetrics.textQuality.poor++;
      }
    });
    
    // Génération de recommandations
    const totalResults = results.sentiments.length;
    const lowConfidenceRatio = postProcessed.qualityMetrics.confidence.low / totalResults;
    const poorQualityRatio = postProcessed.qualityMetrics.textQuality.poor / totalResults;
    
    if (lowConfidenceRatio > 0.3) {
      postProcessed.recommendations.push({
        type: 'warning',
        message: `${Math.round(lowConfidenceRatio * 100)}% des analyses ont une faible confiance`,
        suggestion: 'Améliorer la qualité des textes source ou utiliser un préprocessing plus poussé'
      });
    }
    
    if (poorQualityRatio > 0.2) {
      postProcessed.recommendations.push({
        type: 'info',
        message: `${Math.round(poorQualityRatio * 100)}% des textes sont de qualité faible`,
        suggestion: 'Filtrer les textes trop courts ou peu informatifs avant analyse'
      });
    }
  }
  
  return postProcessed;
}

// Fonction de benchmark et performance
function benchmarkAnalysis(dataSize, startTime) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const benchmark = {
    duration: duration,
    durationFormatted: formatDuration(duration),
    throughput: Math.round((dataSize / duration) * 1000), // éléments par seconde
    performance: 'unknown'
  };
  
  // Classification de la performance
  const elementsPerSecond = benchmark.throughput;
  if (elementsPerSecond > 50) {
    benchmark.performance = 'excellent';
  } else if (elementsPerSecond > 20) {
    benchmark.performance = 'good';
  } else if (elementsPerSecond > 10) {
    benchmark.performance = 'average';
  } else {
    benchmark.performance = 'slow';
  }
  
  return benchmark;
}

// Fonction utilitaire de formatage de durée
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${milliseconds}ms`;
  }
}

// Fonction de génération de rapport de diagnostic
function generateDiagnosticReport(data, textColumn, results) {
  const report = {
    timestamp: new Date().toISOString(),
    input: {
      totalRows: data.length,
      textColumn: textColumn,
      sampleText: data[0] ? data[0][textColumn]?.substring(0, 100) + '...' : 'N/A'
    },
    processing: {},
    output: {},
    recommendations: []
  };
  
  // Analyse des données d'entrée
  const validation = validateInputData(data, textColumn);
  report.input.validation = validation;
  
  // Analyse des résultats
  if (results) {
    report.output = {
      totalAnalyzed: results.sentiments?.length || 0,
      avgConfidence: results.metrics?.sentiment?.avgConfidence || 0,
      globalScore: results.metrics?.sentiment?.globalScore || 0,
      themeCount: results.themes?.totalThemes || 0
    };
    
    // Recommandations basées sur les résultats
    if (report.output.avgConfidence < 0.7) {
      report.recommendations.push({
        category: 'quality',
        message: 'Confiance d\'analyse faible',
        actions: [
          'Améliorer la qualité des textes source',
          'Augmenter la taille de l\'échantillon',
          'Utiliser un préprocessing plus avancé'
        ]
      });
    }
    
    if (report.output.themeCount < 3 && data.length > 100) {
      report.recommendations.push({
        category: 'themes',
        message: 'Peu de thèmes détectés pour un large corpus',
        actions: [
          'Ajuster les paramètres de clustering',
          'Vérifier la diversité du contenu',
          'Considérer une analyse par sous-segments'
        ]
      });
    }
  }
  
  return report;
}

// Export des fonctions
module.exports = {
  // Fonctions principales
  advancedPreprocessText,
  validateTextQuality,
  extractBasicEntities,
  calculateReadability,
  compareTexts,
  detectLanguage,
  domainSpecificCleaning,
  calculateTextSentimentScore,
  
  // Fonctions utilitaires avancées
  intelligentTextSegmentation,
  cleanSocialMediaText,
  detectAspects,
  calculateContextualPolarity,
  generateAdvancedStats,
  
  // Fonctions de validation et préparation
  validateInputData,
  prepareDataForAnalysis,
  postProcessResults,
  
  // Fonctions de diagnostic et benchmark
  benchmarkAnalysis,
  generateDiagnosticReport,
  formatDuration,
  countSyllables,
  
  // Constantes et dictionnaires
  EMOJI_SENTIMENTS,
  EMOTICON_SENTIMENTS,
  INTENSIFIERS,
  EXTENDED_STOP_WORDS,
  REGEX_PATTERNS
}