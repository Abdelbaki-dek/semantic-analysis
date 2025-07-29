const fs = require('fs');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const { pipeline } = require('@xenova/transformers');

// ===========================
// DICTIONNAIRES FRANÇAIS ENRICHIS
// ===========================

// Mots de sentiment français avec scores précis
const FRENCH_SENTIMENT_LEXICON = {
    // Très positifs (0.7-1.0)
    'excellent': 0.9, 'parfait': 0.9, 'magnifique': 0.9, 'fantastique': 0.9,
    'exceptionnel': 0.9, 'merveilleux': 0.8, 'formidable': 0.8, 'génial': 0.8,
    'superbe': 0.8, 'remarquable': 0.8, 'extraordinaire': 0.9, 'incroyable': 0.8,
    'sensationnel': 0.8, 'fabuleux': 0.8, 'sublime': 0.9, 'délicieux': 0.7,
    
    // Positifs (0.4-0.7)
    'bon': 0.6, 'bien': 0.5, 'agréable': 0.6, 'satisfait': 0.6, 'content': 0.6,
    'heureux': 0.7, 'plaisant': 0.5, 'sympa': 0.5, 'cool': 0.5, 'top': 0.7,
    'super': 0.7, 'chouette': 0.6, 'nickel': 0.6, 'parfaitement': 0.7,
    'recommande': 0.6, 'satisfaisant': 0.5, 'réussi': 0.6, 'efficace': 0.5,
    
    // Légèrement positifs (0.1-0.4)
    'ok': 0.2, 'correct': 0.3, 'convenable': 0.2, 'acceptable': 0.2,
    'potable': 0.1, 'décent': 0.2, 'pas mal': 0.3, 'ça va': 0.2,
    
    // Très négatifs (-0.7 à -1.0)
    'horrible': -0.9, 'catastrophique': -0.9, 'épouvantable': -0.9, 'affreux': -0.8,
    'détestable': -0.8, 'ignoble': -0.9, 'scandaleux': -0.8, 'inadmissible': -0.8,
    'inacceptable': -0.8, 'révoltant': -0.8, 'dégoûtant': -0.8, 'atroce': -0.9,
    'lamentable': -0.8, 'pitoyable': -0.7, 'catastrophe': -0.9,
    
    // Négatifs (-0.4 à -0.7)
    'mauvais': -0.6, 'nul': -0.7, 'décevant': -0.5, 'médiocre': -0.5,
    'insuffisant': -0.4, 'raté': -0.6, 'minable': -0.7, 'pourri': -0.7,
    'moche': -0.5, 'sale': -0.4, 'déçu': -0.5, 'énervé': -0.5,
    
    // Légèrement négatifs (-0.1 à -0.4)
    'bof': -0.2, 'moyen': -0.2, 'limite': -0.3, 'juste': -0.1,
    'passable': -0.1, 'sans plus': -0.2, 'pas terrible': -0.4
};

// Intensificateurs contextuels français
const FRENCH_INTENSIFIERS = {
    // Amplificateurs
    'très': 1.5, 'vraiment': 1.3, 'super': 1.4, 'hyper': 1.4, 'ultra': 1.5,
    'extrêmement': 1.6, 'incroyablement': 1.5, 'absolument': 1.4, 'totalement': 1.4,
    'complètement': 1.3, 'parfaitement': 1.4, 'énormément': 1.4, 'terriblement': 1.3,
    'particulièrement': 1.2, 'spécialement': 1.2, 'exceptionnellement': 1.5,
    
    // Atténuateurs
    'un peu': 0.7, 'assez': 0.8, 'plutôt': 0.8, 'relativement': 0.7,
    'moyennement': 0.6, 'légèrement': 0.5, 'quelque peu': 0.6, 'faiblement': 0.4,
    'peu': 0.6, 'guère': 0.5, 'à peine': 0.3,
    
    // Négations (inversent le sentiment)
    'pas': -1, 'non': -1, 'jamais': -1.2, 'aucun': -1.1, 'rien': -1.1,
    'nullement': -1.3, 'aucunement': -1.2, 'point': -1, 'guerre': -0.9
};

// Emojis avec scores de sentiment précis
const PRECISE_EMOJI_SENTIMENT = {
    // Très positifs (0.7-1.0)
    '😍': 0.9, '🥰': 0.9, '😘': 0.8, '💖': 0.8, '❤️': 0.8, '💕': 0.8,
    '🎉': 0.7, '🥳': 0.7, '🤩': 0.8, '😻': 0.8, '🔥': 0.6, '✨': 0.7,
    '🌟': 0.7, '💫': 0.7, '🎊': 0.7, '🙌': 0.6, '👏': 0.6, '💪': 0.6,
    
    // Positifs (0.4-0.7)
    '😊': 0.6, '😃': 0.6, '😄': 0.6, '😁': 0.6, '🙂': 0.5, '😌': 0.5,
    '👍': 0.5, '👌': 0.5, '✅': 0.4, '😉': 0.5, '😋': 0.6, '🤗': 0.6,
    '💚': 0.6, '💙': 0.6, '💜': 0.6, '🧡': 0.6, '💛': 0.6,
    
    // Légèrement positifs (0.1-0.4)
    '🙃': 0.3, '😏': 0.2, '😎': 0.4, '🤠': 0.3, '🥴': 0.1,
    
    // Neutres (-0.1 à 0.1)
    '😐': 0, '😑': 0, '🤔': 0, '😶': 0, '🤷': 0, '🫤': -0.1,
    
    // Légèrement négatifs (-0.1 à -0.4)
    '😕': -0.2, '🙄': -0.3, '😮‍💨': -0.2, '😤': -0.4, '😒': -0.3,
    
    // Négatifs (-0.4 à -0.7)
    '😞': -0.5, '😔': -0.5, '😣': -0.6, '👎': -0.5, '😪': -0.4,
    '😰': -0.6, '😨': -0.5, '😓': -0.4, '😟': -0.5, '😦': -0.4,
    
    // Très négatifs (-0.7 à -1.0)
    '😢': -0.8, '😭': -0.8, '😡': -0.9, '😠': -0.9, '🤬': -0.9,
    '💔': -0.8, '😱': -0.7, '🤮': -0.8, '😵': -0.7, '🥺': -0.6,
    '😩': -0.7, '😫': -0.7, '🤯': -0.7
};

// Cache des modèles
let sentimentModel = null;
let embeddingModel = null;

// Mots vides français étendus
const FRENCH_STOP_WORDS = new Set([
    'le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour',
    'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout',
    'plus', 'par', 'grand', 'comme', 'autre', 'voir', 'bien', 'aussi',
    'faire', 'du', 'la', 'des', 'les', 'au', 'aux', 'je', 'tu', 'nous',
    'vous', 'ils', 'elles', 'me', 'te', 'lui', 'leur', 'leurs', 'mon',
    'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'votre', 'vos', 'qui',
    'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'si', 'oui',
    'non', 'ou', 'ni', 'mais', 'car', 'donc', 'alors', 'cette', 'ces',
    'cet', 'celui', 'celle', 'ceux', 'celles', 'ici', 'là', 'déjà',
    'encore', 'toujours', 'jamais', 'souvent', 'parfois', 'peut', 'va',
    'vient', 'doit', 'dit', 'fait'
]);

// ===========================
// INITIALISATION CORRIGÉE
// ===========================

async function initializeModels() {
    try {
        if (!sentimentModel) {
            console.log('🤖 Chargement du modèle de sentiment multilingue...');
            // Modèle qui fonctionne mieux avec le français
            sentimentModel = await pipeline(
                'sentiment-analysis', 
                'cardiffnlp/twitter-xlm-roberta-base-sentiment'
            );
        }
        
        if (!embeddingModel) {
            console.log('🧠 Chargement du modèle d\'embeddings multilingue...');
            embeddingModel = await pipeline(
                'feature-extraction', 
                'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            );
        }
        
        console.log('✅ Modèles initialisés avec succès');
    } catch (error) {
        console.error('❌ Erreur initialisation modèles:', error);
        throw error;
    }
}

// ===========================
// PRÉPROCESSING AMÉLIORÉ
// ===========================

function preprocessText(text) {
    if (!text || typeof text !== 'string') return { processed: '', features: {} };
    
    const features = {
        originalLength: text.length,
        emojis: extractEmojisWithSentiment(text),
        hashtags: extractHashtags(text),
        mentions: extractMentions(text),
        intensifiers: [],
        sentimentWords: []
    };
    
    let processed = text;
    
    // 1. Préservation des emojis (remplacer par des tokens)
    features.emojis.forEach((emoji, index) => {
        processed = processed.replace(
            new RegExp(emoji.emoji, 'g'), 
            ` EMOJI_SENTIMENT_${emoji.sentiment > 0 ? 'POS' : emoji.sentiment < 0 ? 'NEG' : 'NEU'} `
        );
    });
    
    // 2. Nettoyage intelligent (préserve la ponctuation importante)
    processed = processed
        .replace(/https?:\/\/[^\s]+/g, ' URL ')
        .replace(/@[a-zA-Z0-9_]+/g, ' MENTION ')
        .replace(/#[a-zA-Z0-9_]+/g, ' HASHTAG ')
        .replace(/[^\w\s\u00C0-\u017F!?.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    
    // 3. Détection des mots de sentiment et intensificateurs
    const words = processed.split(/\s+/);
    words.forEach((word, index) => {
        if (FRENCH_SENTIMENT_LEXICON[word]) {
            features.sentimentWords.push({
                word: word,
                score: FRENCH_SENTIMENT_LEXICON[word],
                position: index
            });
        }
        if (FRENCH_INTENSIFIERS[word]) {
            features.intensifiers.push({
                word: word,
                multiplier: FRENCH_INTENSIFIERS[word],
                position: index
            });
        }
    });
    
    return { processed, features };
}

function extractEmojisWithSentiment(text) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex) || [];
    
    const emojiCounts = {};
    matches.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    });
    
    return Object.entries(emojiCounts).map(([emoji, count]) => ({
        emoji: emoji,
        count: count,
        sentiment: PRECISE_EMOJI_SENTIMENT[emoji] || 0
    }));
}

function extractHashtags(text) {
    const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
    const matches = text.match(hashtagRegex) || [];
    
    const hashtagCounts = {};
    matches.forEach(hashtag => {
        const clean = hashtag.toLowerCase();
        hashtagCounts[clean] = (hashtagCounts[clean] || 0) + 1;
    });
    
    return Object.entries(hashtagCounts).map(([hashtag, count]) => ({
        hashtag: hashtag,
        count: count
    }));
}

function extractMentions(text) {
    const mentionRegex = /@[\w\u00C0-\u017F]+/g;
    const matches = text.match(mentionRegex) || [];
    
    const mentionCounts = {};
    matches.forEach(mention => {
        const clean = mention.toLowerCase();
        mentionCounts[clean] = (mentionCounts[clean] || 0) + 1;
    });
    
    return Object.entries(mentionCounts).map(([mention, count]) => ({
        mention: mention,
        count: count
    }));
}

// ===========================
// ANALYSE DE SENTIMENT CORRIGÉE
// ===========================

async function analyzeSentiments(processedTexts) {
    await initializeModels();
    
    const results = [];
    const batchSize = 8; // Taille de batch optimisée
    
    console.log(`📊 Analyse de ${processedTexts.length} sentiments...`);
    
    for (let i = 0; i < processedTexts.length; i += batchSize) {
        const batch = processedTexts.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
            batch.map(async (item, batchIndex) => {
                const globalIndex = i + batchIndex;
                
                try {
                    // 1. Analyse lexicale française (prioritaire)
                    const lexicalAnalysis = analyzeFrenchLexical(item.processed, item.features);
                    
                    // 2. Analyse des emojis
                    const emojiAnalysis = analyzeEmojiSentiment(item.features.emojis);
                    
                    // 3. Tentative avec le modèle IA (fallback)
                    let modelAnalysis = { score: 0, confidence: 0.1 };
                    try {
                        if (item.processed && item.processed.length > 5) {
                            const modelResult = await sentimentModel(item.processed);
                            modelAnalysis = parseModelResult(modelResult);
                        }
                    } catch (modelError) {
                        console.warn(`⚠️ Modèle IA échoué pour item ${globalIndex}, utilisation lexicale`);
                    }
                    
                    // 4. Score composite intelligent
                    const compositeScore = calculateCompositeScore(
                        lexicalAnalysis,
                        emojiAnalysis,
                        modelAnalysis
                    );
                    
                    // 5. Classification finale avec seuils ajustés
                    const classification = classifyAdvancedSentiment(compositeScore.score);
                    
                    // 6. Calcul de confiance réaliste
                    const confidence = calculateAdvancedConfidence(
                        lexicalAnalysis,
                        emojiAnalysis,
                        modelAnalysis,
                        item.processed
                    );
                    
                    return {
                        id: globalIndex,
                        text: item.original,
                        processedText: item.processed,
                        sentiment: classification.label,
                        score: Math.round(compositeScore.score * 1000) / 1000,
                        confidence: Math.round(confidence * 1000) / 1000,
                        intensity: classification.intensity,
                        
                        // Détails pour debug
                        breakdown: {
                            lexical: lexicalAnalysis.score,
                            emoji: emojiAnalysis.score,
                            model: modelAnalysis.score,
                            composite: compositeScore.score
                        },
                        features: {
                            sentimentWords: lexicalAnalysis.matchedWords,
                            emojis: item.features.emojis,
                            intensifiers: lexicalAnalysis.appliedIntensifiers
                        },
                        metadata: item.metadata || {}
                    };
                    
                } catch (error) {
                    console.error(`❌ Erreur analyse sentiment ${globalIndex}:`, error);
                    return {
                        id: globalIndex,
                        text: item.original || '',
                        sentiment: 'neutre',
                        score: 0,
                        confidence: 0.1,
                        error: error.message
                    };
                }
            })
        );
        
        results.push(...batchResults);
        
        // Log de progression
        if (i % 25 === 0) {
            console.log(`📊 Progression: ${Math.min(i + batchSize, processedTexts.length)}/${processedTexts.length}`);
        }
    }
    
    console.log(`✅ Analyse de sentiment terminée: ${results.length} résultats`);
    return results;
}

function analyzeFrenchLexical(text, features) {
    const words = text.split(/\s+/).filter(w => w.length > 1);
    
    let totalScore = 0;
    let matchCount = 0;
    let intensifierMultiplier = 1;
    const matchedWords = [];
    const appliedIntensifiers = [];
    
    // Analyse contextuelle des mots
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const prevWord = i > 0 ? words[i-1] : '';
        const nextWord = i < words.length - 1 ? words[i+1] : '';
        
        // Vérification mot de sentiment
        if (FRENCH_SENTIMENT_LEXICON[word]) {
            let wordScore = FRENCH_SENTIMENT_LEXICON[word];
            let appliedIntensifier = 1;
            
            // Application intensificateur précédent
            if (FRENCH_INTENSIFIERS[prevWord]) {
                appliedIntensifier = FRENCH_INTENSIFIERS[prevWord];
                wordScore *= Math.abs(appliedIntensifier);
                if (appliedIntensifier < 0) wordScore *= -1; // négation
                
                appliedIntensifiers.push({
                    intensifier: prevWord,
                    target: word,
                    effect: appliedIntensifier
                });
            }
            
            totalScore += wordScore;
            matchCount++;
            matchedWords.push({
                word: word,
                baseScore: FRENCH_SENTIMENT_LEXICON[word],
                finalScore: wordScore,
                intensifier: appliedIntensifier
            });
        }
        
        // Intensificateur global
        if (FRENCH_INTENSIFIERS[word] && !appliedIntensifiers.some(ai => ai.intensifier === word)) {
            intensifierMultiplier *= Math.abs(FRENCH_INTENSIFIERS[word]);
            if (FRENCH_INTENSIFIERS[word] < 0) intensifierMultiplier *= -1;
        }
    }
    
    const avgScore = matchCount > 0 ? totalScore / matchCount : 0;
    const finalScore = avgScore * (intensifierMultiplier !== 1 ? intensifierMultiplier : 1);
    
    return {
        score: Math.max(-1, Math.min(1, finalScore)),
        matchCount: matchCount,
        coverage: matchCount / words.length,
        matchedWords: matchedWords,
        appliedIntensifiers: appliedIntensifiers,
        confidence: Math.min(0.9, 0.3 + (matchCount * 0.1))
    };
}

function analyzeEmojiSentiment(emojis) {
    if (!emojis || emojis.length === 0) {
        return { score: 0, count: 0, confidence: 0 };
    }
    
    let totalScore = 0;
    let totalCount = 0;
    
    emojis.forEach(emojiData => {
        totalScore += emojiData.sentiment * emojiData.count;
        totalCount += emojiData.count;
    });
    
    return {
        score: totalCount > 0 ? totalScore / totalCount : 0,
        count: totalCount,
        confidence: Math.min(0.8, 0.2 + (totalCount * 0.1))
    };
}

function parseModelResult(modelResult) {
    if (!modelResult || !modelResult[0]) {
        return { score: 0, confidence: 0.1 };
    }
    
    const result = modelResult[0];
    let score = 0;
    
    // Gestion des différents formats de modèles
    if (result.label === 'POSITIVE' || result.label === 'LABEL_2') {
        score = result.score * 0.8; // Modération du score IA
    } else if (result.label === 'NEGATIVE' || result.label === 'LABEL_0') {
        score = -result.score * 0.8;
    } else {
        score = 0; // NEUTRAL
    }
    
    return {
        score: score,
        confidence: result.score || 0.1
    };
}

function calculateCompositeScore(lexicalAnalysis, emojiAnalysis, modelAnalysis) {
    // Pondération intelligente basée sur la confiance
    const lexicalWeight = 0.6; // Priorité au lexical français
    const emojiWeight = 0.3;   // Emojis importants
    const modelWeight = 0.1;   // Modèle IA en support
    
    const compositeScore = 
        (lexicalAnalysis.score * lexicalWeight) +
        (emojiAnalysis.score * emojiWeight) +
        (modelAnalysis.score * modelWeight);
    
    return {
        score: Math.max(-1, Math.min(1, compositeScore)),
        confidence: Math.max(lexicalAnalysis.confidence || 0, emojiAnalysis.confidence || 0)
    };
}

function classifyAdvancedSentiment(score) {
    // Classification plus sensible aux nuances
    if (score > 0.6) return { label: 'très_positif', intensity: 'forte' };
    if (score > 0.2) return { label: 'positif', intensity: 'modérée' };
    if (score > 0.05) return { label: 'légèrement_positif', intensity: 'faible' };
    if (score > -0.05) return { label: 'neutre', intensity: 'nulle' };
    if (score > -0.2) return { label: 'légèrement_négatif', intensity: 'faible' };
    if (score > -0.6) return { label: 'négatif', intensity: 'modérée' };
    return { label: 'très_négatif', intensity: 'forte' };
}

function calculateAdvancedConfidence(lexicalAnalysis, emojiAnalysis, modelAnalysis, processedText) {
    let confidence = 0.2; // Base minimum
    
    // Confiance lexicale
    if (lexicalAnalysis.matchCount > 0) {
        confidence += Math.min(0.4, lexicalAnalysis.matchCount * 0.1);
    }
    
    // Confiance émojis
    if (emojiAnalysis.count > 0) {
        confidence += Math.min(0.2, emojiAnalysis.count * 0.05);
    }
    
    // Bonus longueur de texte
    if (processedText && processedText.length > 20) {
        confidence += 0.1;
    }
    
    // Bonus concordance entre analyses
    const scores = [lexicalAnalysis.score, emojiAnalysis.score, modelAnalysis.score];
    const nonZeroScores = scores.filter(s => Math.abs(s) > 0.1);
    if (nonZeroScores.length > 1) {
        const allSameSign = nonZeroScores.every(s => s > 0) || nonZeroScores.every(s => s < 0);
        if (allSameSign) confidence += 0.2;
    }
    
    return Math.min(0.95, confidence);
}

// ===========================
// ANALYSE THÉMATIQUE CORRIGÉE
// ===========================

async function extractThemes(processedTexts) {
    console.log('🎯 Analyse thématique améliorée...');
    
    if (!processedTexts || processedTexts.length === 0) {
        return { themes: [], totalThemes: 0 };
    }
    
    try {
        // 1. Filtrage des textes valides
        const validTexts = processedTexts.filter(item => 
            item.processed && item.processed.length > 3
        );
        
        if (validTexts.length < 2) {
            return createFallbackTheme(validTexts);
        }
        
        // 2. Extraction TF-IDF améliorée
        const tfidfData = calculateEnhancedTFIDF(validTexts);
        
        // 3. Clustering basé sur la similarité des mots-clés
        const clusters = performSmartClustering(validTexts, tfidfData);
        
        // 4. Génération des thèmes avec métadonnées complètes
        const themes = generateComprehensiveThemes(clusters, tfidfData);
        
        // 5. Extraction des sous-thèmes
        const themesWithSubthemes = await extractSubthemes(themes);
        
        console.log(`✅ ${themesWithSubthemes.length} thèmes identifiés`);
        
        return {
            themes: themesWithSubthemes,
            totalThemes: themesWithSubthemes.length,
            coverage: calculateCoverage(themes, validTexts.length),
            qualityScore: calculateThematicQuality(themes)
        };
        
    } catch (error) {
        console.error('❌ Erreur analyse thématique:', error);
        return createFallbackTheme(processedTexts);
    }
}

function calculateEnhancedTFIDF(texts) {
    console.log('📊 Calcul TF-IDF amélioré...');
    
    const documents = texts.map(t => t.processed);
    const vocabulary = new Set();
    
    // Construction vocabulaire filtré
    documents.forEach(doc => {
        const words = doc.split(/\s+/)
            .filter(word => 
                word.length > 2 && 
                !FRENCH_STOP_WORDS.has(word) &&
                !/^(emoji_|hashtag|mention|url)/.test(word) &&
                !/^\d+$/.test(word)
            );
        words.forEach(word => vocabulary.add(word));
    });
    
    const vocabArray = Array.from(vocabulary);
    const docCount = documents.length;
    
    // Calcul fréquences documents
    const df = new Map();
    vocabArray.forEach(term => {
        let count = 0;
        documents.forEach(doc => {
            if (doc.includes(term)) count++;
        });
        df.set(term, count);
    });
    
    // Calcul TF-IDF par document
    const tfidfVectors = documents.map((doc, docIndex) => {
        const words = doc.split(/\s+/).filter(w => vocabulary.has(w));
        const tf = new Map();
        
        words.forEach(word => {
            tf.set(word, (tf.get(word) || 0) + 1);
        });
        
        const tfidf = new Map();
        tf.forEach((frequency, term) => {
            const termTf = frequency / words.length;
            const termIdf = Math.log(docCount / df.get(term));
            const tfidfScore = termTf * termIdf;
            
            if (tfidfScore > 0.01) { // Seuil minimum pour éviter le bruit
                tfidf.set(term, tfidfScore);
            }
        });
        
        return {
            docIndex: docIndex,
            originalText: texts[docIndex].original,
            processedText: doc,
            tfidf: tfidf,
            topTerms: Array.from(tfidf.entries())
                .sort(([,a], [,b]) => b - a)
                .slice(0, 15) // Plus de mots-clés pour une meilleure similarité
        };
    });
    
    return {
        vectors: tfidfVectors,
        vocabulary: vocabArray,
        documentFrequencies: df
    };
}

function performSmartClustering(texts, tfidfData) {
    console.log('🔗 Clustering intelligent...');
    
    const vectors = tfidfData.vectors;
    const clusters = [];
    const used = new Set();
    const minSimilarity = 0.15; // Seuil plus permissif
    
    // Tri par richesse en mots-clés
    const sortedVectors = vectors.sort((a, b) => b.topTerms.length - a.topTerms.length);
    
    for (let i = 0; i < sortedVectors.length; i++) {
        if (used.has(sortedVectors[i].docIndex)) continue;
        
        const cluster = {
            id: clusters.length,
            documents: [sortedVectors[i]],
            indices: [sortedVectors[i].docIndex],
            sharedTerms: new Map(sortedVectors[i].topTerms)
        };
        
        used.add(sortedVectors[i].docIndex);
        
        // Recherche de documents similaires
        for (let j = i + 1; j < sortedVectors.length; j++) {
            if (used.has(sortedVectors[j].docIndex)) continue;
            
            const similarity = calculateTermSimilarity(
                sortedVectors[i].topTerms,
                sortedVectors[j].topTerms
            );
            
            if (similarity > minSimilarity) {
                cluster.documents.push(sortedVectors[j]);
                cluster.indices.push(sortedVectors[j].docIndex);
                
                // Mise à jour des termes partagés
                sortedVectors[j].topTerms.forEach(([term, score]) => {
                    const existingScore = cluster.sharedTerms.get(term) || 0;
                    cluster.sharedTerms.set(term, existingScore + score);
                });
                
                used.add(sortedVectors[j].docIndex);
            }
        }
        
        // Accepter les clusters même de taille 1 si le contenu est riche
        if (cluster.documents.length >= 1) {
            clusters.push(cluster);
        }
    }
    
    return clusters.sort((a, b) => b.documents.length - a.documents.length);
}

function calculateTermSimilarity(terms1, terms2) {
    const set1 = new Set(terms1.map(([term]) => term));
    const set2 = new Set(terms2.map(([term]) => term));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Similarité de Jaccard pondérée
    return intersection.size / union.size;
}

function generateComprehensiveThemes(clusters, tfidfData) {
    console.log('📝 Génération des thèmes complets...');
    
    return clusters.map((cluster, index) => {
        // 1. Nom du thème basé sur les meilleurs termes
        const topTerms = Array.from(cluster.sharedTerms.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        const themeName = topTerms.length > 0 ? 
            topTerms.map(([term]) => term).join(' & ') : 
            `Thème ${index + 1}`;
        
        // 2. Mots-clés avec scores
        const keywords = Array.from(cluster.sharedTerms.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([word, score]) => ({
                word: word,
                score: Math.round(score * 1000) / 1000,
                frequency: countWordInCluster(word, cluster)
            }));
        
        // 3. Exemples représentatifs
        const examples = cluster.documents
            .sort((a, b) => b.topTerms.length - a.topTerms.length)
            .slice(0, 4)
            .map(doc => doc.originalText);
        
        // 4. Analyse sentiment du thème
        const themeSentiment = analyzeClusterSentiment(cluster.documents);
        
        // 5. Éléments contextuels du thème
        const contextElements = extractClusterContextElements(cluster.documents);
        
        return {
            id: index,
            name: formatThemeName(themeName),
            size: cluster.documents.length,
            percentage: 0, // Calculé après
            
            // Contenu
            keywords: keywords,
            examples: examples,
            
            // Sentiment
            sentimentNet: themeSentiment.net,
            sentimentDistribution: themeSentiment.distribution,
            dominantSentiment: themeSentiment.dominant,
            averageScore: themeSentiment.averageScore,
            
            // Éléments contextuels
            emojis: contextElements.emojis,
            hashtags: contextElements.hashtags,
            mentions: contextElements.mentions,
            
            // Métriques
            coherence: calculateClusterCoherence(cluster),
            quality: calculateThemeQuality(cluster, keywords),
            coverage: cluster.documents.length,
            
            // Données pour debug
            rawTexts: cluster.documents.map(d => d.originalText)
        };
    });
}

function countWordInCluster(word, cluster) {
    let count = 0;
    cluster.documents.forEach(doc => {
        const words = doc.processedText.split(/\s+/);
        count += words.filter(w => w === word).length;
    });
    return count;
}

function analyzeClusterSentiment(documents) {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalScore = 0;
    
    documents.forEach(doc => {
        // Analyse rapide du sentiment
        const lexicalResult = analyzeFrenchLexical(doc.processedText, {});
        const score = lexicalResult.score;
        
        totalScore += score;
        
        if (score > 0.05) positiveCount++;
        else if (score < -0.05) negativeCount++;
        else neutralCount++;
    });
    
    const total = documents.length;
    const averageScore = totalScore / total;
    const sentimentNet = (positiveCount - negativeCount) / total;
    
    let dominant = 'neutral';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
        dominant = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
        dominant = 'negative';
    }
    
    return {
        net: Math.round(sentimentNet * 1000) / 1000,
        averageScore: Math.round(averageScore * 1000) / 1000,
        distribution: {
            positive: Math.round((positiveCount / total) * 100),
            negative: Math.round((negativeCount / total) * 100),
            neutral: Math.round((neutralCount / total) * 100)
        },
        dominant: dominant
    };
}

function extractClusterContextElements(documents) {
    const elements = {
        emojis: new Map(),
        hashtags: new Map(),
        mentions: new Map()
    };
    
    documents.forEach(doc => {
        const text = doc.originalText;
        
        // Extraction des emojis
        const emojis = extractEmojisWithSentiment(text);
        emojis.forEach(emojiData => {
            const key = emojiData.emoji;
            const current = elements.emojis.get(key) || { 
                emoji: key, 
                count: 0, 
                sentiment: emojiData.sentiment 
            };
            current.count += emojiData.count;
            elements.emojis.set(key, current);
        });
        
        // Extraction des hashtags
        const hashtags = extractHashtags(text);
        hashtags.forEach(hashtagData => {
            const key = hashtagData.hashtag;
            const current = elements.hashtags.get(key) || { 
                hashtag: key, 
                count: 0 
            };
            current.count += hashtagData.count;
            elements.hashtags.set(key, current);
        });
        
        // Extraction des mentions
        const mentions = extractMentions(text);
        mentions.forEach(mentionData => {
            const key = mentionData.mention;
            const current = elements.mentions.get(key) || { 
                mention: key, 
                count: 0 
            };
            current.count += mentionData.count;
            elements.mentions.set(key, current);
        });
    });
    
    return {
        emojis: Array.from(elements.emojis.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 15),
        hashtags: Array.from(elements.hashtags.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 15),
        mentions: Array.from(elements.mentions.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    };
}

async function extractSubthemes(themes) {
    console.log('🔍 Extraction des sous-thèmes...');
    
    return themes.map(theme => {
        if (theme.size < 5) {
            // Pas assez de documents pour des sous-thèmes
            return { ...theme, subThemes: [] };
        }
        
        // Analyse des sous-groupes basée sur les mots-clés secondaires
        const subThemes = identifySubThemes(theme.keywords, theme.rawTexts);
        
        return {
            ...theme,
            subThemes: subThemes
        };
    });
}

function identifySubThemes(keywords, texts) {
    // Identification des sous-thèmes basée sur la co-occurrence de mots-clés
    const subThemeMap = new Map();
    
    // Prendre les mots-clés les plus fréquents comme base
    const topKeywords = keywords.slice(0, 8);
    
    texts.forEach(text => {
        const textWords = text.toLowerCase().split(/\s+/);
        const presentKeywords = topKeywords.filter(k => 
            textWords.some(word => word.includes(k.word))
        );
        
        if (presentKeywords.length >= 2) {
            // Créer des combinaisons de mots-clés
            for (let i = 0; i < presentKeywords.length - 1; i++) {
                for (let j = i + 1; j < presentKeywords.length; j++) {
                    const combo = [presentKeywords[i].word, presentKeywords[j].word]
                        .sort()
                        .join(' + ');
                    
                    const current = subThemeMap.get(combo) || {
                        name: combo,
                        keywords: [presentKeywords[i], presentKeywords[j]],
                        texts: [],
                        count: 0
                    };
                    
                    current.texts.push(text);
                    current.count++;
                    subThemeMap.set(combo, current);
                }
            }
        }
    });
    
    // Filtrer et trier les sous-thèmes
    return Array.from(subThemeMap.values())
        .filter(st => st.count >= 2) // Au moins 2 occurrences
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Maximum 5 sous-thèmes
        .map(st => ({
            name: st.name,
            size: st.count,
            keywords: st.keywords.map(k => k.word),
            examples: st.texts.slice(0, 2)
        }));
}

function formatThemeName(name) {
    // Nettoyage et formatage du nom de thème
    return name
        .split(/[&+]/)
        .map(part => part.trim())
        .filter(part => part.length > 0)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' & ');
}

function calculateClusterCoherence(cluster) {
    // Mesure de cohérence basée sur la similarité moyenne des documents
    if (cluster.documents.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < cluster.documents.length - 1; i++) {
        for (let j = i + 1; j < cluster.documents.length; j++) {
            const sim = calculateTermSimilarity(
                cluster.documents[i].topTerms,
                cluster.documents[j].topTerms
            );
            totalSimilarity += sim;
            comparisons++;
        }
    }
    
    return comparisons > 0 ? 
        Math.round((totalSimilarity / comparisons) * 1000) / 1000 : 
        0;
}

function calculateThemeQuality(cluster, keywords) {
    let quality = 50; // Base
    
    // Bonus pour la taille du cluster
    if (cluster.documents.length > 5) quality += 10;
    if (cluster.documents.length > 10) quality += 10;
    
    // Bonus pour la richesse en mots-clés
    if (keywords.length > 10) quality += 15;
    if (keywords.length > 15) quality += 10;
    
    // Bonus pour la cohérence
    const coherence = calculateClusterCoherence(cluster);
    quality += coherence * 25;
    
    return Math.min(100, Math.max(0, quality));
}

function createFallbackTheme(texts) {
    if (texts.length === 0) {
        return { themes: [], totalThemes: 0 };
    }
    
    // Thème unique contenant tous les textes
    const allTexts = texts.map(t => t.original);
    const allWords = texts
        .map(t => t.processed)
        .join(' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !FRENCH_STOP_WORDS.has(w));
    
    const wordCount = new Map();
    allWords.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    const keywords = Array.from(wordCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, score: count, frequency: count }));
    
    return {
        themes: [{
            id: 0,
            name: 'Thème Général',
            size: texts.length,
            percentage: 100,
            keywords: keywords,
            examples: allTexts.slice(0, 3),
            sentimentNet: 0,
            coherence: 1.0,
            quality: 60
        }],
        totalThemes: 1
    };
}

function calculateCoverage(themes, totalTexts) {
    const coveredTexts = themes.reduce((sum, theme) => sum + theme.size, 0);
    return Math.round((coveredTexts / totalTexts) * 100);
}

function calculateThematicQuality(themes) {
    if (themes.length === 0) return 0;
    
    const avgQuality = themes.reduce((sum, theme) => sum + (theme.quality || 0), 0) / themes.length;
    return Math.round(avgQuality);
}

// ===========================
// FONCTIONS UTILITAIRES
// ===========================

async function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            encoding: 'utf8',
            transformHeader: (header) => header.trim(), // Nettoyage des headers
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('⚠️ Erreurs CSV:', results.errors);
                }
                console.log(`✅ ${results.data.length} lignes CSV chargées`);
                resolve(results.data);
            },
            error: (error) => reject(error)
        });
    });
}

async function parseExcel(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Convertir en string pour éviter les problèmes de type
            defval: '' // Valeur par défaut pour les cellules vides
        });
        
        console.log(`✅ ${data.length} lignes Excel chargées`);
        return data;
    } catch (error) {
        throw new Error(`Erreur lecture Excel: ${error.message}`);
    }
}

// ===========================
// EXPORTS
// ===========================

module.exports = {
    preprocessText,
    parseCSV,
    parseExcel,
    analyzeSentiments,
    extractThemes,
    initializeModels,
    
    // Dictionnaires pour les tests/debug
    FRENCH_SENTIMENT_LEXICON,
    FRENCH_INTENSIFIERS,
    PRECISE_EMOJI_SENTIMENT,
    FRENCH_STOP_WORDS
};
