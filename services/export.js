const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Génération du PDF
async function generatePDF(results) {
  console.log('📄 Génération du PDF...');
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        console.log('✅ PDF généré');
        resolve(Buffer.concat(chunks));
      });
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
           .moveDown(2);
      }

      // Analyse thématique
      if (results.metrics.themes && results.metrics.themes.themeDistribution.length > 0) {
        addSection(doc, 'ANALYSE THÉMATIQUE', 14);
        
        doc.fontSize(11)
           .text(`Nombre de thèmes identifiés : ${results.metrics.themes.totalThemes}`)
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
              doc.text(`  "${text}"`);
            });
            doc.moveDown(0.5);
          }
        });
      }

      // Méthodologie
      if (doc.y > 700) doc.addPage();
      
      addSection(doc, 'MÉTHODOLOGIE', 14);
      doc.fontSize(10)
         .text('Cette analyse a été réalisée avec les outils suivants :')
         .text('• Analyse lexicale avec dictionnaire de mots positifs/négatifs')
         .text('• Détection et analyse des emojis')
         .text('• Clustering thématique par fréquence de mots-clés')
         .text('• Prise en compte des intensificateurs et négations')
         .moveDown();

      doc.text('Échelle des scores :')
         .text('• Score de sentiment : -1 (très négatif) à +1 (très positif)')
         .text('• Confiance : 0 (incertain) à 1 (très confiant)')
         .text('• Seuils : Positif > 0.2, Neutre [-0.2, 0.2], Négatif < -0.2');

      doc.end();

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      reject(error);
    }
  });
}

// Génération du fichier Excel
async function generateExcel(results) {
  console.log('📊 Génération du fichier Excel...');
  
  try {
    const workbook = new ExcelJS.Workbook();

    // Métadonnées
    workbook.creator = 'Plateforme d\'Analyse Sémantique';
    workbook.created = new Date();

    // Feuille 1: Résumé
    const summarySheet = workbook.addWorksheet('Résumé');
    await createSummarySheet(summarySheet, results);

    // Feuille 2: Détail des sentiments
    if (results.sentiments && results.sentiments.length > 0) {
      const sentimentSheet = workbook.addWorksheet('Détail Sentiments');
      await createSentimentDetailSheet(sentimentSheet, results);
    }

    // Feuille 3: Analyse thématique
    if (results.themes && results.themes.themes && results.themes.themes.length > 0) {
      const themeSheet = workbook.addWorksheet('Thèmes');
      await createThemeSheet(themeSheet, results);
    }

    console.log('✅ Excel généré');
    return await workbook.xlsx.writeBuffer();
    
  } catch (error) {
    console.error('❌ Erreur génération Excel:', error);
    throw error;
  }
}

// Création de la feuille résumé
async function createSummarySheet(sheet, results) {
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
    sheet.getCell('A6').style = { font: { bold: true } };

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
    sheet.getCell('A12').style = { font: { bold: true } };

    sheet.getCell('A13').value = 'Sentiment';
    sheet.getCell('B13').value = 'Nombre';
    sheet.getCell('C13').value = 'Pourcentage';

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
    });
  }

  // Auto-ajustement des colonnes
  sheet.columns.forEach(column => {
    column.width = 20;
  });
}

// Création de la feuille détail sentiments
async function createSentimentDetailSheet(sheet, results) {
  // En-têtes
  const headers = ['ID', 'Texte Original', 'Sentiment', 'Score', 'Confiance'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      font: { color: { argb: 'FFFFFFFF' } }
    };
  });

  // Données (limiter à 1000 pour éviter les fichiers trop lourds)
  const dataToExport = results.sentiments.slice(0, 1000);
  
  dataToExport.forEach((item, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = item.id;
    sheet.getCell(row, 2).value = item.text;
    sheet.getCell(row, 3).value = item.sentiment;
    sheet.getCell(row, 4).value = item.score;
    sheet.getCell(row, 5).value = item.confidence;

    // Couleur selon le sentiment
    const sentimentColor = item.sentiment === 'positif' ? 'FF90EE90' :
                          item.sentiment === 'négatif' ? 'FFFF6B6B' : 'FFFFD700';
    
    sheet.getCell(row, 3).style = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sentimentColor } }
    };
  });

  // Ajustement des colonnes
  sheet.getColumn(2).width = 50; // Texte original
  [1, 3, 4, 5].forEach(col => {
    sheet.getColumn(col).width = 15;
  });
}

// Création de la feuille thèmes
async function createThemeSheet(sheet, results) {
  const themes = results.themes.themes;

  // En-têtes
  const headers = ['Thème', 'Taille', 'Pourcentage', 'Mots-clés'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.style = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      font: { color: { argb: 'FFFFFFFF' } }
    };
  });

  // Données
  themes.forEach((theme, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = theme.name;
    sheet.getCell(row, 2).value = theme.size;
    
    const totalTexts = themes.reduce((sum, t) => sum + t.size, 0);
    const percentage = totalTexts > 0 ? (theme.size / totalTexts) * 100 : 0;
    sheet.getCell(row, 3).value = `${percentage.toFixed(1)}%`;
    
    const keywords = theme.keywords?.map(k => k.word || k).join(', ') || '';
    sheet.getCell(row, 4).value = keywords;
  });

  // Ajustement des colonnes
  [1, 4].forEach(col => {
    sheet.getColumn(col).width = 30;
  });
  [2, 3].forEach(col => {
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

module.exports = {
  generatePDF,
  generateExcel
};
