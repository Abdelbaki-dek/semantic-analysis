import React, { useState, useMemo } from 'react';

const Insights = ({ insights, themes, metrics, emojis, hashtags }) => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [expandedThemes, setExpandedThemes] = useState(new Set());
  const [filterType, setFilterType] = useState('all'); // all, positive, warning, info, alert
  const [sortBy, setSortBy] = useState('priority'); // priority, impact, type

  // Traitement et enrichissement des insights
  const processedInsights = useMemo(() => {
    if (!insights || insights.length === 0) return [];
    
    return insights
      .map((insight, index) => ({
        ...insight,
        id: insight.id || index,
        impact: insight.impact || 'medium',
        actionable: insight.recommendations && insight.recommendations.length > 0,
        hasData: !!(insight.examples || insight.metrics || insight.themeData)
      }))
      .filter(insight => {
        if (filterType === 'all') return true;
        return insight.type === filterType;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        } else if (sortBy === 'impact') {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return (impactOrder[b.impact] || 1) - (impactOrder[a.impact] || 1);
        } else if (sortBy === 'type') {
          return a.type.localeCompare(b.type);
        }
        return 0;
      });
  }, [insights, filterType, sortBy]);

  // Métriques globales pour le résumé
  const globalMetrics = useMemo(() => {
    if (!metrics) return null;
    
    return {
      sentimentNet: metrics.sentiment?.sentimentNet || 0,
      totalThemes: metrics.themes?.totalThemes || 0,
      healthScore: metrics.global?.healthScore || 0,
      totalVolume: metrics.sentiment?.total || 0,
      qualityScore: metrics.quality?.overall?.score || 0
    };
  }, [metrics]);

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          🔍 Insights & Recommandations
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-gray-500 text-lg mb-4">Aucun insight disponible pour cette analyse</p>
          <p className="text-gray-400 text-sm">
            Les insights seront générés automatiquement une fois l'analyse des sentiments et des thèmes terminée.
          </p>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type) => {
    const icons = {
      positive: '✅',
      warning: '⚠️',
      alert: '🚨',
      info: 'ℹ️',
      summary: '📊'
    };
    return icons[type] || '💡';
  };

  const getInsightColor = (type) => {
    const colors = {
      positive: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      alert: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      summary: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getPriorityBadge = (priority, impact) => {
    const badges = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const impactIcons = {
      high: '🔥',
      medium: '📈',
      low: '📊'
    };
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[priority] || badges.low}`}>
          {priority ? `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority` : 'Standard'}
        </span>
        <span className="text-lg" title={`Impact ${impact}`}>
          {impactIcons[impact] || '📊'}
        </span>
      </div>
    );
  };

  const toggleThemeExpansion = (themeIndex) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeIndex)) {
      newExpanded.delete(themeIndex);
    } else {
      newExpanded.add(themeIndex);
    }
    setExpandedThemes(newExpanded);
  };

  return (
    <div className="space-y-8">
      {/* Résumé Exécutif */}
      {globalMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 text-blue-900 flex items-center">
            📊 Résumé Exécutif
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className={`text-3xl font-bold ${globalMetrics.sentimentNet > 0 ? 'text-green-600' : globalMetrics.sentimentNet < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                {(globalMetrics.sentimentNet * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Sentiment Net</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {globalMetrics.totalVolume.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avis Analysés</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {globalMetrics.totalThemes}
              </div>
              <div className="text-sm text-gray-600 mt-1">Thèmes Identifiés</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className={`text-3xl font-bold ${globalMetrics.healthScore > 70 ? 'text-green-600' : globalMetrics.healthScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {globalMetrics.healthScore}/100
              </div>
              <div className="text-sm text-gray-600 mt-1">Score de Santé</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className={`text-3xl font-bold ${globalMetrics.qualityScore > 70 ? 'text-green-600' : globalMetrics.qualityScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {globalMetrics.qualityScore}/100
              </div>
              <div className="text-sm text-gray-600 mt-1">Qualité Analyse</div>
            </div>
          </div>

          {/* Message principal basé sur les métriques */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🎯 Message Clé :</h3>
            <p className="text-gray-700">
              {globalMetrics.sentimentNet > 0.3 ? 
                `Excellente perception avec un sentiment net de ${(globalMetrics.sentimentNet * 100).toFixed(1)}%. Capitalisez sur cette image positive.` :
               globalMetrics.sentimentNet < -0.3 ?
                `Situation critique avec un sentiment net de ${(globalMetrics.sentimentNet * 100).toFixed(1)}%. Actions urgentes requises.` :
                `Sentiment mitigé (${(globalMetrics.sentimentNet * 100).toFixed(1)}%). Analysez les thèmes pour identifier les opportunités d'amélioration.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Contrôles de filtrage */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            🔍 Insights & Recommandations ({processedInsights.length})
          </h2>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les insights</option>
              <option value="positive">✅ Positifs</option>
              <option value="warning">⚠️ Avertissements</option>
              <option value="alert">🚨 Alertes</option>
              <option value="info">ℹ️ Informatifs</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="priority">Trier par priorité</option>
              <option value="impact">Trier par impact</option>
              <option value="type">Trier par type</option>
            </select>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          {processedInsights.map((insight, index) => (
            <div
              key={insight.id || index}
              className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                getInsightColor(insight.type)
              } ${selectedInsight === index ? 'ring-2 ring-blue-300 shadow-lg' : ''}`}
              onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
            >
              {/* En-tête de l'insight */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 break-words">
                      {insight.title}
                    </h3>
                    <p className="text-sm opacity-90 break-words">
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  {getPriorityBadge(insight.priority, insight.impact)}
                  <div className="text-sm opacity-60">
                    {selectedInsight === index ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {/* Métriques rapides si disponibles */}
              {insight.metrics && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs">
                  {Object.entries(insight.metrics).map(([key, value]) => (
                    <div key={key} className="bg-white bg-opacity-50 px-2 py-1 rounded">
                      <span className="font-medium">{key}:</span> {
                        typeof value === 'number' ? 
                          (key.includes('percentage') || key.includes('Net') ? 
                            `${(value * 100).toFixed(1)}%` : 
                            value.toFixed(2)
                          ) : 
                          value
                      }
                    </div>
                  ))}
                </div>
              )}

              {/* Détails expandables */}
              {selectedInsight === index && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-in">
                  {/* Recommandations prioritaires */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="bg-white bg-opacity-70 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        🎯 Actions Recommandées :
                      </h4>
                      <ul className="space-y-2">
                        {insight.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start text-sm">
                            <span className="text-blue-600 mr-2 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Données du thème si disponibles */}
                  {insight.themeData && (
                    <div className="bg-white bg-opacity-70 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        📊 Données du Thème "{insight.themeData.name}" :
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between">
                            <span>Volume:</span>
                            <span className="font-medium">{insight.themeData.size} avis</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Part de voix:</span>
                            <span className="font-medium">{insight.themeData.percentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sentiment Net:</span>
                            <span className={`font-medium ${insight.themeData.sentimentNet > 0 ? 'text-green-600' : insight.themeData.sentimentNet < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {(insight.themeData.sentimentNet * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          {insight.themeData.keywords && (
                            <div>
                              <span className="text-gray-600">Mots-clés principaux:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {insight.themeData.keywords.slice(0, 5).map((keyword, kwIndex) => (
                                  <span key={kwIndex} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                    {typeof keyword === 'string' ? keyword : keyword.word || keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exemples d'avis */}
                  {insight.examples && insight.examples.length > 0 && (
                    <div className="bg-white bg-opacity-70 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        💬 Exemples d'avis représentatifs :
                      </h4>
                      <div className="space-y-3">
                        {insight.examples.slice(0, 3).map((example, exIndex) => (
                          <div key={exIndex} className="bg-gray-50 rounded-lg p-3 border">
                            <blockquote className="text-sm italic mb-2 text-gray-700">
                              "{typeof example === 'string' ? example : example.text}"
                            </blockquote>
                            {typeof example === 'object' && (
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Score: {example.score?.toFixed(2) || 'N/A'}</span>
                                <span>Confiance: {example.confidence ? (example.confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
                                <span>Sentiment: {example.sentiment || 'N/A'}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mots-clés contextuels */}
                  {insight.keywords && insight.keywords.length > 0 && (
                    <div className="bg-white bg-opacity-70 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        🔤 Mots-clés associés :
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.keywords.slice(0, 10).map((keyword, kwIndex) => (
                          <span key={kwIndex} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white border">
                            {typeof keyword === 'string' ? keyword : keyword.word}
                            {keyword.frequency && (
                              <span className="ml-1 opacity-60">({keyword.frequency})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plan d'action spécifique selon le type */}
                  {insight.type === 'warning' && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        ⚡ Plan d'Action Immédiat :
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
                        <div>
                          <strong>Court terme (0-2 semaines) :</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Audit des points négatifs identifiés</li>
                            <li>• Communication proactive avec les clients</li>
                            <li>• Mise en place de mesures correctives</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Moyen terme (1-3 mois) :</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Suivi de l'évolution du sentiment</li>
                            <li>• Formation des équipes concernées</li>
                            <li>• Optimisation des processus</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {insight.type === 'positive' && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        🚀 Opportunités à Saisir :
                      </h4>
                      <div className="text-sm text-green-700 space-y-2">
                        <p><strong>Amplification :</strong> Utiliser ces points forts dans la stratégie marketing et communication</p>
                        <p><strong>Benchmarking :</strong> Documenter les bonnes pratiques pour les reproduire</p>
                        <p><strong>Témoignages :</strong> Solliciter des avis clients pour renforcer la crédibilité</p>
                        <p><strong>Innovation :</strong> S'appuyer sur ces succès pour développer de nouvelles offres</p>
                      </div>
                    </div>
                  )}

                  {insight.type === 'alert' && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2 flex items-center">
                        🚨 Actions d'Urgence Requises :
                      </h4>
                      <div className="text-sm text-red-700 space-y-2">
                        <p><strong>Immédiat :</strong> Activation de la cellule de crise et communication d'urgence</p>
                        <p><strong>24h :</strong> Analyse approfondie des causes et plan de redressement</p>
                        <p><strong>Semaine :</strong> Mise en œuvre des correctifs et communication transparente</p>
                        <p><strong>Suivi :</strong> Surveillance quotidienne des indicateurs de sentiment</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {processedInsights.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500">Aucun insight ne correspond aux filtres sélectionnés</p>
          </div>
        )}
      </div>

      {/* Analyse Thématique Détaillée */}
      {themes && themes.themes && themes.themes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🎯 Analyse Thématique Approfondie
          </h2>

          <div className="space-y-4">
            {themes.themes.slice(0, 8).map((theme, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* En-tête du thème */}
                <div
                  className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 cursor-pointer flex items-center justify-between hover:from-gray-100 hover:to-blue-100 transition-colors"
                  onClick={() => toggleThemeExpansion(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {theme.name}
                      </h3>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mt-1">
                        <span>{theme.size} avis • {theme.percentage}% du corpus</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (theme.sentimentNet || 0) > 0.2 ? 'bg-green-100 text-green-800' :
                          (theme.sentimentNet || 0) < -0.2 ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          Sentiment Net: {((theme.sentimentNet || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Indicateur visuel du sentiment */}
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (theme.sentimentNet || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.abs((theme.sentimentNet || 0) * 100)}%`,
                            marginLeft: (theme.sentimentNet || 0) < 0 ? `${100 - Math.abs((theme.sentimentNet || 0) * 100)}%` : '0'
                          }}
                        ></div>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {theme.size}
                      </span>
                    </div>
                    
                    <div className="text-gray-400">
                      {expandedThemes.has(index) ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* Contenu expandable */}
                {expandedThemes.has(index) && (
                  <div className="p-6 border-t bg-white">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Colonne gauche: Mots-clés et métriques */}
                      <div className="space-y-4">
                        {/* Mots-clés du thème */}
                        {theme.keywords && theme.keywords.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-gray-700 flex items-center">
                              🔤 Mots-clés principaux ({theme.keywords.length}) :
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {theme.keywords.slice(0, 12).map((keyword, kwIndex) => (
                                <span
                                  key={kwIndex}
                                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  {typeof keyword === 'string' ? keyword : keyword.word}
                                  {keyword.frequency && (
                                    <span className="ml-1.5 bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                      {keyword.frequency}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Métriques du thème */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-3 text-gray-700">📊 Métriques :</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Volume:</span>
                              <div className="font-bold text-blue-600">{theme.size} avis</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Part de voix:</span>
                              <div className="font-bold text-purple-600">{theme.percentage}%</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Cohérence:</span>
                              <div className="font-bold text-green-600">
                                {theme.coherence ? (theme.coherence * 100).toFixed(0) + '%' : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Qualité:</span>
                              <div className="font-bold text-orange-600">
                                {theme.quality ? theme.quality + '/100' : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Distribution des sentiments pour ce thème */}
                        {theme.sentimentDistribution && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium mb-3 text-gray-700">💭 Distribution des sentiments :</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-700">Positifs:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 h-2 bg-gray-200 rounded">
                                    <div 
                                      className="h-2 bg-green-500 rounded"
                                      style={{ width: `${theme.sentimentDistribution.positive || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{theme.sentimentDistribution.positive || 0}%</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-red-700">Négatifs:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 h-2 bg-gray-200 rounded">
                                    <div 
                                      className="h-2 bg-red-500 rounded"
                                      style={{ width: `${theme.sentimentDistribution.negative || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{theme.sentimentDistribution.negative || 0}%</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-yellow-700">Neutres:</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 h-2 bg-gray-200 rounded">
                                    <div 
                                      className="h-2 bg-yellow-500 rounded"
                                      style={{ width: `${theme.sentimentDistribution.neutral || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{theme.sentimentDistribution.neutral || 0}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Colonne droite: Exemples et éléments contextuels */}
                      <div className="space-y-4">
                        {/* Exemples d'avis pour ce thème */}
                        {theme.examples && theme.examples.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-gray-700 flex items-center">
                              💬 Exemples d'avis ({theme.examples.length}) :
                            </h4>
                            <div className="space-y-3">
                              {theme.examples.slice(0, 3).map((example, exIndex) => (
                                <div key={exIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors">
                                  <blockquote className="text-sm text-gray-700 mb-2 italic">
                                    "{typeof example === 'string' ? example : example.text || example}"
                                  </blockquote>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Exemple {exIndex + 1}</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      Représentatif
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sous-thèmes */}
                        {theme.subThemes && theme.subThemes.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-gray-700 flex items-center">
                              🔍 Sous-thèmes identifiés ({theme.subThemes.length}) :
                            </h4>
                            <div className="space-y-2">
                              {theme.subThemes.map((subTheme, subIndex) => (
                                <div key={subIndex} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-medium text-blue-800 text-sm">
                                        {subTheme.name}
                                      </h5>
                                      {subTheme.keywords && (
                                        <div className="mt-1">
                                          <span className="text-xs text-blue-600">Mots-clés: </span>
                                          <span className="text-xs text-blue-700">
                                            {subTheme.keywords.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                      {subTheme.size || subTheme.count} avis
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Éléments contextuels du thème */}
                        <div className="grid grid-cols-1 gap-3">
                          {/* Emojis du thème */}
                          {theme.emojis && theme.emojis.length > 0 && (
                            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                              <h5 className="font-medium text-yellow-800 text-sm mb-2">
                                😊 Emojis associés:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {theme.emojis.slice(0, 8).map((emoji, emoIndex) => (
                                  <span key={emoIndex} className="inline-flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded text-sm">
                                    <span>{emoji.emoji}</span>
                                    <span className="text-xs text-yellow-700">({emoji.count})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Hashtags du thème */}
                          {theme.hashtags && theme.hashtags.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <h5 className="font-medium text-green-800 text-sm mb-2">
                                # Hashtags populaires:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {theme.hashtags.slice(0, 5).map((hashtag, hashIndex) => (
                                  <span key={hashIndex} className="inline-flex items-center space-x-1 bg-green-100 px-2 py-1 rounded text-sm">
                                    <span>{hashtag.hashtag || hashtag.tag}</span>
                                    <span className="text-xs text-green-700">({hashtag.count})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mentions du thème */}
                          {theme.mentions && theme.mentions.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                              <h5 className="font-medium text-purple-800 text-sm mb-2">
                                @ Mentions fréquentes:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {theme.mentions.slice(0, 4).map((mention, mentIndex) => (
                                  <span key={mentIndex} className="inline-flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded text-sm">
                                    <span>{mention.mention}</span>
                                    <span className="text-xs text-purple-700">({mention.count})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommandations spécifiques au thème */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
                        🎯 Recommandations pour "{theme.name}" :
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong className="text-indigo-700">Actions prioritaires :</strong>
                          <ul className="mt-1 space-y-1 text-indigo-600">
                            {(theme.sentimentNet || 0) > 0.2 ? (
                              <>
                                <li>• Capitaliser sur ce point fort</li>
                                <li>• Documenter les bonnes pratiques</li>
                                <li>• Utiliser en communication</li>
                              </>
                            ) : (theme.sentimentNet || 0) < -0.2 ? (
                              <>
                                <li>• Analyser les causes des problèmes</li>
                                <li>• Plan d'action correctif urgent</li>
                                <li>• Suivi rapproché des améliorations</li>
                              </>
                            ) : (
                              <>
                                <li>• Approfondir l'analyse de ce thème</li>
                                <li>• Identifier les opportunités</li>
                                <li>• Optimiser l'expérience client</li>
                              </>
                            )}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-indigo-700">Suivi recommandé :</strong>
                          <ul className="mt-1 space-y-1 text-indigo-600">
                            <li>• Monitoring continu du sentiment</li>
                            <li>• Analyse des sous-thèmes émergents</li>
                            <li>• Benchmark avec la concurrence</li>
                            <li>• Feedback client proactif</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Résumé thématique global */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold mb-4 text-gray-800 flex items-center">
              📊 Vue d'Ensemble Thématique
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {themes.themes.length}
                </div>
                <div className="text-sm text-gray-600 mb-1">Thèmes identifiés</div>
                <div className="text-xs text-gray-500">
                  {themes.themes.filter(t => (t.sentimentNet || 0) > 0.1).length} positifs, {' '}
                  {themes.themes.filter(t => (t.sentimentNet || 0) < -0.1).length} négatifs
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {themes.themes.reduce((sum, t) => sum + (t.subThemes?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 mb-1">Sous-thèmes détectés</div>
                <div className="text-xs text-gray-500">
                  Granularité: {(themes.themes.reduce((sum, t) => sum + (t.subThemes?.length || 0), 0) / themes.themes.length).toFixed(1)} par thème
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {themes.themes.length > 0 ? 
                    Math.round(themes.themes.reduce((sum, t) => sum + t.size, 0) / themes.themes.length) : 0}
                </div>
                <div className="text-sm text-gray-600 mb-1">Avis par thème (moyenne)</div>
                <div className="text-xs text-gray-500">
                  Couverture: {themes.coverage || 0}% du corpus
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="text-sm text-gray-700">
                <strong>💡 Insight Stratégique:</strong> {' '}
                {themes.themes.filter(t => (t.sentimentNet || 0) > 0.2).length > themes.themes.filter(t => (t.sentimentNet || 0) < -0.2).length ?
                  "La majorité des thèmes ont un sentiment positif. Excellente opportunité de capitaliser sur ces forces." :
                  themes.themes.filter(t => (t.sentimentNet || 0) < -0.2).length > themes.themes.filter(t => (t.sentimentNet || 0) > 0.2).length ?
                  "Plusieurs thèmes présentent des sentiments négatifs. Actions correctives prioritaires recommandées." :
                  "Répartition équilibrée des sentiments. Analyse fine nécessaire pour optimiser chaque thème."
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan d'Action Stratégique Global */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
        <h2 className="text-xl font-bold mb-4 text-indigo-900 flex items-center">
          🎯 Plan d'Action Stratégique Global
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              ✅ Opportunités à Saisir (Actions Positives)
            </h3>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-green-400 pl-3">
                <div className="font-medium text-green-700">Communication & Marketing</div>
                <div className="text-green-600">Amplifier les points forts identifiés dans vos campagnes</div>
              </div>
              <div className="border-l-4 border-green-400 pl-3">
                <div className="font-medium text-green-700">Innovation Produit</div>
                <div className="text-green-600">S'appuyer sur les thèmes positifs pour développer de nouvelles offres</div>
              </div>
              <div className="border-l-4 border-green-400 pl-3">
                <div className="font-medium text-green-700">Fidélisation Client</div>
                <div className="text-green-600">Utiliser les témoignages positifs pour renforcer l'engagement</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center">
              ⚠️ Défis à Relever (Actions Correctives)
            </h3>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-red-400 pl-3">
                <div className="font-medium text-red-700">Amélioration Continue</div>
                <div className="text-red-600">Traiter prioritairement les thèmes à sentiment négatif</div>
              </div>
              <div className="border-l-4 border-red-400 pl-3">
                <div className="font-medium text-red-700">Formation Équipes</div>
                <div className="text-red-600">Sensibiliser sur les points faibles récurrents</div>
              </div>
              <div className="border-l-4 border-red-400 pl-3">
                <div className="font-medium text-red-700">Monitoring Renforcé</div>
                <div className="text-red-600">Suivre l'évolution des métriques critiques</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
            📈 Roadmap des Actions Recommandées
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="border-l-4 border-blue-400 pl-3">
              <div className="font-medium text-blue-700 mb-1">🚀 Immédiat (0-2 semaines)</div>
              <ul className="text-blue-600 space-y-1">
                <li>• Traiter les alertes critiques</li>
                <li>• Communiquer sur les points forts</li>
                <li>• Lancer les actions correctives urgentes</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-3">
              <div className="font-medium text-blue-700 mb-1">⚡ Court terme (1-3 mois)</div>
              <ul className="text-blue-600 space-y-1">
                <li>• Optimiser les processus identifiés</li>
                <li>• Former les équipes concernées</li>
                <li>• Suivre l'évolution des métriques</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-3">
              <div className="font-medium text-blue-700 mb-1">🎯 Moyen terme (3-6 mois)</div>
              <ul className="text-blue-600 space-y-1">
                <li>• Innover sur les thèmes porteurs</li>
                <li>• Consolider les améliorations</li>
                <li>• Analyser les tendances émergentes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 text-xl mt-0.5">💡</span>
            <div className="text-sm text-blue-800">
              <strong>Recommandation Clé :</strong> {' '}
              {globalMetrics && globalMetrics.sentimentNet > 0.2 ?
                "Votre position est favorable. Concentrez-vous sur l'amplification de vos points forts tout en maintenant la surveillance des points d'amélioration." :
                globalMetrics && globalMetrics.sentimentNet < -0.2 ?
                "Situation critique identifiée. Priorisez les actions correctives immédiates et mettez en place un suivi quotidien des indicateurs clés." :
                "Position mitigée nécessitant une approche équilibrée entre capitalisation sur les forces et correction des faiblesses. Analysez finement chaque thème pour optimiser votre stratégie."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
