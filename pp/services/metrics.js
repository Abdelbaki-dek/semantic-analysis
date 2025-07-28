// Calcul des métriques détaillées
function calculateMetrics(sentimentResults, thematicResults) {
  const metrics = {
    sentiment: calculateSentimentMetrics(sentimentResults),
    themes: calculateThemeMetrics(thematicResults),
    global: calculateGlobalMetrics(sentimentResults, thematicResults),
    distribution: calculateDistributionMetrics(sentimentResults),
    quality: calculateQualityMetrics(sentimentResults)
  };
  
  return metrics;
}

// Métriques de sentiment
function calculateSentimentMetrics(results) {
  const total = results.length;
  if (total === 0) return null;
  
  // Comptage par sentiment
  const counts = {
    positif: results.filter(r => r.sentiment === 'positif').length,
    négatif: results.filter(r => r.sentiment === 'négatif').length,
    neutre: results.filter(r => r.sentiment === 'neutre').length
  };
  
  // Pourcentages
  const percentages = {
    positif: (counts.positif / total) * 100,
    négatif: (counts.négatif / total) * 100,
    neutre: (counts.neutre / total) * 100
  };
  
  // Scores moyens
  const positiveScores = results.filter(r => r.sentiment === 'positif').map(r => r.score);
  const negativeScores = results.filter(r => r.sentiment === 'négatif').map(r => Math.abs(r.score));
  const neutralScores = results.filter(r => r.sentiment === 'neutre').map(r => r.confidence);
  
  const averageScores = {
    positif: positiveScores.length > 0 ? positiveScores.reduce((a, b) => a + b, 0) / positiveScores.length : 0,
    négatif: negativeScores.length > 0 ? negativeScores.reduce((a, b) => a + b, 0) / negativeScores.length : 0,
    neutre: neutralScores.length > 0 ? neutralScores.reduce((a, b) => a + b, 0) / neutralScores.length : 0
  };
  
  // Score global de sentiment (-1 à 1)
  const globalScore = results.reduce((sum, r) => sum + r.score, 0) / total;
  
  // Confiance moyenne
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;
  
  return {
    total,
    counts,
    percentages: {
      positif: Math.round(percentages.positif * 100) / 100,
      négatif: Math.round(percentages.négatif * 100) / 100,
      neutre: Math.round(percentages.neutre * 100) / 100
    },
    averageScores: {
      positif: Math.round(averageScores.positif * 1000) / 1000,
      négatif: Math.round(averageScores.négatif * 1000) / 1000,
      neutre: Math.round(averageScores.neutre * 1000) / 1000
    },
    globalScore: Math.round(globalScore * 1000) / 1000,
    avgConfidence: Math.round(avgConfidence * 1000) / 1000,
    interpretation: interpretSentimentScore(globalScore)
  };
}

// Métriques des thèmes
function calculateThemeMetrics(thematicResults) {
  if (!thematicResults || !thematicResults.themes) return null;
  
  const themes = thematicResults.themes;
  const totalTexts = themes.reduce((sum, theme) => sum + theme.size, 0);
  
  const metrics = {
    totalThemes: themes.length,
    totalTexts,
    averageThemeSize: totalTexts > 0 ? Math.round((totalTexts / themes.length) * 100) / 100 : 0,
    themeDistribution: themes.map(theme => ({
      name: theme.name,
      size: theme.size,
      percentage: Math.round((theme.size / totalTexts) * 10000) / 100,
      keywords: theme.keywords?.slice(0, 5) || [],
      examples: theme.examples?.slice(0, 2) || []
    })),
    dominantTheme: themes.length > 0 ? {
      name: themes[0].name,
      size: themes[0].size,
      percentage: Math.round((themes[0].size / totalTexts) * 10000) / 100
    } : null
  };
  
  return metrics;
}

// Métriques globales
function calculateGlobalMetrics(sentimentResults, thematicResults) {
  const sentiment = calculateSentimentMetrics(sentimentResults);
  const themes = calculateThemeMetrics(thematicResults);
  
  // Score de diversité thématique (basé sur l'entropie)
  const themeEntropy = themes ? calculateEntropy(themes.themeDistribution.map(t => t.percentage / 100)) : 0;
  
  // Score de polarisation (écart-type des scores de sentiment)
  const scores = sentimentResults.map(r => r.score);
  const polarization = calculateStandardDeviation(scores);
  
  // Score de qualité global
  const qualityScore = calculateQualityScore(sentiment, themes, themeEntropy, polarization);
  
  return {
    overallSentiment: sentiment?.interpretation || 'Non déterminé',
    sentimentScore: sentiment?.globalScore || 0,
    thematicDiversity: Math.round(themeEntropy * 1000) / 1000,
    polarization: Math.round(polarization * 1000) / 1000,
    qualityScore: Math.round(qualityScore * 100) / 100,
    interpretation: {
      sentiment: sentiment?.interpretation || 'Indéterminé',
      diversity: interpretDiversity(themeEntropy),
      polarization: interpretPolarization(polarization),
      quality: interpretQuality(qualityScore)
    }
  };
}

// Métriques de distribution
function calculateDistributionMetrics(results) {
  const scoreRanges = {
    'Très positif (0.7-1.0)': 0,
    'Positif (0.3-0.7)': 0,
    'Légèrement positif (0.1-0.3)': 0,
    'Neutre (-0.1-0.1)': 0,
    'Légèrement négatif (-0.3--0.1)': 0,
    'Négatif (-0.7--0.3)': 0,
    'Très négatif (-1.0--0.7)': 0
  };
  
  results.forEach(result => {
    const score = result.score;
    if (score >= 0.7) scoreRanges['Très positif (0.7-1.0)']++;
    else if (score >= 0.3) scoreRanges['Positif (0.3-0.7)']++;
    else if (score >= 0.1) scoreRanges['Légèrement positif (0.1-0.3)']++;
    else if (score >= -0.1) scoreRanges['Neutre (-0.1-0.1)']++;
    else if (score >= -0.3) scoreRanges['Légèrement négatif (-0.3--0.1)']++;
    else if (score >= -0.7) scoreRanges['Négatif (-0.7--0.3)']++;
    else scoreRanges['Très négatif (-1.0--0.7)']++;
  });
  
  const total = results.length;
  const distribution = Object.entries(scoreRanges).map(([range, count]) => ({
    range,
    count,
    percentage: Math.round((count / total) * 10000) / 100
  }));
  
  return {
    scoreRanges: distribution,
    confidenceDistribution: calculateConfidenceDistribution(results)
  };
}

// Distribution de confiance
function calculateConfidenceDistribution(results) {
  const confidenceRanges = {
    'Très élevée (0.9-1.0)': 0,
    'Élevée (0.7-0.9)': 0,
    'Moyenne (0.5-0.7)': 0,
    'Faible (0.3-0.5)': 0,
    'Très faible (0.0-0.3)': 0
  };
  
  results.forEach(result => {
    const conf = result.confidence;
    if (conf >= 0.9) confidenceRanges['Très élevée (0.9-1.0)']++;
    else if (conf >= 0.7) confidenceRanges['Élevée (0.7-0.9)']++;
    else if (conf >= 0.5) confidenceRanges['Moyenne (0.5-0.7)']++;
    else if (conf >= 0.3) confidenceRanges['Faible (0.3-0.5)']++;
    else confidenceRanges['Très faible (0.0-0.3)']++;
  });
  
  const total = results.length;
  return Object.entries(confidenceRanges).map(([range, count]) => ({
    range,
    count,
    percentage: Math.round((count / total) * 10000) / 100
  }));
}

// Métriques de qualité
function calculateQualityMetrics(results) {
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const highConfidenceCount = results.filter(r => r.confidence >= 0.7).length;
  const lowConfidenceCount = results.filter(r => r.confidence < 0.5).length;
  
  const textLengths = results.map(r => r.text.length);
  const avgTextLength = textLengths.reduce((a, b) => a + b, 0) / textLengths.length;
  const shortTexts = results.filter(r => r.text.length < 20).length;
  
  return {
    averageConfidence: Math.round(avgConfidence * 1000) / 1000,
    highConfidencePercentage: Math.round((highConfidenceCount / results.length) * 10000) / 100,
    lowConfidencePercentage: Math.round((lowConfidenceCount / results.length) * 10000) / 100,
    averageTextLength: Math.round(avgTextLength),
    shortTextsPercentage: Math.round((shortTexts / results.length) * 10000) / 100,
    qualityScore: calculateOverallQuality(avgConfidence, shortTexts / results.length)
  };
}

// Génération des insights
function generateInsights(sentimentResults, thematicResults, metrics) {
  const insights = [];
  
  // Insights sur les sentiments
  if (metrics.sentiment) {
    const sentimentMetrics = metrics.sentiment;
    
    if (sentimentMetrics.percentages.positif > 60) {
      insights.push({
        type: 'positive',
        title: 'Sentiment globalement positif',
        description: `${sentimentMetrics.percentages.positif.toFixed(1)}% des avis sont positifs avec un score moyen de ${sentimentMetrics.averageScores.positif.toFixed(2)}`,
        examples: getExamplesByType(sentimentResults, 'positif', 2),
        priority: 'high'
      });
    }
    
    if (sentimentMetrics.percentages.négatif > 30) {
      insights.push({
        type: 'warning',
        title: 'Proportion notable d\'avis négatifs',
        description: `${sentimentMetrics.percentages.négatif.toFixed(1)}% des avis sont négatifs - attention aux points d'amélioration`,
        examples: getExamplesByType(sentimentResults, 'négatif', 3),
        priority: 'high'
      });
    }
    
    if (sentimentMetrics.avgConfidence < 0.6) {
      insights.push({
        type: 'info',
        title: 'Confiance d\'analyse modérée',
        description: `Confiance moyenne de ${(sentimentMetrics.avgConfidence * 100).toFixed(1)}% - certains avis peuvent être ambigus`,
        priority: 'medium'
      });
    }
  }
  
  // Insights sur les thèmes
  if (metrics.themes && metrics.themes.themeDistribution.length > 0) {
    const topTheme = metrics.themes.themeDistribution[0];
    
    insights.push({
      type: 'info',
      title: 'Thème principal identifié',
      description: `"${topTheme.name}" représente ${topTheme.percentage}% des avis (${topTheme.size} mentions)`,
      examples: topTheme.examples,
      keywords: topTheme.keywords,
      priority: 'medium'
    });
    
    if (metrics.themes.themeDistribution.length > 5) {
      insights.push({
        type: 'info',
        title: 'Grande diversité thématique',
        description: `${metrics.themes.totalThemes} thèmes différents identifiés - richesse du feedback`,
        priority: 'low'
      });
    }
  }
  
  // Insights sur la qualité
  if (metrics.quality) {
    if (metrics.quality.shortTextsPercentage > 20) {
      insights.push({
        type: 'warning',
        title: 'Textes courts détectés',
        description: `${metrics.quality.shortTextsPercentage.toFixed(1)}% des avis sont très courts (< 20 caractères) - précision d'analyse réduite`,
        priority: 'medium'
      });
    }
  }
  
  // Insight global
  insights.push({
    type: 'summary',
    title: 'Résumé exécutif',
    description: generateExecutiveSummary(metrics),
    priority: 'high'
  });
  
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Fonctions utilitaires

function interpretSentimentScore(score) {
  if (score > 0.3) return 'Très positif';
  if (score > 0.1) return 'Positif';
  if (score > -0.1) return 'Neutre';
  if (score > -0.3) return 'Négatif';
  return 'Très négatif';
}

function interpretDiversity(entropy) {
  if (entropy > 2.5) return 'Très diverse';
  if (entropy > 2.0) return 'Diverse';
  if (entropy > 1.5) return 'Modérément diverse';
  return 'Peu diverse';
}

function interpretPolarization(polarization) {
  if (polarization > 0.6) return 'Très polarisée';
  if (polarization > 0.4) return 'Polarisée';
  if (polarization > 0.2) return 'Modérément polarisée';
  return 'Peu polarisée';
}

function interpretQuality(quality) {
  if (quality > 80) return 'Excellente';
  if (quality > 60) return 'Bonne';
  if (quality > 40) return 'Moyenne';
  return 'Faible';
}

function calculateEntropy(probabilities) {
  return -probabilities.reduce((sum, p) => {
    return p > 0 ? sum + p * Math.log2(p) : sum;
  }, 0);
}

function calculateStandardDeviation(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function calculateQualityScore(sentiment, themes, entropy, polarization) {
  let score = 50; // Base
  
  if (sentiment && sentiment.avgConfidence > 0.7) score += 20;
  if (sentiment && sentiment.avgConfidence < 0.5) score -= 15;
  
  if (themes && themes.totalThemes > 3) score += 10;
  if (entropy > 2.0) score += 10;
  
  if (polarization < 0.3) score += 10;
  if (polarization > 0.7) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateOverallQuality(avgConfidence, shortTextRatio) {
  let quality = avgConfidence * 70; // 70% basé sur la confiance
  quality += (1 - shortTextRatio) * 30; // 30% basé sur la longueur des textes
  return Math.round(quality * 100) / 100;
}

function getExamplesByType(results, type, count) {
  return results
    .filter(r => r.sentiment === type)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, count)
    .map(r => ({
      text: r.text,
      score: r.score,
      confidence: r.confidence
    }));
}

function generateExecutiveSummary(metrics) {
  const sentiment = metrics.sentiment;
  const global = metrics.global;
  
  if (!sentiment) return 'Analyse non disponible';
  
  let summary = `Analyse de ${sentiment.total} avis : `;
  summary += `${sentiment.percentages.positif.toFixed(0)}% positifs, `;
  summary += `${sentiment.percentages.négatif.toFixed(0)}% négatifs, `;
  summary += `${sentiment.percentages.neutre.toFixed(0)}% neutres. `;
  
  summary += `Score global : ${global.sentimentScore.toFixed(2)} (${global.overallSentiment}). `;
  
  if (metrics.themes) {
    summary += `${metrics.themes.totalThemes} thèmes identifiés. `;
  }
  
  return summary;
}

module.exports = {
  calculateMetrics,
  generateInsights,
  calculateSentimentMetrics,
  calculateThemeMetrics,
  calculateGlobalMetrics
};