import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const Charts = ({ data }) => {
  const sentimentChartRef = useRef(null);
  const themeChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const confidenceChartRef = useRef(null);

  const sentimentChartInstance = useRef(null);
  const themeChartInstance = useRef(null);
  const distributionChartInstance = useRef(null);
  const confidenceChartInstance = useRef(null);

  useEffect(() => {
    if (!data) return;

    // Nettoyage des graphiques existants
    [sentimentChartInstance, themeChartInstance, distributionChartInstance, confidenceChartInstance]
      .forEach(chartRef => {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      });

    // Graphique des sentiments
    if (data.metrics.sentiment && sentimentChartRef.current) {
      createSentimentChart();
    }

    // Graphique des thèmes
    if (data.metrics.themes && themeChartRef.current) {
      createThemeChart();
    }

    // Graphique de distribution
    if (data.metrics.distribution && distributionChartRef.current) {
      createDistributionChart();
    }

    // Graphique de confiance
    if (data.metrics.distribution && confidenceChartRef.current) {
      createConfidenceChart();
    }

    // Nettoyage au démontage
    return () => {
      [sentimentChartInstance, themeChartInstance, distributionChartInstance, confidenceChartInstance]
        .forEach(chartRef => {
          if (chartRef.current) {
            chartRef.current.destroy();
          }
        });
    };
  }, [data]);

  const createSentimentChart = () => {
    const ctx = sentimentChartRef.current.getContext('2d');
    const sentiment = data.metrics.sentiment;

    const chartData = {
      labels: ['Positif', 'Négatif', 'Neutre'],
      datasets: [{
        data: [
          sentiment.counts.positif,
          sentiment.counts.négatif,
          sentiment.counts.neutre
        ],
        backgroundColor: [
          '#10B981', // Vert pour positif
          '#EF4444', // Rouge pour négatif
          '#F59E0B'  // Jaune pour neutre
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#34D399',
          '#F87171',
          '#FBBF24'
        ]
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Répartition des Sentiments (${sentiment.total} avis)`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = ((value / sentiment.total) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };

    sentimentChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  };

  const createThemeChart = () => {
    const ctx = themeChartRef.current.getContext('2d');
    const themes = data.metrics.themes.themeDistribution.slice(0, 8); // Top 8 thèmes

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
    ];

    const chartData = {
      labels: themes.map(theme => 
        theme.name.length > 20 ? theme.name.substring(0, 20) + '...' : theme.name
      ),
      datasets: [{
        label: 'Nombre d\'avis',
        data: themes.map(theme => theme.size),
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'),
        borderWidth: 1,
        hoverBackgroundColor: colors.map(color => color + 'CC')
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Top ${themes.length} des Thèmes Principaux`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              const fullName = data.metrics.themes.themeDistribution[context[0].dataIndex].name;
              return fullName;
            },
            label: function(context) {
              const theme = themes[context.dataIndex];
              return `${context.parsed.x} avis (${theme.percentage.toFixed(1)}%)`;
            },
            afterLabel: function(context) {
              const theme = themes[context.dataIndex];
              if (theme.keywords && theme.keywords.length > 0) {
                const keywords = theme.keywords.slice(0, 3).map(k => k.word || k).join(', ');
                return `Mots-clés: ${keywords}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre d\'avis'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Thèmes'
          }
        }
      }
    };

    themeChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: options
    });
  };

  const createDistributionChart = () => {
    const ctx = distributionChartRef.current.getContext('2d');
    const distribution = data.metrics.distribution.scoreRanges.filter(range => range.count > 0);

    const chartData = {
      labels: distribution.map(range => range.range.replace(/\([^)]*\)/g, '')),
      datasets: [{
        label: 'Nombre d\'avis',
        data: distribution.map(range => range.count),
        backgroundColor: [
          '#22C55E', // Très positif
          '#65A30D', // Positif
          '#84CC16', // Légèrement positif
          '#FCD34D', // Neutre
          '#FB923C', // Légèrement négatif
          '#F87171', // Négatif
          '#DC2626'  // Très négatif
        ],
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribution par Intensité de Sentiment',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const range = distribution[context.dataIndex];
              return `${context.parsed.y} avis (${range.percentage.toFixed(1)}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Intensité du sentiment'
          },
          ticks: {
            maxRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre d\'avis'
          }
        }
      }
    };

    distributionChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: options
    });
  };

  const createConfidenceChart = () => {
    const ctx = confidenceChartRef.current.getContext('2d');
    const confidence = data.metrics.distribution.confidenceDistribution.filter(conf => conf.count > 0);

    const chartData = {
      labels: confidence.map(conf => conf.range.replace(/\([^)]*\)/g, '')),
      datasets: [{
        data: confidence.map(conf => conf.count),
        backgroundColor: [
          '#10B981', // Très élevée
          '#34D399', // Élevée
          '#FCD34D', // Moyenne
          '#FB923C', // Faible
          '#EF4444'  // Très faible
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribution de la Confiance d\'Analyse',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const conf = confidence[context.dataIndex];
              return `${context.label}: ${context.parsed} avis (${conf.percentage.toFixed(1)}%)`;
            }
          }
        }
      }
    };

    confidenceChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: chartData,
      options: options
    });
  };

  if (!data || !data.metrics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-center text-gray-500">Aucune donnée à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          📈 Visualisations Interactives
        </h2>

        {/* Graphiques principaux */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Graphique des sentiments */}
          {data.metrics.sentiment && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-80">
                <canvas ref={sentimentChartRef}></canvas>
              </div>
              
              {/* Métriques additionnelles */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-green-100 rounded">
                  <div className="font-semibold text-green-800">
                    Score Positif Moyen
                  </div>
                  <div className="text-green-600">
                    {data.metrics.sentiment.averageScores.positif.toFixed(3)}
                  </div>
                </div>
                <div className="text-center p-2 bg-red-100 rounded">
                  <div className="font-semibold text-red-800">
                    Score Négatif Moyen
                  </div>
                  <div className="text-red-600">
                    {data.metrics.sentiment.averageScores.négatif.toFixed(3)}
                  </div>
                </div>
                <div className="text-center p-2 bg-blue-100 rounded">
                  <div className="font-semibold text-blue-800">
                    Confiance Globale
                  </div>
                  <div className="text-blue-600">
                    {(data.metrics.sentiment.avgConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Graphique des thèmes */}
          {data.metrics.themes && data.metrics.themes.themeDistribution.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-80">
                <canvas ref={themeChartRef}></canvas>
              </div>
              
              {/* Informations thématiques */}
              <div className="mt-4 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Diversité thématique:</span>
                  <span className="text-blue-600 font-semibold">
                    {data.metrics.global?.thematicDiversity?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Thème dominant:</span>
                  <span className="text-purple-600 font-semibold">
                    {data.metrics.themes.dominantTheme?.percentage?.toFixed(1) || '0'}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Graphiques secondaires */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Distribution des scores */}
          {data.metrics.distribution && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-64">
                <canvas ref={distributionChartRef}></canvas>
              </div>
            </div>
          )}

          {/* Distribution de confiance */}
          {data.metrics.distribution && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-64">
                <canvas ref={confidenceChartRef}></canvas>
              </div>
            </div>
          )}
        </div>

        {/* Métriques globales */}
        {data.metrics.global && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Métriques Globales</h3>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {data.metrics.global.sentimentScore?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-600">Score Global</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.metrics.global.overallSentiment}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {data.metrics.global.polarization?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-600">Polarisation</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.metrics.global.interpretation?.polarization || 'N/A'}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {data.metrics.global.qualityScore?.toFixed(0) || 'N/A'}%
                </div>
                <div className="text-sm font-medium text-gray-600">Qualité</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.metrics.global.interpretation?.quality || 'N/A'}
                </div>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {data.metrics.themes?.totalThemes || 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-600">Thèmes</div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.metrics.global.interpretation?.diversity || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Légende et explications */}
        <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">🔍 Guide de lecture :</h4>
          <ul className="space-y-1">
            <li><strong>Score de sentiment :</strong> -1 (très négatif) à +1 (très positif)</li>
            <li><strong>Polarisation :</strong> Écart-type des scores (plus élevé = opinions plus divisées)</li>
            <li><strong>Diversité thématique :</strong> Basée sur l'entropie (plus élevé = plus de variété)</li>
            <li><strong>Qualité :</strong> Combinaison de la confiance d'analyse et de la richesse des textes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Charts;