const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');

// Génération du PDF
async function generatePDF(results) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold')
         .text('Rapport d\'Analyse de Sentiments', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
         .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 
               { align: 'center' });
      
      doc.moveDown(2);

      // Résumé exécutif
      addSection(doc, 'RÉSUMÉ EXÉCUTIF', 16);
      if (results.insights && results.insights.length > 0) {
        const executiveSummary = results.insights.find(i => i.type === 'summary');
        if (executiveSummary) {
          doc.fontSize(11).text(executiveSummary.description);
          doc.moveDown();
        }
      }

      // Métriques globales
      addSection(doc, 'MÉTRIQUES GLOBALES', 14);
      
      if (results.metrics.sentiment) {
        const sentiment = results.metrics.sentiment;
        
        doc.fontSize(11)
           .text(`Total d'avis analysés : ${sentiment.total}`)
           .text(`Score global de sentiment : ${sentiment.globalScore} (${sentiment.interpretation})`)
           .text(`Confiance moyenne : ${(sentiment.avgConfidence * 100).toFixed(1)}%`)
           .moveDown();

        // Répartition des sentiments
        doc.text('Répartition des sentiments :')
           .text(`  • Positifs : ${sentiment.counts.positif} (${sentiment.percentages.positif.toFixed(1)}%)`)
           .text(`  • Négatifs : ${sentiment.counts.négatif} (${sentiment.percentages.négatif.toFixed(1)}%)`)
           .text(`  • Neutres : ${sentiment.counts.neutre} (${sentiment.percentages.neutre.toFixed(1)}%)`)
           .moveDown();

        // Scores moyens
        doc.text('Scores moyens par sentiment :')
           .text(`  • Positifs : ${sentiment.averageScores.positif.toFixed(3)}`)
           .text(`  • Négatifs : ${sentiment.averageScores.négatif.toFixed(3)}`)
           .text(`  • Neutres : ${sentiment.averageScores.neutre.toFixed(3)}`)
           .moveDown(2);
      }

      // Analyse thématique
      if (results.metrics.themes && results.metrics.themes.themeDistribution.length > 0) {
        addSection(doc, 'ANALYSE THÉMATIQUE', 14);
        
        doc.fontSize(11)
           .text(`Nombre de thèmes identifiés : ${results.metrics.themes.totalThemes}`)
           .text(`Taille moyenne des thèmes : ${results.metrics.themes.averageThemeSize} avis`)
           .moveDown();

        doc.text('Top 5 des thèmes principaux :');
        results.metrics.themes.themeDistribution.slice(0, 5).forEach((theme, index) => {
          doc.text(`${index + 1}. ${theme.name} : ${theme.size} avis (${theme.percentage.toFixed(1)}%)`);
          if (theme.keywords && theme.keywords.length > 0) {
            doc.text(`    Mots-clés : ${theme.keywords.map(k => k.word).join(', ')}`);
          }
        });
        doc.moveDown(2);
      }

      // Distribution détaillée
      if (results.metrics.distribution) {
        addSection(doc, 'DISTRIBUTION DÉTAILLÉE', 14);
        
        doc.fontSize(11).text('Répartition par intensité de sentiment :');
        results.metrics.distribution.scoreRanges.forEach(range => {
          if (range.count > 0) {
            doc.text(`  • ${range.range} : ${range.count} avis (${range.percentage.toFixed(1)}%)`);
          }
        });
        doc.moveDown();

        doc.text('Répartition par confiance d\'analyse :');
        results.metrics.distribution.confidenceDistribution.forEach(conf => {
          if (conf.count > 0) {
            doc.text(`  • ${conf.range} : ${conf.count} avis (${conf.percentage.toFixed(1)}%)`);
          }
        });
        doc.moveDown(2);
      }

      // Insights et recommandations
      addSection(doc, 'INSIGHTS ET RECOMMANDATIONS', 14);
      
      if (results.insights && results.insights.length > 0) {
        results.insights.filter(i => i.type !== 'summary').forEach((insight, index) => {
          const emoji = getInsightEmoji(insight.type);
          doc.fontSize(11).font('Helvetica-Bold')
             .text(`${emoji} ${insight.title}`);
          
          doc.font('Helvetica').fontSize(10)
             .text(insight.description)
             .moveDown(0.5);

          // Exemples
          if (insight.examples && insight.examples.length > 0) {
            doc.fontSize(9).text('Exemples :');
            insight.examples.slice(0, 2).forEach(example => {
              const text = example.text.length > 100 ? 
                example.text.substring(0, 100) + '...' : example.text;
              doc.text(`  "${text}" (score: ${example.score?.toFixed(2) || 'N/A'})`);
            });
            doc.moveDown(0.5);
          }

          // Mots-clés
          if (insight.keywords && insight.keywords.length > 0) {
            doc.fontSize(9).text(`Mots-clés : ${insight.keywords.map(k => k.word || k).join(', ')}`);
            doc.moveDown();
          }
        });
      }

      // Méthodologie
      if (doc.y > 700) doc.addPage();
      
      addSection(doc, 'MÉTHODOLOGIE', 14);
      doc.fontSize(10)
         .text('Cette analyse a été réalisée avec les outils suivants :')
         .text('• Modèle de sentiment : DistilBERT (Hugging Face)')
         .text('• Modèle d\'embeddings : all-MiniLM-L6-v2')
         .text('• Clustering : Similarité cosinus avec seuil 0.7')
         .text('• Prétraitement : Nettoyage, lemmatisation, prise en compte des emojis')
         .moveDown();

      doc.text('Échelle des scores :')
         .text('• Score de sentiment : -1 (très négatif) à +1 (très positif)')
         .text('• Confiance : 0 (incertain) à 1 (très confiant)')
         .text('• Seuils : Positif > 0.1, Neutre [-0.1, 0.1], Négatif < -0.1');

      // Pied de page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Page ${i + 1} sur ${pageCount} - Analyse générée par Plateforme d'Analyse Sémantique`,
          50, doc.page.height - 50, { align: 'center' }
        );
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

// Génération du fichier Excel
async function generateExcel(results) {
  const workbook = new ExcelJS.Workbook();

  // Métadonnées
  workbook.creator = 'Plateforme d\'Analyse Sémantique';
  workbook.created = new Date();

  // Feuille 1: Résumé
  const summarySheet = workbook.addWorksheet('Résumé');
  await createSummarySheet(summarySheet, results);

  // Feuille 2: Détail des sentiments
  const sentimentSheet = workbook.addWorksheet('Détail Sentiments');
  await createSentimentDetailSheet(sentimentSheet, results);

  // Feuille 3: Analyse thématique
  const themeSheet = workbook.addWorksheet('Thèmes');
  await createThemeSheet(themeSheet, results);

  // Feuille 4: Distribution
  const distributionSheet = workbook.addWorksheet('Distribution');
  await createDistributionSheet(distributionSheet, results);

  // Feuille 5: Données brutes
  const rawDataSheet = workbook.addWorksheet('Données Brutes');
  await createRawDataSheet(rawDataSheet, results);

  return await workbook.xlsx.writeBuffer();
}

// Création de la feuille résumé
async function createSummarySheet(sheet, results) {
  // Style d'en-tête
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };

  // Titre
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'RAPPORT D\'ANALYSE DE SENTIMENTS';
  sheet.getCell('A1').style = {
    font: { bold: true, size: 16 },
    alignment: { horizontal: 'center' }
  };

  // Informations générales
  sheet.getCell('A3').value = 'Date d\'analyse :';
  sheet.getCell('B3').value = new Date().toLocaleDateString('fr-FR');
  sheet.getCell('A4').value = 'Heure d\'analyse :';
  sheet.getCell('B4').value = new Date().toLocaleTimeString('fr-FR');

  if (results.metrics.sentiment) {
    const sentiment = results.metrics.sentiment;
    
    // Métriques principales
    sheet.getCell('A6').value = 'MÉTRIQUES PRINCIPALES';
    sheet.getCell('A6').style = headerStyle;
    sheet.mergeCells('A6:B6');

    const mainMetrics = [
      ['Total d\'avis analysés', sentiment.total],
      ['Score global de sentiment', sentiment.globalScore],
      ['Interprétation', sentiment.interpretation],
      ['Confiance moyenne', `${(sentiment.avgConfidence * 100).toFixed(1)}%`]
    ];

    mainMetrics.forEach((metric, index) => {
      const row = 7 + index;
      sheet.getCell(`A${row}`).value = metric[0];
      sheet.getCell(`B${row}`).value = metric[1];
    });

    // Répartition des sentiments
    sheet.getCell('A12').value = 'RÉPARTITION DES SENTIMENTS';
    sheet.getCell('A12').style = headerStyle;
    sheet.mergeCells('A12:C12');

    sheet.getCell('A13').value = 'Sentiment';
    sheet.getCell('B13').value = 'Nombre';
    sheet.getCell('C13').value = 'Pourcentage';
    ['A13', 'B13', 'C13'].forEach(cell => {
      sheet.getCell(cell).style = { font: { bold: true } };
    });

    const sentimentData = [
      ['Positif', sentiment.counts.positif, `${sentiment.percentages.positif.toFixed(1)}%`],
      ['Négatif', sentiment.counts.négatif, `${sentiment.percentages.négatif.toFixed(1)}%`],
      ['Neutre', sentiment.counts.neutre, `${sentiment.percentages.neutre.toFixed(1)}%`]
    ];

    sentimentData.forEach((data, index) => {
      const row = 14 + index;
      sheet.getCell(`A${row}`).value = data[0];
      sheet.getCell(`B${row}`).value = data[1];
      sheet.getCell(`C${row}`).value = data[2];
      
      // Couleur selon le sentiment
      const color = data[0] === 'Positif' ? 'FF90EE90' : 
                   data[0] === 'Négatif' ? 'FFFF6B6B' : 'FFFFD700';
      sheet.getCell(`A${row}`).style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
      };
    });
  }

  // Auto-ajustement des colonnes
  sheet.columns.forEach(column => {
    column.width = 20;
  });
}

// Création de la feuille détail sentiments
async function createSentimentDetailSheet(sheet, results) {
  if (!results.sentiments) return;

  // En-têtes
  const headers = ['ID', 'Texte Original', 'Sentiment', 'Score', 'Confiance', 'Texte Traité'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
      font: { color: { argb: 'FFFFFFFF' } }
    };
  });

  // Données
  results.sentiments.forEach((item, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = item.id;
    sheet.getCell(row, 2).value = item.text;
    sheet.getCell(row, 3).value = item.sentiment;
    sheet.getCell(row, 4).value = item.score;
    sheet.getCell(row, 5).value = item.confidence;
    sheet.getCell(row, 6).value = item.processedText || '';

    // Couleur selon le sentiment
    const sentimentColor = item.sentiment === 'positif' ? 'FF90EE90' :
                          item.sentiment === 'négatif' ? 'FFFF6B6B' : 'FFFFD700';
    
    sheet.getCell(row, 3).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sentimentColor } }
    };
  });

  // Ajustement des colonnes
  sheet.getColumn(2).width = 50; // Texte original
  sheet.getColumn(6).width = 40; // Texte traité
  [1, 3, 4, 5].forEach(col => {
    sheet.getColumn(col).width = 15;
  });
}

// Création de la feuille thèmes
async function createThemeSheet(sheet, results) {
  if (!results.metrics.themes) return;

  const themes = results.metrics.themes.themeDistribution;

  // En-têtes
  const headers = ['Thème', 'Taille', 'Pourcentage', 'Mots-clés', 'Exemples'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
      font: { color: { argb: 'FFFFFFFF' } }
    };
  });

  // Données
  themes.forEach((theme, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = theme.name;
    sheet.getCell(row, 2).value = theme.size;
    sheet.getCell(row, 3).value = `${theme.percentage.toFixed(1)}%`;
    
    const keywords = theme.keywords?.map(k => k.word || k).join(', ') || '';
    sheet.getCell(row, 4).value = keywords;
    
    const examples = theme.examples?.join(' | ') || '';
    sheet.getCell(row, 5).value = examples;
  });

  // Ajustement des colonnes
  [1, 4, 5].forEach(col => {
    sheet.getColumn(col).width = 30;
  });
  [2, 3].forEach(col => {
    sheet.getColumn(col).width = 15;
  });
}

// Création de la feuille distribution
async function createDistributionSheet(sheet, results) {
  if (!results.metrics.distribution) return;

  // Distribution par confiance
  const startRow = 4 + results.metrics.distribution.scoreRanges.length + 2;
  sheet.getCell(`A${startRow}`).value = 'DISTRIBUTION PAR CONFIANCE D\'ANALYSE';
  sheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 14 } };

  sheet.getCell(`A${startRow + 2}`).value = 'Plage de confiance';
  sheet.getCell(`B${startRow + 2}`).value = 'Nombre';
  sheet.getCell(`C${startRow + 2}`).value = 'Pourcentage';

  results.metrics.distribution.confidenceDistribution.forEach((conf, index) => {
    const row = startRow + 3 + index;
    sheet.getCell(row, 1).value = conf.range;
    sheet.getCell(row, 2).value = conf.count;
    sheet.getCell(row, 3).value = `${conf.percentage.toFixed(1)}%`;
  });

  // Ajustement des colonnes
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;
}

// Création de la feuille données brutes
async function createRawDataSheet(sheet, results) {
  if (!results.sentiments) return;

  // En-têtes étendues
  const headers = [
    'ID', 'Texte Original', 'Texte Traité', 'Sentiment', 'Score', 'Confiance',
    'Longueur Texte', 'Mots Clés Détectés', 'Emojis Détectés', 'Métadonnées'
  ];

  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
      font: { color: { argb: 'FFFFFFFF' } }
    };
  });

  // Données détaillées
  results.sentiments.forEach((item, index) => {
    const row = index + 2;
    
    sheet.getCell(row, 1).value = item.id;
    sheet.getCell(row, 2).value = item.text;
    sheet.getCell(row, 3).value = item.processedText || '';
    sheet.getCell(row, 4).value = item.sentiment;
    sheet.getCell(row, 5).value = item.score;
    sheet.getCell(row, 6).value = item.confidence;
    sheet.getCell(row, 7).value = item.text.length;
    
    // Détection d'emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = item.text.match(emojiRegex) || [];
    sheet.getCell(row, 9).value = emojis.join(' ');
    
    // Mots-clés basiques (mots > 4 caractères)
    const keywords = item.processedText ? 
      item.processedText.split(' ').filter(word => word.length > 4).slice(0, 5).join(', ') : '';
    sheet.getCell(row, 8).value = keywords;
    
    // Métadonnées
    const metadata = item.metadata ? JSON.stringify(item.metadata) : '';
    sheet.getCell(row, 10).value = metadata;

    // Formatage conditionnel
    const sentimentColor = item.sentiment === 'positif' ? 'FF90EE90' :
                          item.sentiment === 'négatif' ? 'FFFF6B6B' : 'FFFFD700';
    
    sheet.getCell(row, 4).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sentimentColor } }
    };

    // Formatage du score
    if (item.score > 0.5) {
      sheet.getCell(row, 5).style = { font: { color: { argb: 'FF008000' } } };
    } else if (item.score < -0.5) {
      sheet.getCell(row, 5).style = { font: { color: { argb: 'FFFF0000' } } };
    }
  });

  // Ajustement des colonnes
  sheet.getColumn(2).width = 50; // Texte original
  sheet.getColumn(3).width = 40; // Texte traité
  sheet.getColumn(8).width = 30; // Mots-clés
  sheet.getColumn(9).width = 15; // Emojis
  sheet.getColumn(10).width = 25; // Métadonnées
  [1, 4, 5, 6, 7].forEach(col => {
    sheet.getColumn(col).width = 15;
  });
}

// Fonctions utilitaires

function addSection(doc, title, fontSize = 14) {
  if (doc.y > 700) doc.addPage();
  
  doc.fontSize(fontSize).font('Helvetica-Bold')
     .text(title)
     .moveDown(0.5);
}

function getInsightEmoji(type) {
  const emojis = {
    positive: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    summary: '📊'
  };
  return emojis[type] || '•';
}

// Utilitaire pour créer des graphiques simples en texte ASCII (optionnel)
function createTextChart(data, maxWidth = 40) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return data.map(item => {
    const barLength = Math.round((item.value / maxValue) * maxWidth);
    const bar = '█'.repeat(barLength);
    const percentage = ((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
    return `${item.label.padEnd(15)} ${bar} ${percentage}%`;
  }).join('\n');
}

// Validation des données avant export
function validateExportData(results) {
  const errors = [];
  
  if (!results) {
    errors.push('Aucune donnée à exporter');
    return errors;
  }
  
  if (!results.sentiments || results.sentiments.length === 0) {
    errors.push('Aucun résultat de sentiment à exporter');
  }
  
  if (!results.metrics) {
    errors.push('Métriques manquantes');
  }
  
  return errors;
}

// Fonction d'export avec gestion d'erreurs
async function safeGeneratePDF(results) {
  const errors = validateExportData(results);
  if (errors.length > 0) {
    throw new Error(`Erreurs de validation : ${errors.join(', ')}`);
  }
  
  try {
    return await generatePDF(results);
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    throw new Error(`Échec de génération PDF : ${error.message}`);
  }
}

async function safeGenerateExcel(results) {
  const errors = validateExportData(results);
  if (errors.length > 0) {
    throw new Error(`Erreurs de validation : ${errors.join(', ')}`);
  }
  
  try {
    return await generateExcel(results);
  } catch (error) {
    console.error('Erreur génération Excel:', error);
    throw new Error(`Échec de génération Excel : ${error.message}`);
  }
}

module.exports = {
  generatePDF: safeGeneratePDF,
  generateExcel: safeGenerateExcel,
  validateExportData,
  createTextChart
}; score
  sheet.getCell('A1').value = 'DISTRIBUTION PAR INTENSITÉ DE SENTIMENT';
  sheet.getCell('A1').style = { font: { bold: true, size: 14 } };

  sheet.getCell('A3').value = 'Plage de score';
  sheet.getCell('B3').value = 'Nombre';
  sheet.getCell('C3').value = 'Pourcentage';

  results.metrics.distribution.scoreRanges.forEach((range, index) => {
    const row = 4 + index;
    sheet.getCell(row, 1).value = range.range;
    sheet.getCell(row, 2).value = range.count;
    sheet.getCell(row, 3).value = `${range.percentage.toFixed(1)}%`;
  });

  // Distribution par