// Sous-thèmes
            subThemes: theme.subThemes || [],
            subThemeCount: (theme.subThemes || []).length,
            
            // Exemples représentatifs
            examples: (theme.examples || []).slice(0, 3)
        };
    });
    
    // Calcul de la diversité thématique (entropie de Shannon)
    const probabilities = themes.map(theme => theme.size / totalTexts);
    const entropy = -probabilities.reduce((sum, p) => {
        return p > 0 ? sum + p * Math.log2(p) : sum;
    }, 0);
    
    // Thème dominant
    const dominantTheme = themes.length > 0 ? {
        name: themes[0].name,
        size: themes[0].size,
        percentage: themes[0].percentage || Math.round((themes[0].size / totalTexts) * 10000) / 100,
        sentimentNet: themes[0].sentimentNet || 0,
        keywords: (themes[0].keywords || []).slice(0, 5).map(k => k.word)
    } : null;
    
    // Analyse de concentration (indice de Herfindahl)
    const herfindahlIndex = probabilities.reduce((sum, p) => sum + p * p, 0);
    const concentration = Math.round(herfindahlIndex * 1000) / 1000;
    
    // Métriques de qualité globale
    const avgQualityScore = themes.reduce((sum, theme) => sum + (theme.quality || 0), 0) / themes.length;
    const avgCoherence = themes.reduce((sum, theme) => sum + (theme.coherence || 0), 0) / themes.length;
    
    // Couverture thématique
    const coverage = thematicResults.coverage || Math.round((totalTexts / totalTexts) * 100);
    
    // Analyse des éléments contextuels globaux
    const globalContextElements = aggregateContextElements(themes);
    
    return {
        // Données de base
        totalThemes: themes.length,
        totalTexts: totalTexts,
        averageThemeSize: Math.round((totalTexts / themes.length) * 100) / 100,
        coverage: coverage,
        
        // Distribution et hiérarchie
        themeDistribution: themeDistribution,
        dominantTheme: dominantTheme,
        
        // Métriques de diversité
        diversity: Math.round(entropy * 1000) / 1000,
        diversityLevel: interpretDiversity(entropy),
        concentration: concentration,
        concentrationLevel: interpretConcentration(concentration),
        
        // Métriques de qualité
        averageQualityScore: Math.round(avgQualityScore),
        averageCoherence: Math.round(avgCoherence * 1000) / 1000,
        qualityLevel: interpretQuality(avgQualityScore),
        
        // Éléments contextuels globaux
        globalEmojis: globalContextElements.emojis.slice(0, 20),
        globalHashtags: globalContextElements.hashtags.slice(0, 20),
        globalMentions: globalContextElements.mentions.slice(0, 15),
        
        // Statistiques des sous-thèmes
        totalSubThemes: themes.reduce((sum, theme) => sum + (theme.subThemes || []).length, 0),
        themesWithSubThemes: themes.filter(theme => (theme.subThemes || []).length > 0).length,
        
        // Données pour visualisations
        chartData: {
            themeDistribution: themeDistribution.map(theme => ({
                name: theme.name,
                size: theme.size,
                percentage: theme.percentage,
                sentimentNet: theme.sentimentNet
            })),
            sentimentByTheme: themeDistribution.map(theme => ({
                theme: theme.name,
                positive: theme.sentimentDistribution.positive || 0,
                negative: theme.sentimentDistribution.negative || 0,
                neutral: theme.sentimentDistribution.neutral || 0,
                net: theme.sentimentNet
            }))
        }
    };
}

function calculateThemeQualityScore(theme) {
    let score = 50; // Base
    
    // Bonus taille du thème
    if (theme.size > 5) score += 10;
    if (theme.size > 10) score += 10;
    if (theme.size > 20) score += 5;
    
    // Bonus richesse des mots-clés
    const keywordCount = (theme.keywords || []).length;
    if (keywordCount > 5) score += 10;
    if (keywordCount > 10) score += 10;
    
    // Bonus cohérence
    if (theme.coherence > 0.5) score += 15;
    if (theme.coherence > 0.7) score += 10;
    
    // Bonus éléments contextuels
    if ((theme.emojis || []).length > 0) score += 5;
    if ((theme.hashtags || []).length > 0) score += 5;
    
    return Math.min(100, Math.max(0, score));
}

function aggregateContextElements(themes) {
    const globalEmojis = new Map();
    const globalHashtags = new Map();
    const globalMentions = new Map();
    
    themes.forEach(theme => {
        // Agrégation des emojis
        (theme.emojis || []).forEach(emoji => {
            const key = emoji.emoji;
            const current = globalEmojis.get(key) || {
                emoji: key,
                count: 0,
                sentiment: emoji.sentiment || 0,
                themes: new Set()
            };
            current.count += emoji.count || 1;
            current.themes.add(theme.name);
            globalEmojis.set(key, current);
        });
        
        // Agrégation des hashtags
        (theme.hashtags || []).forEach(hashtag => {
            const key = hashtag.hashtag || hashtag.tag;
            const current = globalHashtags.get(key) || {
                hashtag: key,
                count: 0,
                themes: new Set()
            };
            current.count += hashtag.count || 1;
            current.themes.add(theme.name);
            globalHashtags.set(key, current);
        });
        
        // Agrégation des mentions
        (theme.mentions || []).forEach(mention => {
            const key = mention.mention;
            const current = globalMentions.get(key) || {
                mention: key,
                count: 0,
                themes: new Set()
            };
            current.count += mention.count || 1;
            current.themes.add(theme.name);
            globalMentions.set(key, current);
        });
    });
    
    return {
        emojis: Array.from(globalEmojis.values())
            .map(item => ({ ...item, themes: Array.from(item.themes) }))
            .sort((a, b) => b.count - a.count),
        hashtags: Array.from(globalHashtags.values())
            .map(item => ({ ...item, themes: Array.from(item.themes) }))
            .sort((a, b) => b.count - a.count),
        mentions: Array.from(globalMentions.values())
            .map(item => ({ ...item, themes: Array.from(item.themes) }))
            .sort((a, b) => b.count - a.count)
    };
}

// ===========================
// MÉTRIQUES GLOBALES ENRICHIES
// ===========================

function calculateEnhancedGlobalMetrics(sentimentResults, thematicResults) {
    const sentimentMetrics = calculateAdvancedSentimentMetrics(sentimentResults);
    const thematicMetrics = calculateAdvancedThematicMetrics(thematicResults);
    
    if (!sentimentMetrics || !thematicMetrics) {
        return {
            overallHealth: 'Données insuffisantes',
            healthScore: 0
        };
    }
    
    // Score de santé globale (0-100)
    let healthScore = 50; // Base neutre
    
    // Impact du sentiment net
    const sentimentNet = sentimentMetrics.sentimentNet || 0;
    if (sentimentNet > 0.3) healthScore += 25;
    else if (sentimentNet > 0.1) healthScore += 15;
    else if (sentimentNet < -0.3) healthScore -= 25;
    else if (sentimentNet < -0.1) healthScore -= 15;
    
    // Impact de la confiance moyenne
    const avgConfidence = sentimentMetrics.avgConfidence || 0;
    if (avgConfidence > 0.7) healthScore += 10;
    else if (avgConfidence < 0.4) healthScore -= 10;
    
    // Impact de la diversité thématique
    const diversity = thematicMetrics.diversity || 0;
    if (diversity > 2.5) healthScore += 10;
    else if (diversity < 1.0) healthScore -= 5;
    
    // Impact de la polarisation
    const polarization = sentimentMetrics.polarization || 0;
    if (polarization > 0.7) healthScore -= 10; // Très polarisé = problématique
    else if (polarization < 0.3) healthScore += 5; // Consensus = bon
    
    healthScore = Math.min(100, Math.max(0, healthScore));
    
    // Calcul des tendances (nécessiterait des données temporelles)
    const trends = calculateTrends(sentimentResults, thematicResults);
    
    // Score d'engagement (basé sur le volume et la diversité)
    const engagementScore = calculateEngagementScore(sentimentResults, thematicMetrics);
    
    return {
        // Santé globale
        healthScore: Math.round(healthScore),
        overallHealth: interpretHealthScore(healthScore),
        
        // Métriques consolidées
        overallSentiment: sentimentMetrics.interpretation,
        sentimentScore: sentimentMetrics.globalScore,
        sentimentNet: sentimentMetrics.sentimentNet,
        
        // Thématiques
        thematicDiversity: thematicMetrics.diversity,
        thematicQuality: thematicMetrics.averageQualityScore,
        dominantTheme: thematicMetrics.dominantTheme,
        
        // Polarisation et consensus
        polarization: sentimentMetrics.polarization,
        polarizationLevel: sentimentMetrics.polarizationLevel,
        
        // Engagement et activité
        engagementScore: engagementScore,
        engagementLevel: interpretEngagement(engagementScore),
        
        // Volume et couverture
        totalVolume: sentimentResults?.length || 0,
        thematicCoverage: thematicMetrics.coverage,
        
        // Tendances (placeholder pour futures implémentations)
        trends: trends,
        
        // Qualité de l'analyse
        analysisQuality: {
            confidence: sentimentMetrics.avgConfidence,
            thematicCoherence: thematicMetrics.averageCoherence,
            coverage: thematicMetrics.coverage,
            overallScore: Math.round((
                (sentimentMetrics.avgConfidence * 100) * 0.4 +
                (thematicMetrics.averageCoherence * 100) * 0.3 +
                (thematicMetrics.coverage) * 0.3
            ))
        },
        
        // Interprétations textuelles
        interpretation: {
            sentiment: sentimentMetrics.interpretation,
            diversity: thematicMetrics.diversityLevel,
            polarization: sentimentMetrics.polarizationLevel,
            quality: thematicMetrics.qualityLevel,
            health: interpretHealthScore(healthScore)
        }
    };
}

function calculateTrends(sentimentResults, thematicResults) {
    // Placeholder pour analyse des tendances temporelles
    // Nécessiterait des timestamps dans les données
    return {
        sentimentTrend: 'stable', // stable, increasing, decreasing
        volumeTrend: 'stable',
        thematicEvolution: 'stable',
        emergingThemes: [],
        decliningThemes: []
    };
}

function calculateEngagementScore(sentimentResults, thematicMetrics) {
    if (!sentimentResults || !thematicMetrics) return 0;
    
    let score = 0;
    
    // Volume d'activité
    const volume = sentimentResults.length;
    if (volume > 100) score += 30;
    else if (volume > 50) score += 20;
    else if (volume > 20) score += 10;
    
    // Diversité thématique
    const diversity = thematicMetrics.diversity || 0;
    score += Math.min(25, diversity * 10);
    
    // Présence d'éléments contextuels
    const hasEmojis = (thematicMetrics.globalEmojis || []).length > 0;
    const hasHashtags = (thematicMetrics.globalHashtags || []).length > 0;
    const hasMentions = (thematicMetrics.globalMentions || []).length > 0;
    
    if (hasEmojis) score += 15;
    if (hasHashtags) score += 15;
    if (hasMentions) score += 15;
    
    return Math.min(100, score);
}

// ===========================
// MÉTRIQUES DE DISTRIBUTION DÉTAILLÉES
// ===========================

function calculateDetailedDistributionMetrics(results) {
    if (!results || results.length === 0) {
        return { scoreRanges: [], confidenceDistribution: [] };
    }
    
    // Distribution des scores avec plages plus précises
    const scoreRanges = calculateAdvancedScoreDistribution(results);
    
    // Distribution de confiance
    const confidenceDistribution = calculateConfidenceDistribution(results);
    
    // Distribution par intensité
    const intensityDistribution = calculateIntensityDistribution(results);
    
    return {
        scoreRanges: scoreRanges,
        confidenceDistribution: confidenceDistribution,
        intensityDistribution: intensityDistribution,
        
        // Statistiques descriptives
        statistics: {
            scoreStats: calculateDescriptiveStats(results.map(r => r.score || 0)),
            confidenceStats: calculateDescriptiveStats(results.map(r => r.confidence || 0))
        }
    };
}

function calculateAdvancedScoreDistribution(results) {
    const ranges = [
        { label: 'Très positif', min: 0.6, max: 1.0, color: '#059669' },
        { label: 'Positif', min: 0.2, max: 0.6, color: '#10B981' },
        { label: 'Légèrement positif', min: 0.05, max: 0.2, color: '#34D399' },
        { label: 'Neutre', min: -0.05, max: 0.05, color: '#F59E0B' },
        { label: 'Légèrement négatif', min: -0.2, max: -0.05, color: '#FB923C' },
        { label: 'Négatif', min: -0.6, max: -0.2, color: '#F87171' },
        { label: 'Très négatif', min: -1.0, max: -0.6, color: '#DC2626' }
    ];
    
    const distribution = ranges.map(range => {
        const count = results.filter(r => {
            const score = r.score || 0;
            return score >= range.min && score < range.max;
        }).length;
        
        return {
            range: `${range.label} (${range.min.toFixed(2)} à ${range.max.toFixed(2)})`,
            label: range.label,
            count: count,
            percentage: Math.round((count / results.length) * 10000) / 100,
            color: range.color
        };
    });
    
    return distribution;
}

function calculateConfidenceDistribution(results) {
    const ranges = [
        { label: 'Très élevée', min: 0.8, max: 1.0 },
        { label: 'Élevée', min: 0.6, max: 0.8 },
        { label: 'Moyenne', min: 0.4, max: 0.6 },
        { label: 'Faible', min: 0.2, max: 0.4 },
        { label: 'Très faible', min: 0.0, max: 0.2 }
    ];
    
    return ranges.map(range => {
        const count = results.filter(r => {
            const confidence = r.confidence || 0;
            return confidence >= range.min && confidence < range.max;
        }).length;
        
        return {
            range: `${range.label} (${range.min.toFixed(1)}-${range.max.toFixed(1)})`,
            label: range.label,
            count: count,
            percentage: Math.round((count / results.length) * 10000) / 100
        };
    });
}

function calculateIntensityDistribution(results) {
    const intensities = ['forte', 'modérée', 'faible', 'nulle'];
    
    return intensities.map(intensity => {
        const count = results.filter(r => r.intensity === intensity).length;
        
        return {
            intensity: intensity,
            count: count,
            percentage: Math.round((count / results.length) * 10000) / 100
        };
    });
}

function calculateDescriptiveStats(values) {
    if (values.length === 0) return {};
    
    const sorted = values.sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    // Écart-type
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Quartiles
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    return {
        mean: Math.round(mean * 1000) / 1000,
        median: Math.round(median * 1000) / 1000,
        min: Math.round(min * 1000) / 1000,
        max: Math.round(max * 1000) / 1000,
        stdDev: Math.round(stdDev * 1000) / 1000,
        q1: Math.round(q1 * 1000) / 1000,
        q3: Math.round(q3 * 1000) / 1000,
        range: Math.round((max - min) * 1000) / 1000
    };
}

// ===========================
// MÉTRIQUES CONTEXTUELLES
// ===========================

function calculateContextualMetrics(sentimentResults, thematicResults) {
    const contextMetrics = {
        emojis: analyzeEmojiUsage(sentimentResults, thematicResults),
        hashtags: analyzeHashtagUsage(thematicResults),
        mentions: analyzeMentionUsage(thematicResults),
        textQuality: analyzeTextQuality(sentimentResults)
    };
    
    return contextMetrics;
}

function analyzeEmojiUsage(sentimentResults, thematicResults) {
    const allEmojis = new Map();
    let totalEmojiCount = 0;
    
    // Collecte depuis les résultats de sentiment
    (sentimentResults || []).forEach(result => {
        if (result.features && result.features.emojis) {
            result.features.emojis.forEach(emoji => {
                const key = emoji.emoji;
                const current = allEmojis.get(key) || {
                    emoji: key,
                    count: 0,
                    sentiment: emoji.sentiment || 0,
                    contexts: []
                };
                current.count += emoji.count || 1;
                current.contexts.push(result.sentiment);
                allEmojis.set(key, current);
                totalEmojiCount += emoji.count || 1;
            });
        }
    });
    
    // Collecte depuis les thèmes
    if (thematicResults && thematicResults.themes) {
        thematicResults.themes.forEach(theme => {
            (theme.emojis || []).forEach(emoji => {
                const key = emoji.emoji;
                const current = allEmojis.get(key) || {
                    emoji: key,
                    count: 0,
                    sentiment: emoji.sentiment || 0,
                    contexts: []
                };
                current.count += emoji.count || 1;
                current.contexts.push(`theme:${theme.name}`);
                allEmojis.set(key, current);
            });
        });
    }
    
    const topEmojis = Array.from(allEmojis.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
    
    return {
        totalUniqueEmojis: allEmojis.size,
        totalEmojiUsage: totalEmojiCount,
        averageEmojisPerText: totalEmojiCount / (sentimentResults?.length || 1),
        topEmojis: topEmojis,
        sentimentBreakdown: {
            positive: topEmojis.filter(e => e.sentiment > 0.1).length,
            negative: topEmojis.filter(e => e.sentiment < -0.1).length,
            neutral: topEmojis.filter(e => Math.abs(e.sentiment) <= 0.1).length
        }
    };
}

function analyzeHashtagUsage(thematicResults) {
    const allHashtags = new Map();
    
    if (thematicResults && thematicResults.themes) {
        thematicResults.themes.forEach(theme => {
            (theme.hashtags || []).forEach(hashtag => {
                const key = hashtag.hashtag || hashtag.tag;
                const current = allHashtags.get(key) || {
                    hashtag: key,
                    count: 0,
                    themes: new Set()
                };
                current.count += hashtag.count || 1;
                current.themes.add(theme.name);
                allHashtags.set(key, current);
            });
        });
    }
    
    const topHashtags = Array.from(allHashtags.values())
        .map(item => ({ ...item, themes: Array.from(item.themes) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25);
    
    return {
        totalUniqueHashtags: allHashtags.size,
        topHashtags: topHashtags,
        crossThemeHashtags: topHashtags.filter(h => h.themes.length > 1)
    };
}

function analyzeMentionUsage(thematicResults) {
    const allMentions = new Map();
    
    if (thematicResults && thematicResults.themes) {
        thematicResults.themes.forEach(theme => {
            (theme.mentions || []).forEach(mention => {
                const key = mention.mention;
                const current = allMentions.get(key) || {
                    mention: key,
                    count: 0,
                    themes: new Set()
                };
                current.count += mention.count || 1;
                current.themes.add(theme.name);
                allMentions.set(key, current);
            });
        });
    }
    
    const topMentions = Array.from(allMentions.values())
        .map(item => ({ ...item, themes: Array.from(item.themes) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    
    return {
        totalUniqueMentions: allMentions.size,
        topMentions: topMentions,
        influentialMentions: topMentions.filter(m => m.count > 1)
    };
}

function analyzeTextQuality(sentimentResults) {
    if (!sentimentResults || sentimentResults.length === 0) {
        return { averageLength: 0, qualityDistribution: {} };
    }
    
    const lengths = sentimentResults.map(r => (r.text || '').length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    
    const qualityRanges = {
        'Très court (< 20 chars)': lengths.filter(l => l < 20).length,
        'Court (20-50 chars)': lengths.filter(l => l >= 20 && l < 50).length,
        'Moyen (50-150 chars)': lengths.filter(l => l >= 50 && l < 150).length,
        'Long (150-300 chars)': lengths.filter(l => l >= 150 && l < 300).length,
        'Très long (> 300 chars)': lengths.filter(l => l >= 300).length
    };
    
    const total = sentimentResults.length;
    const qualityDistribution = {};
    Object.entries(qualityRanges).forEach(([range, count]) => {
        qualityDistribution[range] = {
            count: count,
            percentage: Math.round((count / total) * 100)
        };
    });
    
    return {
        averageLength: Math.round(avgLength),
        minLength: Math.min(...lengths),
        maxLength: Math.max(...lengths),
        qualityDistribution: qualityDistribution
    };
}

// ===========================
// MÉTRIQUES DE QUALITÉ COMPLÈTES
// ===========================

function calculateComprehensiveQualityMetrics(sentimentResults, thematicResults) {
    const sentimentQuality = assessSentimentQuality(sentimentResults);
    const thematicQuality = assessThematicQuality(thematicResults);
    const overallQuality = calculateOverallQuality(sentimentQuality, thematicQuality);
    
    return {
        sentiment: sentimentQuality,
        thematic: thematicQuality,
        overall: overallQuality,
        recommendations: generateQualityRecommendations(sentimentQuality, thematicQuality)
    };
}

function assessSentimentQuality(results) {
    if (!results || results.length === 0) {
        return { score: 0, level: 'Aucune donnée' };
    }
    
    let score = 50; // Base
    
    // Qualité basée sur la confiance
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
    score += avgConfidence * 30;
    
    // Pénalité pour trop de résultats neutres (signe de mauvaise analyse)
    const neutralCount = results.filter(r => r.sentiment === 'neutre').length;
    const neutralRatio = neutralCount / results.length;
    if (neutralRatio > 0.7) score -= 20;
    else if (neutralRatio < 0.3) score += 10;
    
    // Bonus pour diversité des sentiments
    const sentimentTypes = new Set(results.map(r => r.sentiment));
    if (sentimentTypes.size > 4) score += 10;
    
    return {
        score: Math.round(Math.min(100, Math.max(0, score))),
        level: interpretQuality(score),
        avgConfidence: Math.round(avgConfidence * 1000) / 1000,
        neutralRatio: Math.round(neutralRatio * 100),
        sentimentDiversity: sentimentTypes.size
    };
}

function assessThematicQuality(thematicResults) {
    if (!thematicResults || !thematicResults.themes || thematicResults.themes.length === 0) {
        return { score: 0, level: 'Aucun thème' };
    }
    
    const themes = thematicResults.themes;
    let score = 50; // Base
    
    // Bonus pour nombre approprié de thèmes
    if (themes.length >= 3 && themes.length <= 15) score += 15;
    else if (themes.length < 3) score -= 10;
    else if (themes.length > 20) score -= 5;
    
    // Qualité moyenne des thèmes
    const avgThemeQuality = themes.reduce((sum, theme) => sum + (theme.quality || 0), 0) / themes.length;
    score += (avgThemeQuality / 100) * 25;
    
    // Cohérence moyenne
    const avgCoherence = themes.reduce((sum, theme) => sum + (theme.coherence || 0), 0) / themes.length;
    score += avgCoherence * 20;
    
    // Bonus pour sous-thèmes
    const themesWithSubThemes = themes.filter(theme => (theme.subThemes || []).length > 0).length;
    if (themesWithSubThemes > 0) score += 10;
    
    return {
        score: Math.round(Math.min(100, Math.max(0, score))),
        level: interpretQuality(score),
        themeCount: themes.length,
        avgThemeQuality: Math.round(avgThemeQuality),
        avgCoherence: Math.round(avgCoherence * 1000) / 1000,
        subThemeRatio: Math.round((themesWithSubThemes / themes.length) * 100)
    };
}

function calculateOverallQuality(sentimentQuality, thematicQuality) {
    const overallScore = (sentimentQuality.score * 0.6) + (thematicQuality.score * 0.4);
    
    return {
        score: Math.round(overallScore),
        level: interpretQuality(overallScore),
        components: {
            sentiment: sentimentQuality.score,
            thematic: thematicQuality.score
        }
    };
}

function generateQualityRecommendations(sentimentQuality, thematicQuality) {
    const recommendations = [];
    
    if (sentimentQuality.avgConfidence < 0.6) {
        recommendations.push({
            type: 'sentiment',
            priority: 'high',
            title: 'Améliorer la confiance d\'analyse',
            description: 'La confiance moyenne est faible, considérer des textes de meilleure qualité ou un préprocessing avancé',
            actions: ['Filtrer les textes trop courts', 'Améliorer le nettoyage des données', 'Vérifier la langue des textes']
        });
    }
    
    if (sentimentQuality.neutralRatio > 70) {
        recommendations.push({
            type: 'sentiment',
            priority: 'medium',
            title: 'Trop de résultats neutres',
            description: 'Un grand nombre de textes sont classés comme neutres, ce qui peut indiquer un problème d\'analyse',
            actions: ['Ajuster les seuils de classification', 'Vérifier la pertinence du lexique de sentiment', 'Analyser les textes neutres manuellement']
        });
    }
    
    if (thematicQuality.themeCount < 3) {
        recommendations.push({
            type: 'thematic',
            priority: 'high',
            title: 'Insuffisance thématique',
            description: 'Très peu de thèmes identifiés, la diversité du corpus est faible',
            actions: ['Augmenter la taille du corpus', 'Ajuster les paramètres de clustering', 'Vérifier la diversité des sources']
        });
    }
    
    if (thematicQuality.avgCoherence < 0.5) {
        recommendations.push({
            type: 'thematic',
            priority: 'medium',
            title: 'Faible cohérence thématique',
            description: 'Les thèmes identifiés manquent de cohérence interne',
            actions: ['Améliorer le préprocessing', 'Ajuster les seuils de similarité', 'Filtrer les mots-clés non pertinents']
        });
    }
    
    if (thematicQuality.subThemeRatio < 20) {
        recommendations.push({
            type: 'thematic',
            priority: 'low',
            title: 'Peu de sous-thèmes identifiés',
            description: 'L\'analyse pourrait bénéficier d\'une granularité plus fine',
            actions: ['Ajuster les paramètres de sous-clustering', 'Analyser les thèmes principaux plus en détail']
        });
    }
    
    return recommendations;
}

// ===========================
// GÉNÉRATION D'INSIGHTS AVANCÉS
// ===========================

function generateInsights(sentimentResults, thematicResults, metrics) {
    console.log('💡 Génération d\'insights avancés...');
    
    const insights = [];
    
    // 1. Insights sur le sentiment global
    addSentimentInsights(insights, metrics.sentiment, sentimentResults);
    
    // 2. Insights thématiques
    addAdvancedThematicInsights(insights, metrics.themes, thematicResults);
    
    // 3. Insights contextuels (emojis, hashtags, mentions)
    addContextualInsights(insights, metrics.contextual);
    
    // 4. Insights de qualité et fiabilité
    addQualityInsights(insights, metrics.quality);
    
    // 5. Insights comparatifs et opportunités
    addStrategicInsights(insights, metrics);
    
    // 6. Alerts et signaux faibles
    addAlertInsights(insights, metrics);
    
    // Tri par priorité et pertinence
    return insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

function addSentimentInsights(insights, sentimentMetrics, sentimentResults) {
    if (!sentimentMetrics) return;
    
    const sentimentNet = sentimentMetrics.sentimentNet || 0;
    const polarization = sentimentMetrics.polarization || 0;
    
    // Insight principal sur le sentiment net
    if (sentimentNet > 0.4) {
        insights.push({
            type: 'positive',
            title: 'Excellence du sentiment global',
            description: `Sentiment net exceptionnel de ${(sentimentNet * 100).toFixed(1)}% avec ${sentimentMetrics.percentages.positif}% d'avis positifs`,
            priority: 'high',
            impact: 'high',
            examples: getTopSentimentExamples(sentimentResults, 'positive', 2),
            metrics: {
                sentimentNet: sentimentNet,
                positiveRatio: sentimentMetrics.percentages.positif,
                confidence: sentimentMetrics.avgConfidence
            },
            recommendations: [
                'Capitaliser sur cette image positive dans la communication',
                'Identifier les facteurs de succès pour les maintenir',
                'Utiliser ces témoignages comme références clients'
            ]
        });
    } else if (sentimentNet > 0.1) {
        insights.push({
            type: 'positive',
            title: 'Sentiment globalement favorable',
            description: `Sentiment net positif de ${(sentimentNet * 100).toFixed(1)}% - tendance encourageante`,
            priority: 'medium',
            impact: 'medium',
            examples: getTopSentimentExamples(sentimentResults, 'positive', 2),
            recommendations: [
                'Maintenir les bonnes pratiques identifiées',
                'Surveiller l\'évolution pour conserver cette tendance positive'
            ]
        });
    } else if (sentimentNet < -0.3) {
        insights.push({
            type: 'warning',
            title: 'Alerte : Sentiment majoritairement négatif',
            description: `Sentiment net critique de ${(sentimentNet * 100).toFixed(1)}% avec ${sentimentMetrics.percentages.négatif}% d'avis négatifs`,
            priority: 'high',
            impact: 'high',
            examples: getTopSentimentExamples(sentimentResults, 'negative', 3),
            metrics: {
                sentimentNet: sentimentNet,
                negativeRatio: sentimentMetrics.percentages.négatif,
                averageNegativeScore: sentimentMetrics.averageScores.négatif
            },
            recommendations: [
                'Analyser en urgence les causes des retours négatifs',
                'Mettre en place un plan d\'action correctif immédiat',
                'Communiquer sur les améliorations prévues',
                'Suivre quotidiennement l\'évolution du sentiment'
            ]
        });
    } else if (sentimentNet < -0.1) {
        insights.push({
            type: 'warning',
            title: 'Sentiment négatif à surveiller',
            description: `Sentiment net défavorable de ${(sentimentNet * 100).toFixed(1)}% - action recommandée`,
            priority: 'medium',
            impact: 'medium',
            examples: getTopSentimentExamples(sentimentResults, 'negative', 2),
            recommendations: [
                'Identifier les points d\'amélioration prioritaires',
                'Renforcer la communication sur les actions prises'
            ]
        });
    }
    
    // Insight sur la polarisation
    if (polarization > 0.7) {
        insights.push({
            type: 'info',
            title: 'Opinions très polarisées',
            description: `Forte polarisation détectée (${polarization.toFixed(2)}) - les avis sont très tranchés`,
            priority: 'medium',
            impact: 'medium',
            metrics: { polarization: polarization },
            recommendations: [
                'Segmenter l\'analyse par groupes d\'utilisateurs',
                'Identifier les facteurs de division',
                'Adapter la communication selon les segments',
                'Chercher des consensus sur les points neutres'
            ]
        });
    }
    
    // Insight sur la qualité de l'analyse
    if (sentimentMetrics.avgConfidence < 0.5) {
        insights.push({
            type: 'info',
            title: 'Confiance d\'analyse modérée',
            description: `Confiance moyenne de ${(sentimentMetrics.avgConfidence * 100).toFixed(1)}% - certains textes sont ambigus`,
            priority: 'low',
            impact: 'low',
            recommendations: [
                'Améliorer la qualité des textes source',
                'Considérer une validation manuelle sur un échantillon'
            ]
        });
    }
}

function addAdvancedThematicInsights(insights, thematicMetrics, thematicResults) {
    if (!thematicMetrics || !thematicResults) return;
    
    const themes = thematicMetrics.themeDistribution || [];
    const dominantTheme = thematicMetrics.dominantTheme;
    
    // Insight sur le thème dominant
    if (dominantTheme && dominantTheme.percentage > 30) {
        insights.push({
            type: 'info',
            title: 'Thème ultra-dominant identifié',
            description: `"${dominantTheme.name}" représente ${dominantTheme.percentage}% du corpus (${dominantTheme.size} mentions) avec un sentiment net de ${(dominantTheme.sentimentNet * 100).toFixed(1)}%`,
            priority: 'high',
            impact: 'high',
            themeData: dominantTheme,
            recommendations: dominantTheme.sentimentNet > 0.2 ? [
                'Capitaliser sur ce point fort dans la stratégie',
                'Mettre en avant ce thème dans la communication',
                'Maintenir l\'excellence sur ce domaine'
            ] : dominantTheme.sentimentNet < -0.2 ? [
                'Traiter en priorité les problèmes de ce thème majeur',
                'Allouer des ressources spécifiques à ce domaine',
                'Communiquer sur les améliorations prévues'
            ] : [
                'Analyser plus finement ce thème central',
                'Identifier les opportunités d\'amélioration'
            ]
        });
    }
    
    // Insights sur les thèmes à fort sentiment négatif
    const negativeThemes = themes.filter(t => t.sentimentNet < -0.3).slice(0, 3);
    negativeThemes.forEach(theme => {
        insights.push({
            type: 'warning',
            title: `Problème critique sur "${theme.name}"`,
            description: `Sentiment net très négatif de ${(theme.sentimentNet * 100).toFixed(1)}% sur ${theme.size} mentions`,
            priority: 'high',
            impact: 'high',
            themeData: theme,
            examples: theme.examples ? theme.examples.slice(0, 2) : [],
            keywords: theme.keywords ? theme.keywords.slice(0, 5).map(k => k.word) : [],
            recommendations: [
                `Analyser en détail les retours négatifs sur "${theme.name}"`,
                'Mettre en place des actions correctives spécifiques',
                'Suivre l\'évolution de ce thème dans le temps',
                'Communiquer de manière proactive sur les améliorations'
            ]
        });
    });
    
    // Insights sur les thèmes très positifs
    const positiveThemes = themes.filter(t => t.sentimentNet > 0.4).slice(0, 2);
    positiveThemes.forEach(theme => {
        insights.push({
            type: 'positive',
            title: `Point fort exceptionnel : "${theme.name}"`,
            description: `Sentiment net excellent de ${(theme.sentimentNet * 100).toFixed(1)}% sur ${theme.size} mentions`,
            priority: 'medium',
            impact: 'medium',
            themeData: theme,
            examples: theme.examples ? theme.examples.slice(0, 2) : [],
            keywords: theme.keywords ? theme.keywords.slice(0, 5).map(k => k.word) : [],
            recommendations: [
                `Capitaliser sur l'excellence de "${theme.name}"`,
                'Utiliser ces témoignages positifs en communication',
                'Maintenir et renforcer ces bonnes pratiques',
                'Étendre ces succès à d\'autres domaines'
            ]
        });
    });
    
    // Insight sur la diversité thématique
    if (thematicMetrics.diversity > 3.0) {
        insights.push({
            type: 'info',
            title: 'Très grande diversité thématique',
            description: `Diversité exceptionnelle (${thematicMetrics.diversity.toFixed(2)}) avec ${themes.length} thèmes distincts`,
            priority: 'medium',
            impact: 'medium',
            recommendations: [
                'Prioriser les thèmes selon leur impact business',
                'Créer une stratégie différenciée par thème',
                'Surveiller l\'émergence de nouveaux sujets'
            ]
        });
    } else if (thematicMetrics.diversity < 1.5) {
        insights.push({
            type: 'info',
            title: 'Faible diversité thématique',
            description: `Diversité limitée (${thematicMetrics.diversity.toFixed(2)}) - concentration sur quelques sujets`,
            priority: 'low',
            impact: 'medium',
            recommendations: [
                'Analyser si cette concentration est normale',
                'Explorer d\'autres sources pour plus de diversité',
                'Identifier les sujets émergents potentiels'
            ]
        });
    }
    
    // Insights sur les sous-thèmes
    const themesWithSubThemes = themes.filter(t => (t.subThemes || []).length > 0);
    if (themesWithSubThemes.length > 0) {
        insights.push({
            type: 'info',
            title: 'Richesse des sous-thématiques',
            description: `${themesWithSubThemes.length} thèmes avec sous-catégories identifiées`,
            priority: 'low',
            impact: 'low',
            details: themesWithSubThemes.map(t => ({
                theme: t.name,
                subThemeCount: t.subThemes.length,
                subThemes: t.subThemes.map(st => st.name)
            })),
            recommendations: [
                'Approfondir l\'analyse des sous-thèmes prioritaires',
                'Développer des actions spécifiques par sous-catégorie'
            ]
        });
    }
}

function addContextualInsights(insights, contextualMetrics) {
    if (!contextualMetrics) return;
    
    // Insights sur les emojis
    if (contextualMetrics.emojis && contextualMetrics.emojis.topEmojis.length > 0) {
        const topEmojis = contextualMetrics.emojis.topEmojis.slice(0, 5);
        const sentimentBreakdown = contextualMetrics.emojis.sentimentBreakdown;
        
        if (sentimentBreakdown.negative > sentimentBreakdown.positive) {
            insights.push({
                type: 'warning',
                title: 'Prédominance d\'emojis négatifs',
                description: `${sentimentBreakdown.negative} emojis négatifs vs ${sentimentBreakdown.positive} positifs dans le top usage`,
                priority: 'medium',
                impact: 'medium',
                details: { topEmojis: topEmojis, breakdown: sentimentBreakdown },
                recommendations: [
                    'Analyser les contextes d\'usage des emojis négatifs',
                    'Surveiller l\'évolution émotionnelle des conversations'
                ]
            });
        } else if (sentimentBreakdown.positive > sentimentBreakdown.negative * 2) {
            insights.push({
                type: 'positive',
                title: 'Climat émotionnel très positif',
                description: `${sentimentBreakdown.positive} emojis positifs dominent largement les conversations`,
                priority: 'low',
                impact: 'medium',
                details: { topEmojis: topEmojis, breakdown: sentimentBreakdown },
                recommendations: [
                    'Capitaliser sur cette positivité émotionnelle',
                    'Encourager cette dynamique dans les interactions'
                ]
            });
        }
    }
    
    // Insights sur les hashtags
    if (contextualMetrics.hashtags && contextualMetrics.hashtags.topHashtags.length > 0) {
        const crossThemeHashtags = contextualMetrics.hashtags.crossThemeHashtags || [];
        
        if (crossThemeHashtags.length > 0) {
            insights.push({
                type: 'info',
                title: 'Hashtags transversaux identifiés',
                description: `${crossThemeHashtags.length} hashtags apparaissent dans plusieurs thèmes`,
                priority: 'low',
                impact: 'medium',
                details: { crossThemeHashtags: crossThemeHashtags.slice(0, 5) },
                recommendations: [
                    'Utiliser ces hashtags pour des campagnes transversales',
                    'Monitorer leur évolution pour détecter les tendances'
                ]
            });
        }
    }
    
    // Insights sur les mentions
    if (contextualMetrics.mentions && contextualMetrics.mentions.influentialMentions.length > 0) {
        insights.push({
            type: 'info',
            title: 'Acteurs influents identifiés',
            description: `${contextualMetrics.mentions.influentialMentions.length} comptes mentionnés plusieurs fois`,
            priority: 'medium',
            impact: 'medium',
            details: { topMentions: contextualMetrics.mentions.topMentions.slice(0, 5) },
            recommendations: [
                'Analyser l\'influence de ces comptes',
                'Considérer des partenariats ou collaborations',
                'Surveiller leur perception de votre marque'
            ]
        });
    }
}

function addQualityInsights(insights, qualityMetrics) {
    if (!qualityMetrics) return;
    
    const overallScore = qualityMetrics.overall.score;
    
    if (overallScore < 60) {
        insights.push({
            type: 'warning',
            title: 'Qualité d\'analyse à améliorer',
            description: `Score de qualité global de ${overallScore}/100 - fiabilité des résultats limitée`,
            priority: 'medium',
            impact: 'high',
            details: qualityMetrics.overall.components,
            recommendations: qualityMetrics.recommendations.map(r => r.description)
        });
    }
    
    // Recommandations spécifiques de qualité
    const highPriorityRecs = qualityMetrics.recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
        insights.push({
            type: 'info',
            title: 'Améliorations prioritaires identifiées',
            description: `${highPriorityRecs.length} recommandations de haute priorité pour améliorer l'analyse`,
            priority: 'medium',
            impact: 'medium',
            recommendations: highPriorityRecs.map(r => r.description)
        });
    }
}

function addStrategicInsights(insights, metrics) {
    const sentiment = metrics.sentiment;
    const themes = metrics.themes;
    const global = metrics.global;
    
    if (!sentiment || !themes || !global) return;
    
    // Insight sur la santé globale
    const healthScore = global.healthScore || 0;
    
    if (healthScore >= 80) {
        insights.push({
            type: 'positive',
            title: 'Excellence de la perception globale',
            description: `Score de santé exceptionnel de ${healthScore}/100 - position très favorable`,
            priority: 'high',
            impact: 'high',
            metrics: { healthScore, sentimentNet: sentiment.sentimentNet, themeCount: themes.totalThemes },
            recommendations: [
                'Maintenir cette excellence opérationnelle',
                'Utiliser cette position pour des initiatives ambitieuses',
                'Surveiller les indicateurs pour détecter tout changement'
            ]
        });
    } else if (healthScore < 40) {
        insights.push({
            type: 'warning',
            title: 'Situation critique nécessitant une action immédiate',
            description: `Score de santé faible de ${healthScore}/100 - risques élevés`,
            priority: 'high',
            impact: 'high',
            metrics: { healthScore, sentimentNet: sentiment.sentimentNet, themeCount: themes.totalThemes },
            recommendations: [
                'Déclencher un plan de redressement immédiat',
                'Prioriser les actions sur les thèmes les plus négatifs',
                'Communiquer de manière proactive sur les améliorations'
            ]
        });
    }
    
    // Insight sur l'engagement
    const engagementScore = global.engagementScore || 0;
    
    if (engagementScore > 80) {
        insights.push({
            type: 'positive',
            title: 'Très fort niveau d\'engagement',
            description: `Score d\'engagement de ${engagementScore}/100 - communauté très active`,
            priority: 'medium',
            impact: 'high',
            recommendations: [
                'Capitaliser sur cet engagement pour des initiatives collaboratives',
                'Créer des programmes de fidélisation',
                'Encourager le bouche-à-oreille positif'
            ]
        });
    } else if (engagementScore < 30) {
        insights.push({
            type: 'info',
            title: 'Engagement limité à développer',
            description: `Score d\'engagement de ${engagementScore}/100 - potentiel d\'amélioration`,
            priority: 'medium',
            impact: 'medium',
            recommendations: [
                'Développer des stratégies d\'activation de la communauté',
                'Améliorer l\'interactivité et la réactivité',
                'Créer du contenu plus engageant'
            ]
        });
    }
}

function addAlertInsights(insights, metrics) {
    // Détection de signaux faibles et alertes
    
    const sentiment = metrics.sentiment;
    const themes = metrics.themes;
    
    if (!sentiment || !themes) return;
    
    // Alerte si dégradation rapide potentielle
    if (sentiment.sentimentNet < 0 && sentiment.polarization > 0.6) {
        insights.push({
            type: 'alert',
            title: '⚠️ Signal d\'alarme : Sentiment négatif ET polarisé',
            description: 'Combinaison critique de sentiment négatif et de forte polarisation',
            priority: 'high',
            impact: 'high',
            metrics: {
                sentimentNet: sentiment.sentimentNet,
                polarization: sentiment.polarization
            },
            recommendations: [
                'Surveillance renforcée requise',
                'Analyse d\'urgence des causes de polarisation',
                'Plan de communication de crise à préparer'
            ]
        });
    }
    
    // Alerte sur concentration thématique extrême
    if (themes.dominantTheme && themes.dominantTheme.percentage > 60) {
        insights.push({
            type: 'alert',
            title: '📊 Concentration thématique extrême',
            description: `Plus de 60% du corpus concentré sur "${themes.dominantTheme.name}"`,
            priority: 'medium',
            impact: 'medium',
            recommendations: [
                'Vérifier si cette concentration est normale',
                'Élargir la collecte de données si nécessaire',
                'Surveiller les autres sujets émergents'
            ]
        });
    }
    
    // Alerte qualité des données
    if (metrics.quality && metrics.quality.overall.score < 50) {
        insights.push({
            type: 'alert',
            title: '🔍 Qualité des données préoccupante',
            description: 'La fiabilité de l\'analyse est compromise par la qualité des données',
            priority: 'high',
            impact: 'high',
            recommendations: [
                'Audit complet de la qualité des données',
                'Amélioration des processus de collecte',
                'Validation manuelle sur un échantillon'
            ]
        });
    }
}

// ===========================
// FONCTIONS UTILITAIRES
// ===========================

function getTopSentimentExamples(results, type, count) {
    if (!results || results.length === 0) return [];
    
    let filtered = [];
    
    if (type === 'positive') {
        filtered = results.filter(r => r.score > 0.3).sort((a, b) => b.score - a.score);
    } else if (type === 'negative') {
        filtered = results.filter(r => r.score < -0.3).sort((a, b) => a.score - b.score);
    }
    
    return filtered.slice(0, count).map(r => ({
        text: r.text,
        score: r.score,
        confidence: r.confidence,
        sentiment: r.sentiment
    }));
}

function interpretSentimentScore(score) {
    if (score > 0.4) return 'Très positif';
    if (score > 0.1) return 'Positif';
    if (score > -0.1) return 'Neutre';
    if (score > -0.4) return 'Négatif';
    return 'Très négatif';
}

function interpretPolarization(polarization) {
    if (polarization > 0.7) return 'Très polarisée';
    if (polarization > 0.5) return 'Polarisée';
    if (polarization > 0.3) return 'Modérément polarisée';
    return 'Peu polarisée';
}

function interpretDiversity(entropy) {
    if (entropy > 3.0) return 'Très diverse';
    if (entropy > 2.5) return 'Diverse';
    if (entropy > 2.0) return 'Modérément diverse';
    if (entropy > 1.5) return 'Peu diverse';
    return 'Très peu diverse';
}

function interpretConcentration(concentration) {
    if (concentration > 0.5) return 'Très concentrée';
    if (concentration > 0.3) return 'Concentrée';
    if (concentration > 0.2) return 'Modérément concentrée';
    return 'Bien répartie';
}

function interpretQuality(score) {
    if (score >= 80) return 'Excellente';
    if (score >= 65) return 'Bonne';
    if (score >= 50) return 'Moyenne';
    if (score >= 35) return 'Faible';
    return 'Très faible';
}

function interpretHealthScore(score) {
    if (score >= 80) return 'Excellente santé';
    if (score >= 65) return 'Bonne santé';
    if (score >= 50) return 'Santé moyenne';
    if (score >= 35) return 'Santé préoccupante';
    return 'Situation critique';
}

function interpretEngagement(score) {
    if (score >= 80) return 'Très fort';
    if (score >= 60) return 'Fort';
    if (score >= 40) return 'Modéré';
    if (score >= 20) return 'Faible';
    return 'Très faible';
}

// ===========================
// EXPORTS
// ===========================

module.exports = {
    calculateMetrics,
    generateInsights,
    calculateAdvancedSentimentMetrics,
    calculateAdvancedThematicMetrics,
    calculateEnhancedGlobalMetrics,
    calculateDetailedDistributionMetrics,
    calculateContextualMetrics,
    calculateComprehensiveQualityMetrics
};// ===========================
// MÉTRIQUES CORRIGÉES ET ENRICHIES
// ===========================

// Calcul des métriques complètes avec vrais résultats
function calculateMetrics(sentimentResults, thematicResults) {
    console.log('📊 Calcul des métriques complètes...');
    
    const metrics = {
        sentiment: calculateAdvancedSentimentMetrics(sentimentResults),
        themes: calculateAdvancedThematicMetrics(thematicResults),
        global: calculateEnhancedGlobalMetrics(sentimentResults, thematicResults),
        distribution: calculateDetailedDistributionMetrics(sentimentResults),
        contextual: calculateContextualMetrics(sentimentResults, thematicResults),
        quality: calculateComprehensiveQualityMetrics(sentimentResults, thematicResults)
    };
    
    console.log('✅ Métriques calculées avec succès');
    return metrics;
}

// ===========================
// MÉTRIQUES DE SENTIMENT AVANCÉES
// ===========================

function calculateAdvancedSentimentMetrics(results) {
    if (!results || results.length === 0) {
        return {
            total: 0,
            sentimentNet: 0,
            globalScore: 0,
            avgConfidence: 0,
            message: 'Aucune donnée de sentiment disponible'
        };
    }
    
    const total = results.length;
    console.log(`📊 Analyse de ${total} résultats de sentiment`);
    
    // Comptage détaillé par catégorie
    const detailedCounts = {
        très_positif: results.filter(r => r.sentiment === 'très_positif').length,
        positif: results.filter(r => r.sentiment === 'positif').length,
        légèrement_positif: results.filter(r => r.sentiment === 'légèrement_positif').length,
        neutre: results.filter(r => r.sentiment === 'neutre').length,
        légèrement_négatif: results.filter(r => r.sentiment === 'légèrement_négatif').length,
        négatif: results.filter(r => r.sentiment === 'négatif').length,
        très_négatif: results.filter(r => r.sentiment === 'très_négatif').length
    };
    
    // Regroupement pour compatibilité
    const simpleCounts = {
        positif: detailedCounts.très_positif + detailedCounts.positif + detailedCounts.légèrement_positif,
        négatif: detailedCounts.très_négatif + detailedCounts.négatif + detailedCounts.légèrement_négatif,
        neutre: detailedCounts.neutre
    };
    
    // Calcul du Sentiment Net (métrique clé pour social listening)
    const sentimentNet = (simpleCounts.positif - simpleCounts.négatif) / total;
    
    // Pourcentages précis
    const percentages = {
        positif: Math.round((simpleCounts.positif / total) * 10000) / 100,
        négatif: Math.round((simpleCounts.négatif / total) * 10000) / 100,
        neutre: Math.round((simpleCounts.neutre / total) * 10000) / 100
    };
    
    // Pourcentages détaillés
    const detailedPercentages = {};
    Object.entries(detailedCounts).forEach(([sentiment, count]) => {
        detailedPercentages[sentiment] = Math.round((count / total) * 10000) / 100;
    });
    
    // Scores moyens par catégorie
    const positiveResults = results.filter(r => r.score > 0);
    const negativeResults = results.filter(r => r.score < 0);
    const neutralResults = results.filter(r => Math.abs(r.score) <= 0.05);
    
    const averageScores = {
        positif: positiveResults.length > 0 ? 
            Math.round((positiveResults.reduce((sum, r) => sum + r.score, 0) / positiveResults.length) * 1000) / 1000 : 0,
        négatif: negativeResults.length > 0 ? 
            Math.round((negativeResults.reduce((sum, r) => sum + Math.abs(r.score), 0) / negativeResults.length) * 1000) / 1000 : 0,
        neutre: neutralResults.length > 0 ? 
            Math.round((neutralResults.reduce((sum, r) => sum + r.confidence, 0) / neutralResults.length) * 1000) / 1000 : 0
    };
    
    // Score global de sentiment
    const globalScore = results.reduce((sum, r) => sum + r.score, 0) / total;
    
    // Confiance moyenne
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / total;
    
    // Écart-type (polarisation)
    const mean = globalScore;
    const variance = results.reduce((sum, r) => sum + Math.pow(r.score - mean, 2), 0) / total;
    const polarization = Math.sqrt(variance);
    
    // Métriques de distribution
    const scoreDistribution = calculateScoreDistribution(results);
    
    // Métriques de qualité
    const highConfidenceCount = results.filter(r => (r.confidence || 0) >= 0.7).length;
    const lowConfidenceCount = results.filter(r => (r.confidence || 0) < 0.4).length;
    
    return {
        // Données de base
        total,
        counts: simpleCounts,
        detailedCounts,
        percentages,
        detailedPercentages,
        
        // Métriques clés
        sentimentNet: Math.round(sentimentNet * 1000) / 1000,
        globalScore: Math.round(globalScore * 1000) / 1000,
        avgConfidence: Math.round(avgConfidence * 1000) / 1000,
        polarization: Math.round(polarization * 1000) / 1000,
        
        // Scores détaillés
        averageScores,
        scoreDistribution,
        
        // Métriques de qualité
        qualityMetrics: {
            highConfidencePercentage: Math.round((highConfidenceCount / total) * 100),
            lowConfidencePercentage: Math.round((lowConfidenceCount / total) * 100),
            averageConfidence: avgConfidence
        },
        
        // Interprétation
        interpretation: interpretSentimentScore(globalScore),
        polarizationLevel: interpretPolarization(polarization),
        
        // Données pour graphiques
        chartData: {
            pieChart: [
                { label: 'Positif', value: simpleCounts.positif, color: '#10B981' },
                { label: 'Négatif', value: simpleCounts.négatif, color: '#EF4444' },
                { label: 'Neutre', value: simpleCounts.neutre, color: '#F59E0B' }
            ],
            detailedChart: Object.entries(detailedCounts).map(([sentiment, count]) => ({
                label: sentiment.replace('_', ' '),
                value: count,
                percentage: detailedPercentages[sentiment]
            }))
        }
    };
}

function calculateScoreDistribution(results) {
    const ranges = {
        'Très positif (0.6-1.0)': { min: 0.6, max: 1.0, count: 0 },
        'Positif (0.2-0.6)': { min: 0.2, max: 0.6, count: 0 },
        'Légèrement positif (0.05-0.2)': { min: 0.05, max: 0.2, count: 0 },
        'Neutre (-0.05-0.05)': { min: -0.05, max: 0.05, count: 0 },
        'Légèrement négatif (-0.2--0.05)': { min: -0.2, max: -0.05, count: 0 },
        'Négatif (-0.6--0.2)': { min: -0.6, max: -0.2, count: 0 },
        'Très négatif (-1.0--0.6)': { min: -1.0, max: -0.6, count: 0 }
    };
    
    results.forEach(result => {
        const score = result.score || 0;
        
        Object.entries(ranges).forEach(([range, config]) => {
            if (score >= config.min && score < config.max) {
                config.count++;
            }
        });
    });
    
    const total = results.length;
    return Object.entries(ranges).map(([range, config]) => ({
        range,
        count: config.count,
        percentage: Math.round((config.count / total) * 10000) / 100
    }));
}

// ===========================
// MÉTRIQUES THÉMATIQUES AVANCÉES
// ===========================

function calculateAdvancedThematicMetrics(thematicResults) {
    if (!thematicResults || !thematicResults.themes || thematicResults.themes.length === 0) {
        return {
            totalThemes: 0,
            coverage: 0,
            message: 'Aucun thème identifié'
        };
    }
    
    const themes = thematicResults.themes;
    const totalTexts = themes.reduce((sum, theme) => sum + theme.size, 0);
    
    console.log(`🎯 Analyse de ${themes.length} thèmes couvrant ${totalTexts} textes`);
    
    // Distribution thématique enrichie
    const themeDistribution = themes.map((theme, index) => {
        // Calcul du sentiment net du thème
        const themeSentimentNet = theme.sentimentNet || 0;
        
        // Métriques de qualité du thème
        const qualityScore = theme.quality || calculateThemeQualityScore(theme);
        
        // Volume et part de voix
        const shareOfVoice = Math.round((theme.size / totalTexts) * 10000) / 100;
        
        return {
            id: theme.id || index,
            name: theme.name,
            size: theme.size,
            percentage: theme.percentage || shareOfVoice,
            shareOfVoice: shareOfVoice,
            
            // Sentiment du thème
            sentimentNet: Math.round(themeSentimentNet * 1000) / 1000,
            sentimentDistribution: theme.sentimentDistribution || { positive: 0, negative: 0, neutral: 100 },
            dominantSentiment: theme.dominantSentiment || 'neutral',
            
            // Métriques avancées
            qualityScore: Math.round(qualityScore),
            coherence: theme.coherence || 0,
            keywords: theme.keywords || [],
            keywordCount: (theme.keywords || []).length,
            
            // Éléments contextuels
            emojiCount: (theme.emojis || []).length,
            hashtagCount: (theme.hashtags || []).length,
            mentionCount: (theme.mentions || []).length,
            
            // Sous-thèmes
            subThemes: theme.subThemes || [],
