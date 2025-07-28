import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useDropzone } from 'react-dropzone';
import Charts from '../components/Charts';
import Insights from '../components/Insights';
import DownloadButtons from '../components/DownloadButtons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, uploaded, analyzing, completed, error
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Configuration dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError(null);
      uploadFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  // Upload du fichier
  const uploadFile = async (file) => {
    setUploadStatus('uploading');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setFileInfo(result);
        setUploadStatus('uploaded');
        setProgress(30);
        
        // Auto-sélection de la première colonne texte probable
        if (result.columns && result.columns.length > 0) {
          const textColumn = findTextColumn(result.columns, result.preview);
          setSelectedColumn(textColumn || result.columns[0]);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setError(error.message);
      setUploadStatus('error');
      setProgress(0);
    }
  };

  // Recherche automatique de la colonne de texte
  const findTextColumn = (columns, preview) => {
    const textIndicators = ['avis', 'commentaire', 'review', 'comment', 'text', 'texte', 'message', 'feedback'];
    
    // Recherche par nom de colonne
    const columnByName = columns.find(col => 
      textIndicators.some(indicator => 
        col.toLowerCase().includes(indicator)
      )
    );
    
    if (columnByName) return columnByName;
    
    // Recherche par contenu (colonne avec le texte le plus long en moyenne)
    let bestColumn = columns[0];
    let maxAvgLength = 0;
    
    columns.forEach(col => {
      const lengths = preview.map(row => (row[col] || '').toString().length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      
      if (avgLength > maxAvgLength && avgLength > 20) {
        maxAvgLength = avgLength;
        bestColumn = col;
      }
    });
    
    return bestColumn;
  };

  // Lancement de l'analyse
  const startAnalysis = async () => {
    if (!fileInfo || !selectedColumn) {
      setError('Veuillez sélectionner une colonne à analyser');
      return;
    }

    setUploadStatus('analyzing');
    setProgress(50);
    setError(null);

    try {
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 500);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: fileInfo.preview, // En production, envoyer toutes les données
          textColumn: selectedColumn,
          options: {
            includeEmojis: true,
            detailedMetrics: true
          }
        }),
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (response.ok) {
        setAnalysisResults(result.results);
        setSessionId(result.sessionId);
        setUploadStatus('completed');
        setProgress(100);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'analyse');
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      setError(error.message);
      setUploadStatus('error');
      setProgress(0);
    }
  };

  // Reset pour nouvelle analyse
  const resetAnalysis = () => {
    setFile(null);
    setFileInfo(null);
    setSelectedColumn('');
    setAnalysisResults(null);
    setSessionId(null);
    setUploadStatus('idle');
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Analyse de Sentiments - Plateforme d'Analyse Sémantique</title>
        <meta name="description" content="Analysez vos avis clients avec notre IA avancée" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚀 Plateforme d'Analyse Sémantique
              </h1>
              <p className="text-gray-600 mt-1">
                Analysez vos avis clients avec l'intelligence artificielle
              </p>
            </div>
            {uploadStatus !== 'idle' && (
              <button
                onClick={resetAnalysis}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Nouvelle Analyse
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de progression */}
        {uploadStatus !== 'idle' && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {uploadStatus === 'uploading' && 'Téléchargement du fichier...'}
              {uploadStatus === 'uploaded' && 'Fichier traité, prêt pour l\'analyse'}
              {uploadStatus === 'analyzing' && 'Analyse en cours...'}
              {uploadStatus === 'completed' && 'Analyse terminée !'}
            </div>
          </div>
        )}

        {/* Zone d'upload */}
        {uploadStatus === 'idle' && (
          <div className="mb-12">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
            >
              <input {...getInputProps()} />
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {isDragActive 
                  ? 'Déposez votre fichier ici...' 
                  : 'Glissez-déposez votre fichier ou cliquez pour sélectionner'
                }
              </h3>
              <p className="text-gray-500">
                Formats supportés : CSV, Excel (.xlsx, .xls) - Taille max : 100MB
              </p>
              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                  <p className="text-blue-700 font-medium">
                    Fichier sélectionné : {file.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sélection de colonne */}
        {uploadStatus === 'uploaded' && fileInfo && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration de l'analyse</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez la colonne contenant les avis :
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choisir une colonne...</option>
                  {fileInfo.columns.map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informations du fichier :
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p><strong>Lignes :</strong> {fileInfo.rowCount}</p>
                  <p><strong>Colonnes :</strong> {fileInfo.columns.length}</p>
                </div>
              </div>
            </div>

            {/* Aperçu des données */}
            {fileInfo.preview && fileInfo.preview.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Aperçu des données :</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg">
                    <thead>
                      <tr>
                        {fileInfo.columns.slice(0, 4).map(column => (
                          <th key={column} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            {column}
                            {column === selectedColumn && (
                              <span className="ml-2 text-blue-600">✓</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fileInfo.preview.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-t">
                          {fileInfo.columns.slice(0, 4).map(column => (
                            <td key={column} className="px-4 py-2 text-sm text-gray-600">
                              {String(row[column] || '').substring(0, 100)}...
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={startAnalysis}
                disabled={!selectedColumn}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                🔍 Lancer l'Analyse
              </button>
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">❌</div>
              <div>
                <h4 className="font-medium text-red-800">Erreur</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Résultats de l'analyse */}
        {uploadStatus === 'completed' && analysisResults && (
          <div className="space-y-8">
            {/* Résumé rapide */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                📊 Résultats de l'Analyse
              </h2>
              
              {analysisResults.summary && (
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {analysisResults.summary.totalReviews}
                    </div>
                    <div className="text-blue-800 font-medium">Avis analysés</div>
                  </div>
                  
                  {analysisResults.metrics.sentiment && (
                    <>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {analysisResults.metrics.sentiment.percentages.positif.toFixed(0)}%
                        </div>
                        <div className="text-green-800 font-medium">Positifs</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">
                          {analysisResults.metrics.sentiment.globalScore.toFixed(2)}
                        </div>
                        <div className="text-purple-800 font-medium">Score Global</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Boutons de téléchargement */}
              {sessionId && (
                <DownloadButtons sessionId={sessionId} apiUrl={API_BASE_URL} />
              )}
            </div>

            {/* Graphiques */}
            <Charts data={analysisResults} />

            {/* Insights */}
            <Insights insights={analysisResults.insights} themes={analysisResults.themes} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              Plateforme d'Analyse Sémantique - Propulsée par l'IA
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Modèles : DistilBERT (sentiment) + all-MiniLM-L6-v2 (embeddings)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}