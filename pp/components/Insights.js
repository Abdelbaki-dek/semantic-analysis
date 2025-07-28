import React, { useState } from 'react';

const Insights = ({ insights, themes }) => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [expandedThemes, setExpandedThemes] = useState(new Set());

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Insights</h2>
        <p className="text-gray-500">Aucun insight disponible pour cette analyse.</p>
      </div>
    );
  }

  const getInsightIcon = (type) => {
    const icons = {
      positive: '✅',
      warning: '⚠️',
      info: 'ℹ️',
      summary: '📊'
    };
    return icons[type] || '💡';
  };

  const getInsightColor = (type) => {
    const colors = {
      positive: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      summary: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    const labels = {
      high: 'Priorité Haute',
      medium: 'Priorité Moyenne',
      low: 'Priorité Faible'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[priority] || badges.low}`}>
        {labels[priority] || 'Priorité Faible'}
      </span>
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
      {/* Section Insights Principaux */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          🔍 Insights & Recommandations
        </h2>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                getInsightColor(insight.type)
              } ${selectedInsight === index ? 'ring-2 ring-blue-300' : ''}`}
              onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
            >
              {/* En-tête de l'insight */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm opacity-90">
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getPriorityBadge(insight.priority)}
                  <div className="text-sm opacity-60">
                    {selectedInsight === index ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {/* Détails expandables */}
              {selectedInsight === index && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Exemples d'avis */}
                  {insight.examples && insight.examples.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        📝 Exemples d'avis représentatifs :
                      </h4>
                      <div className="space-y-2">
                        {insight.examples.slice(0, 3).map((example, exIndex) => (
                          <div
                            key={exIndex}
                            className="bg-white bg-opacity-70 rounded-lg p-3 border border-gray-200"
                          >
                            <blockquote className="text-sm italic mb-2">
                              "{example.text}"
                            </blockquote>
                            <div className="flex justify-between text-xs opacity-75">
                              <span>
                                Score: {example.score?.toFixed(2) || 'N/A'}
                              </span>
                              <span>
                                Confiance: {example.confidence ? (example.confidence * 100).toFixed(1) + '%' : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mots-clés */}
                  {insight.keywords && insight.keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        🔤 Mots-clés associés :
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.keywords.slice(0, 8).map((keyword, kwIndex) => (
                          <span
                            key={kwIndex}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white bg-opacity-70 border"
                          >
                            {typeof keyword === 'string' ? keyword : keyword.word}
                            {keyword.frequency && (
                              <span className="ml-1 opacity-60">
                                ({keyword.frequency})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions recommandées */}
                  {insight.type === 'warning' && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        💡 Actions recommandées :
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Analyser en détail les avis négatifs pour identifier les problèmes récurrents</li>
                        <li>• Mettre en place un plan d'action pour améliorer les points faibles</li>
                        <li>• Suivre l'évolution de ce sentiment dans le temps</li>
                      </ul>
                    </div>
                  )}

                  {insight.type === 'positive' && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        🚀 Opportunités :
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Capitaliser sur ces points forts dans la communication</li>
                        <li>• Utiliser ces témoignages positifs comme références</li>
                        <li>• Maintenir et renforcer ces aspects appréciés</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section Analyse Thématique Détaillée */}
      {themes && themes.themes && themes.themes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🎯 Analyse Thématique Détaillée
          </h2>

          <div className="space-y-4">
            {themes.themes.slice(0, 6).map((theme, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* En-tête du thème */}
                <div
                  className="bg-gray-50 p-4 cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
                  onClick={() => toggleThemeExpansion(index)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {theme.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {theme.size} avis • {((theme.size / themes.themes.reduce((sum, t) => sum + t.size, 0)) * 100).toFixed(1)}% du corpus
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {theme.size}
                      </div>
                      <div className="text-xs text-gray-500">mentions</div>
                    </div>
                    <div className="text-gray-400">
                      {expandedThemes.has(index) ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* Contenu expandable */}
                {expandedThemes.has(index) && (
                  <div className="p-4 border-t">
                    {/* Mots-clés du thème */}
                    {theme.keywords && theme.keywords.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-gray-700">
                          🔤 Mots-clés principaux :
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {theme.keywords.slice(0, 10).map((keyword, kwIndex) => (
                            <span
                              key={kwIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {typeof keyword === 'string' ? keyword : keyword.word}
                              {keyword.frequency && (
                                <span className="ml-1 bg-blue-200 px-1.5 py-0.5 rounded-full text-xs">
                                  {keyword.frequency}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exemples d'avis pour ce thème */}
                    {theme.examples && theme.examples.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-gray-700">
                          📝 Exemples d'avis :
                        </h4>
                        <div className="space-y-2">
                          {theme.examples.slice(0, 3).map((example, exIndex) => (
                            <div
                              key={exIndex}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                              <blockquote className="text-sm italic text-gray-700">
                                "{typeof example === 'string' ? example : example.text}"
                              </blockquote>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Barre de progression visuelle */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Part du corpus total</span>
                        <span>{((theme.size / themes.themes.reduce((sum, t) => sum + t.size, 0)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(theme.size / themes.themes.reduce((sum, t) => sum + t.size, 0)) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Résumé thématique */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-gray-800">
              📊 Résumé de l'analyse thématique
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {themes.themes.length}
                </div>
                <div className="text-gray-600">Thèmes identifiés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {themes.themes.length > 0 ? Math.round(themes.themes.reduce((sum, t) => sum + t.size, 0) / themes.themes.length) : 0}
                </div>
                <div className="text-gray-600">Avis par thème (moyenne)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {themes.themes.length > 0 ? ((themes.themes[0].size / themes.themes.reduce((sum, t) => sum + t.size, 0)) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-gray-600">Thème dominant</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Conseils d'Action */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
        <h2 className="text-xl font-bold mb-4 text-indigo-900 flex items-center">
          🎯 Conseils d'Action Stratégique
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center">
              ✅ Points Forts à Maintenir
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Capitaliser sur les aspects les mieux notés</li>
              <li>• Intégrer les témoignages positifs dans votre communication</li>
              <li>• Former les équipes sur les bonnes pratiques identifiées</li>
              <li>• Monitorer ces indicateurs pour maintenir la qualité</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center">
              ⚠️ Axes d'Amélioration Prioritaires
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Analyser en profondeur les retours négatifs récurrents</li>
              <li>• Mettre en place des actions correctives ciblées</li>
              <li>• Suivre l'évolution des métriques dans le temps</li>
              <li>• Solliciter des retours plus détaillés sur ces aspects</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            📈 Recommandations pour la Suite
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Suivi régulier :</strong> Répétez cette analyse mensuelle pour détecter les tendances et l'impact de vos actions.
            </p>
            <p>
              <strong>Segmentation avancée :</strong> Analysez les sentiments par segments clients, périodes ou canaux pour des insights plus précis.
            </p>
            <p>
              <strong>Boucle de feedback :</strong> Mettez en place un système de suivi des actions prises suite à cette analyse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;