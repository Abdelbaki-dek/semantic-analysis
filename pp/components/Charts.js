// ===========================
  // GRAPHIQUE SENTIMENT PRINCIPAL AMÉLIORÉ
  // ===========================
  
  const createSentimentChart = () => {
    if (!sentimentChartRef.current) return;
    
    const ctx = sentimentChartRef.current.getContext('2d');
    const sentiment = data.metrics.sentiment;

    // Données avec catégories détaillées si disponibles
    const hasDetailedCounts = sentiment.detailedCounts;
    
    let chartData, labels, colors;
    
    if (hasDetailedCounts) {
      // Version détaillée avec 7 catégories
      labels = ['Très Positif', 'Positif', 'Légèrement Positif', 'Neutre', 'Légèrement Négatif', 'Négatif', 'Très Négatif'];
      chartData = [
        sentiment.detailedCounts.très_positif || 0,
        sentiment.detailedCounts.positif || 0,
        sentiment.detailedCounts.légèrement_positif || 0,
        sentiment.detailedCounts.neutre || 0,
        sentiment.detailedCounts.légèrement_négatif || 0,
        sentiment.detailedCounts.négatif || 0,
        sentiment.detailedCounts.très_négatif || 0
      ];
      colors = ['#059669', '#10B981', '#34D399', '#F59E0B', '#FB923C', '#F87171', '#DC2626'];
    } else {
      // Version simplifiée avec 3 catégories
      labels = ['Positif', 'Neutre', 'Négatif'];
      chartData = [
        sentiment.counts.positif || 0,
        sentiment.counts.neutre || 0,
        sentiment.counts.négatif || 0
      ];
      colors = ['#10B981', '#F59E0B', '#EF4444'];
    }

    const config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2,
          hoverBackgroundColor: colors.map(color => color + 'CC'),
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Répartition des Sentiments (${sentiment.total} avis analysés)`,
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const percentage = ((value / sentiment.total) * 100).toFixed(1);
                return `${context.label}: ${value} avis (${percentage}%)`;
              },
              afterLabel: function(context) {
                // Ajout du sentiment net si disponible
                if (sentiment.sentimentNet) {
                  return `Sentiment Net Global: ${(sentiment.sentimentNet * 100).toFixed(1)}%`;
                }
                return '';
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1000
        }
      }
    };

    chartInstances.current.sentiment = new Chart(ctx, config);
  };

  // ===========================
  // GRAPHIQUE SENTIMENT NET (NOUVEAU)
  // ===========================
  
  const createSentimentNetChart = () => {
    if (!sentimentNetChartRef.current || !data.metrics.sentiment) return;
    
    const ctx = sentimentNetChartRef.current.getContext('2d');
    const sentiment = data.metrics.sentiment;
    const sentimentNet = sentiment.sentimentNet || 0;
    
    // Gauge chart simulé avec bar chart
    const config = {
      type: 'bar',
      data: {
        labels: ['Sentiment Net'],
        datasets: [{
          label: 'Score',
          data: [sentimentNet * 100],
          backgroundColor: sentimentNet > 0 ? '#10B981' : sentimentNet < 0 ? '#EF4444' : '#F59E0B',
          borderColor: sentimentNet > 0 ? '#059669' : sentimentNet < 0 ? '#DC2626' : '#D97706',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: `Sentiment Net: ${(sentimentNet * 100).toFixed(1)}%`,
            font: { size: 16, weight: 'bold' },
            color: sentimentNet > 0 ? '#059669' : sentimentNet < 0 ? '#DC2626' : '#D97706'
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.x;
                const interpretation = value > 20 ? 'Très positif' : 
                                     value > 10 ? 'Positif' : 
                                     value > -10 ? 'Neutre' : 
                                     value > -20 ? 'Négatif' : 'Très négatif';
                return `${value.toFixed(1)}% (${interpretation})`;
              }
            }
          }
        },
        scales: {
          x: {
            min: -100,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: function(context) {
                if (context.tick.value === 0) return '#6B7280';
                return '#E5E7EB';
              },
              lineWidth: function(context) {
                return context.tick.value === 0 ? 2 : 1;
              }
            }
          },
          y: { display: false }
        }
      }
    };

    chartInstances.current.sentimentNet = new Chart(ctx, config);
  };

  // ===========================
  // GRAPHIQUE THÉMATIQUE ENRICHI
  // ===========================
  
  const createThemeChart = () => {
    if (!themeChartRef.current || !data.metrics.themes) return;
    
    const ctx = themeChartRef.current.getContext('2d');
    const themes = data.metrics.themes.themeDistribution || [];
    const topThemes = themes.slice(0, 10); // Top 10 thèmes

    const config = {
      type: 'bar',
      data: {
        labels: topThemes.map(theme => 
          theme.name.length > 25 ? theme.name.substring(0, 25) + '...' : theme.name
        ),
        datasets: [
          {
            label: 'Volume (nombre d\'avis)',
            data: topThemes.map(theme => theme.size),
            backgroundColor: topThemes.map(theme => {
              const sentimentNet = theme.sentimentNet || 0;
              if (sentimentNet > 0.2) return '#10B981';
              if (sentimentNet < -0.2) return '#EF4444';
              return '#F59E0B';
            }),
            borderColor: '#374151',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Sentiment Net (%)',
            data: topThemes.map(theme => (theme.sentimentNet || 0) * 100),
            type: 'line',
            borderColor: '#8B5CF6',
            backgroundColor: '#8B5CF6',
            borderWidth: 3,
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 6,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Top ${topThemes.length} des Thèmes avec Sentiment Net`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top',
            labels: { padding: 20, usePointStyle: true }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                return topThemes[index].name;
              },
              label: function(context) {
                const theme = topThemes[context.dataIndex];
                if (context.datasetIndex === 0) {
                  return `Volume: ${context.parsed.y} avis (${theme.percentage}%)`;
                } else {
                  const sentiment = theme.sentimentNet > 0 ? 'Positif' : 
                                  theme.sentimentNet < 0 ? 'Négatif' : 'Neutre';
                  return `Sentiment Net: ${context.parsed.y.toFixed(1)}% (${sentiment})`;
                }
              },
              afterLabel: function(context) {
                if (context.datasetIndex === 0) {
                  const theme = topThemes[context.dataIndex];
                  const keywords = theme.keywords ? 
                    theme.keywords.slice(0, 3).map(k => k.word).join(', ') : '';
                  return keywords ? `Mots-clés: ${keywords}` : '';
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Thèmes' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Nombre d\'avis' },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Sentiment Net (%)' },
            min: -100,
            max: 100,
            grid: { drawOnChartArea: false },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };

    chartInstances.current.theme = new Chart(ctx, config);
  };

  // ===========================
  // NUAGE D'EMOJIS (NOUVEAU)
  // ===========================
  
  const createEmojiChart = () => {
    if (!emojiChartRef.current || !data.emojis) return;
    
    const ctx = emojiChartRef.current.getContext('2d');
    const emojis = data.emojis.slice(0, 15); // Top 15 emojis

    const config = {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Emojis',
          data: emojis.map((emoji, index) => ({
            x: (index % 5) * 2, // Position X
            y: Math.floor(index / 5) * 2, // Position Y
            r: Math.max(5, Math.min(25, emoji.count * 3)), // Taille basée sur la fréquence
            emoji: emoji.emoji,
            count: emoji.count,
            sentiment: emoji.sentiment || 0
          })),
          backgroundColor: emojis.map(emoji => {
            const sentiment = emoji.sentiment || 0;
            if (sentiment > 0.3) return '#10B98180';
            if (sentiment < -0.3) return '#EF444480';
            return '#F59E0B80';
          }),
          borderColor: emojis.map(emoji => {
            const sentiment = emoji.sentiment || 0;
            if (sentiment > 0.3) return '#10B981';
            if (sentiment < -0.3) return '#EF4444';
            return '#F59E0B';
          }),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Nuage d\'Emojis (taille = fréquence, couleur = sentiment)',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(context) {
                const point = context[0].raw;
                return `${point.emoji} (utilisé ${point.count} fois)`;
              },
              label: function(context) {
                const point = context.raw;
                const sentimentText = point.sentiment > 0.3 ? 'Positif' : 
                                    point.sentiment < -0.3 ? 'Négatif' : 'Neutre';
                return `Sentiment: ${sentimentText} (${(point.sentiment * 100).toFixed(0)}%)`;
              }
            }
          }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          point: {
            hoverRadius: function(context) {
              return context.parsed.r + 5;
            }
          }
        }
      }
    };

    chartInstances.current.emoji = new Chart(ctx, config);
  };

  // ===========================
  // GRAPHIQUE HASHTAGS (NOUVEAU)
  // ===========================
  
  const createHashtagChart = () => {
    if (!hashtagChartRef.current || !data.hashtags) return;
    
    const ctx = hashtagChartRef.current.getContext('2d');
    const hashtags = data.hashtags.slice(0, 12); // Top 12 hashtags

    const config = {
      type: 'polarArea',
      data: {
        labels: hashtags.map(h => h.hashtag || h.tag),
        datasets: [{
          data: hashtags.map(h => h.count),
          backgroundColor: [
            '#3B82F680', '#10B98180', '#F59E0B80', '#EF444480',
            '#8B5CF680', '#06B6D480', '#F9731680', '#84CC1680',
            '#EC489980', '#6366F180', '#14B8A680', '#F9734480'
          ],
          borderColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
            '#EC4899', '#6366F1', '#14B8A6', '#F97344'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Top Hashtags (aire = fréquence)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'right',
            labels: {
              padding: 10,
              font: { size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const hashtag = hashtags[context.dataIndex];
                return `${context.label}: ${context.parsed.r} mentions`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { display: false }
          }
        }
      }
    };

    chartInstances.current.hashtag = new Chart(ctx, config);
  };

  // ===========================
  // HEATMAP THÉMATIQUE (NOUVEAU)
  // ===========================
  
  const createThemeHeatmapChart = () => {
    if (!heatmapChartRef.current || !data.metrics.themes) return;
    
    const ctx = heatmapChartRef.current.getContext('2d');
    const themes = data.metrics.themes.themeDistribution.slice(0, 8);
    
    // Simulation d'une heatmap avec des barres empilées
    const sentimentCategories = ['Très Positif', 'Positif', 'Neutre', 'Négatif', 'Très Négatif'];
    
    const datasets = sentimentCategories.map((category, index) => {
      const colors = ['#059669', '#10B981', '#F59E0B', '#F87171', '#DC2626'];
      
      return {
        label: category,
        data: themes.map(theme => {
          // Simulation de données de distribution par thème
          const dist = theme.sentimentDistribution || { positive: 50, neutral: 30, negative: 20 };
          switch(index) {
            case 0: return Math.round(dist.positive * 0.6); // Très positif
            case 1: return Math.round(dist.positive * 0.4); // Positif
            case 2: return dist.neutral || 0; // Neutre
            case 3: return Math.round(dist.negative * 0.6); // Négatif
            case 4: return Math.round(dist.negative * 0.4); // Très négatif
            default: return 0;
          }
        }),
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1
      };
    });

    const config = {
      type: 'bar',
      data: {
        labels: themes.map(theme => 
          theme.name.length > 20 ? theme.name.substring(0, 20) + '...' : theme.name
        ),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Heatmap Sentiment par Thème',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top',
            labels: { padding: 15, usePointStyle: true }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                return themes[context[0].dataIndex].name;
              },
              label: function(context) {
                const total = context.chart.data.datasets.reduce((sum, dataset) => 
                  sum + dataset.data[context.dataIndex], 0
                );
                const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                return `${context.dataset.label}: ${context.parsed.y} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Thèmes' }
          },
          y: {
            stacked: true,
            title: { display: true, text: 'Répartition des sentiments' },
            beginAtZero: true
          }
        }
      }
    };

    chartInstances.current.heatmap = new Chart(ctx, config);
  };

  // ===========================
  // GRAPHIQUES EXISTANTS AMÉLIORÉS
  // ===========================
  
  const createDistributionChart = () => {
    if (!distributionChartRef.current || !data.metrics.distribution) return;
    
    const ctx = distributionChartRef.current.getContext('2d');
    const distribution = data.metrics.distribution.scoreRanges.filter(range => range.count > 0);

    const config = {
      type: 'bar',
      data: {
        labels: distribution.map(range => range.label || range.range.replace(/\([^)]*\)/g, '')),
        datasets: [{
          label: 'Nombre d\'avis',
          data: distribution.map(range => range.count),
          backgroundColor: distribution.map(range => range.color || '#3B82F6'),
          borderColor: '#374151',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribution par Intensité de Sentiment',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
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
            title: { display: true, text: 'Intensité du sentiment' },
            ticks: { maxRotation: 45 }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Nombre d\'avis' }
          }
        }
      }
    };

    chartInstances.current.distribution = new Chart(ctx, config);
  };

  const createConfidenceChart = () => {
    if (!confidenceChartRef.current || !data.metrics.distribution) return;
    
    const ctx = confidenceChartRef.current.getContext('2d');
    const confidence = data.metrics.distribution.confidenceDistribution.filter(conf => conf.count > 0);

    const config = {
      type: 'pie',
      data: {
        labels: confidence.map(conf => conf.label || conf.range.replace(/\([^)]*\)/g, '')),
        datasets: [{
          data: confidence.map(conf => conf.count),
          backgroundColor: [
            '#10B981', '#34D399', '#FCD34D', '#FB923C', '#EF4444'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3
        }]
      },
      options: {
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
            labels: { padding: 10, usePointStyle: true }
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
      }
    };

    chartInstances.current.confidence = new Chart(ctx, config);
  };

  // ===========================
  // CONTRÔLES D'AFFICHAGE
  // ===========================
  
  const toggleChart = (chartName) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  // ===========================
  // RENDU PRINCIPAL
  // ===========================
  
  if (!data || !data.metrics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des visualisations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Contrôles d'affichage */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          📈 Visualisations Interactives
        </h2>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Graphiques à afficher :</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(visibleCharts).map(([key, visible]) => (
              <button
                key={key}
                onClick={() => toggleChart(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  visible 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {key === 'sentimentNet' ? 'Sentiment Net' :
                 key === 'emojis' ? 'Nuage d\'Emojis' :
                 key === 'hashtags' ? 'Top Hashtags' :
                 key === 'heatmap' ? 'Heatmap Thématique' :
                 key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Métriques rapides */}
        {data.metrics.sentiment && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {((data.metrics.sentiment.sentimentNet || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Sentiment Net</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.metrics.sentiment.percentages?.positif?.toFixed(1) || 0}%
              </div>
              <div className="text-xs text-gray-600">Positifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.metrics.sentiment.percentages?.négatif?.toFixed(1) || 0}%
              </div>
              <div className="text-xs text-gray-600">Négatifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.metrics.themes?.totalThemes || 0}
              </div>
              <div className="text-xs text-gray-600">Thèmes</div>
            </div>
          </div>
        )}
      </div>

      {/* Graphiques principaux */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sentiment principal */}
        {visibleCharts.sentiment && data.metrics.sentiment && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <canvas ref={sentimentChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Sentiment Net */}
        {visibleCharts.sentimentNet && data.metrics.sentiment && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <canvas ref={sentimentNetChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Thèmes */}
        {visibleCharts.themes && data.metrics.themes && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <canvas ref={themeChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Distribution */}
        {visibleCharts.distribution && data.metrics.distribution && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <canvas ref={distributionChartRef}></canvas>
            </div>
          </div>
        )}
      </div>

      {/* Graphiques contextuels */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Nuage d'emojis */}
        {visibleCharts.emojis && data.emojis && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-64">
              <canvas ref={emojiChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Top hashtags */}
        {visibleCharts.hashtags && data.hashtags && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-64">
              <canvas ref={hashtagChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Confiance */}
        {visibleCharts.confidence && data.metrics.distribution && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-64">
              <canvas ref={confidenceChartRef}></canvas>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap thématique */}
      {visibleCharts.heatmap && data.metrics.themes && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="h-96">
            <canvas ref={heatmapChartRef}></canvas>
          </div>
        </div>
      )}

      {/* Légende et explications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          🔍 Guide de Lecture des Graphiques
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Métriques Principales :</h4>
            <ul className="space-y-1">
              <li><strong>Sentiment Net :</strong> (Positifs - Négatifs) / Total</li>
              <li><strong>Score de sentiment :</strong> -1 (très négatif) à +1 (très positif)</li>
              <li><strong>Polarisation :</strong> Écart-type des scores (plus élevé = opinions divisées)</li>
              <li><strong>Confiance :</strong> Fiabilité de l'analyse (0 à 1)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Éléments Contextuels :</h4>
            <ul className="space-y-1">
              <li><strong>Emojis :</strong> Taille = fréquence, couleur = sentiment</li>
              <li><strong>Hashtags :</strong> Aire = nombre de mentions</li>
              <li><strong>Thèmes :</strong> Barres = volume, ligne = sentiment net</li>
              <li><strong>Heatmap :</strong> Distribution des sentiments par thème</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
            💡 Conseils d'Interprétation :
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Sentiment Net positif :</strong> Plus d'avis positifs que négatifs</li>
            <li>• <strong>Forte polarisation :</strong> Opinions très tranchées, nécessite une analyse segmentée</li>
            <li>• <strong>Thème dominant :</strong> Sujet principal des conversations, à prioriser</li>
            <li>• <strong>Emojis négatifs fréquents :</strong> Signal d'alerte émotionnelle</li>
            <li>• <strong>Hashtags transversaux :</strong> Opportunités de communication globale</li>
          </ul>
        </div>

        {/* Résumé des données */}
        {data.metadata && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">📊 Résumé de l'Analyse :</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Textes analysés :</span>
                <span className="font-medium ml-2">{data.metadata.processedCount || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Temps de traitement :</span>
                <span className="font-medium ml-2">
                  {data.metadata.processingTime ? `${(data.metadata.processingTime / 1000).toFixed(1)}s` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Score de qualité :</span>
                <span className="font-medium ml-2">{data.metadata.qualityScore || 0}/100</span>
              </div>
              <div>
                <span className="text-gray-600">Confiance moyenne :</span>
                <span className="font-medium ml-2">
                  {data.metadata.confidence ? `${(data.metadata.confidence * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export et actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          ⚙️ Actions et Export
        </h3>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>🖨️</span>
            <span>Imprimer les Graphiques</span>
          </button>
          
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            title="Fonctionnalité à venir"
          >
            <span>📊</span>
            <span>Exporter en PNG</span>
          </button>
          
          <button 
            onClick={() => {
              const chartData = {
                sentiment: data.metrics.sentiment,
                themes: data.metrics.themes,
                emojis: data.emojis,
                hashtags: data.hashtags,
                timestamp: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'donnees-graphiques.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>💾</span>
            <span>Exporter Données JSON</span>
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          💡 Astuce : Cliquez sur les légendes des graphiques pour masquer/afficher des éléments. 
          Survolez les points pour voir les détails.
        </div>
      </div>
    </div>
  );
};

export default Charts;import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const Charts = ({ data }) => {
  // Refs pour tous les graphiques
  const sentimentChartRef = useRef(null);
  const themeChartRef = useRef(null);
  const distributionChartRef = useRef(null);
  const confidenceChartRef = useRef(null);
  const sentimentNetChartRef = useRef(null);
  const emojiChartRef = useRef(null);
  const hashtagChartRef = useRef(null);
  const evolutionChartRef = useRef(null);
  const heatmapChartRef = useRef(null);

  // Instances des graphiques
  const chartInstances = useRef({});
  
  // État pour contrôler les graphiques visibles
  const [visibleCharts, setVisibleCharts] = useState({
    sentiment: true,
    themes: true,
    distribution: true,
    confidence: true,
    sentimentNet: true,
    emojis: true,
    hashtags: true,
    evolution: false,
    heatmap: false
  });

  useEffect(() => {
    if (!data || !data.metrics) return;

    // Nettoyage des graphiques existants
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};

    // Création des graphiques selon la disponibilité des données
    if (data.metrics.sentiment && visibleCharts.sentiment) createSentimentChart();
    if (data.metrics.themes && visibleCharts.themes) createThemeChart();
    if (data.metrics.distribution && visibleCharts.distribution) createDistributionChart();
    if (data.metrics.distribution && visibleCharts.confidence) createConfidenceChart();
    if (data.metrics.sentiment && visibleCharts.sentimentNet) createSentimentNetChart();
    if (data.emojis && visibleCharts.emojis) createEmojiChart();
    if (data.hashtags && visibleCharts.hashtags) createHashtagChart();
    if (data.metrics.themes && visibleCharts.heatmap) createThemeHeatmapChart();

    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [data, visibleCharts]);

  // ===========================
  // GRAPHIQUE SENTIMENT PRINCIPAL AMÉLIORÉ
  // ===========================
