import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
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
    maxSize: 100 * 1024 * 1024
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
        
        if (result.columns && result.columns.length > 0) {
          setSelectedColumn(result.columns[0]);
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
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: fileInfo.preview,
          textColumn: selectedColumn
        }),
      });

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

  // Reset
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div className="header">
        <div className="container">
          <h1>🚀 Analyse Sémantique</h1>
          <p>Analysez vos avis clients avec l'intelligence artificielle</p>
        </div>
      </div>

      <div className="container">
        {/* Barre de progression */}
        {uploadStatus !== 'idle' && (
          <div className="card" style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b', marginTop: '8px' }}>
              {uploadStatus === 'uploading' && 'Téléchargement du fichier...'}
              {uploadStatus === 'uploaded' && 'Fichier traité, prêt pour l\'analyse'}
              {uploadStatus === 'analyzing' && 'Analyse en cours...'}
              {uploadStatus === 'completed' && 'Analyse terminée !'}
            </div>
            {uploadStatus !== 'idle' && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button onClick={resetAnalysis} className="btn btn-secondary">
                  Nouvelle Analyse
                </button>
              </div>
            )}
          </div>
        )}

        {/* Zone d'upload */}
        {uploadStatus === 'idle' && (
          <div className="card" style={{ marginTop: '32px' }}>
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="upload-icon">📊</div>
              <h3 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>
                {isDragActive 
                  ? 'Déposez votre fichier ici...' 
                  : 'Glissez-déposez votre fichier ou cliquez pour sélectionner'
                }
              </h3>
              <p style={{ color: '#64748b' }}>
                Formats supportés : CSV, Excel (.xlsx, .xls) - Taille max : 100MB
              </p>
              {file && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', display: 'inline-block' }}>
                  <p style={{ color: '#1d4ed8', fontWeight: '600' }}>
                    Fichier sélectionné : {file.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sélection de colonne */}
        {uploadStatus === 'uploaded' && fileInfo && (
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Configuration de l'analyse</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Sélectionnez la colonne contenant les avis :
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                >
                  <option value="">Choisir une colonne...</option>
                  {fileInfo.columns.map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Informations du fichier :
                </label>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <p><strong>Lignes :</strong> {fileInfo.rowCount}</p>
                  <p><strong>Colonnes :</strong> {fileInfo.columns.length}</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={startAnalysis}
                disabled={!selectedColumn}
                className="btn btn-primary"
                style={{ fontSize: '1.1rem', padding: '16px 32px' }}
              >
                🔍 Lancer l'Analyse
              </button>
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="alert alert-error">
            <strong>❌ Erreur :</strong> {error}
          </div>
        )}

        {/* Résultats de l'analyse */}
        {uploadStatus === 'completed' && analysisResults && (
          <div>
            {/* Résumé rapide */}
            <div className="card">
              <h2 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>
                📊 Résultats de l'Analyse
              </h2>
              
              {analysisResults.summary && analysisResults.metrics.sentiment && (
                <div className="results-grid">
                  <div className="metric-card">
                    <div className="metric-value">{analysisResults.summary.totalReviews}</div>
                    <div className="metric-label">Avis analysés</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value positive">
                      {analysisResults.metrics.sentiment.percentages.positif.toFixed(0)}%
                    </div>
                    <div className="metric-label">Positifs</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value negative">
                      {analysisResults.metrics.sentiment.percentages.négatif.toFixed(0)}%
                    </div>
                    <div className="metric-label">Négatifs</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-value neutral">
                      {analysisResults.metrics.sentiment.globalScore.toFixed(2)}
                    </div>
                    <div className="metric-label">Score Global</div>
                  </div>
                </div>
              )}
            </div>

            {/* Insights */}
            {analysisResults.insights && analysisResults.insights.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>💡 Insights Principaux</h3>
                {analysisResults.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ marginBottom: '8px', color: '#1e40af' }}>{insight.title}</h4>
                    <p style={{ color: '#64748b' }}>{insight.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Boutons de téléchargement */}
            {sessionId && (
              <div className="download-section">
                <h3 style={{ marginBottom: '8px' }}>📥 Télécharger les Résultats</h3>
                <p style={{ opacity: 0.9, marginBottom: '0' }}>
                  Exportez votre analyse complète avec métriques détaillées
                </p>
                
                <div className="download-buttons">
                  <a
                    href={`${API_BASE_URL}/export/pdf/${sessionId}`}
                    className="download-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 Rapport PDF
                  </a>
                  <a
                    href={`${API_BASE_URL}/export/excel/${sessionId}`}
                    className="download-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📊 Données Excel
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '32px 0', marginTop: '64px', textAlign: 'center' }}>
        <div className="container">
          <p>Plateforme d'Analyse Sémantique - Propulsée par l'IA</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
            Analyse avancée de sentiments et thématiques
          </p>
        </div>
      </div>
    </div>
  );
}
