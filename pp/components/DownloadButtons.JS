import React, { useState } from 'react';

const DownloadButtons = ({ sessionId, apiUrl }) => {
  const [downloading, setDownloading] = useState({ pdf: false, excel: false });
  const [downloadStatus, setDownloadStatus] = useState({ pdf: null, excel: null });

  const downloadFile = async (format) => {
    if (!sessionId) {
      setDownloadStatus(prev => ({
        ...prev,
        [format]: { type: 'error', message: 'Aucune session active' }
      }));
      return;
    }

    setDownloading(prev => ({ ...prev, [format]: true }));
    setDownloadStatus(prev => ({ ...prev, [format]: null }));

    try {
      const response = await fetch(`${apiUrl}/export/${format}/${sessionId}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      // Téléchargement du fichier
      const blob = await response.blob();
      const filename = format === 'pdf' ? 'analyse-sentiments.pdf' : 'analyse-sentiments.xlsx';
      
      // Création du lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus(prev => ({
        ...prev,
        [format]: { type: 'success', message: 'Téléchargement réussi !' }
      }));

    } catch (error) {
      console.error(`Erreur téléchargement ${format}:`, error);
      setDownloadStatus(prev => ({
        ...prev,
        [format]: { type: 'error', message: error.message }
      }));
    } finally {
      setDownloading(prev => ({ ...prev, [format]: false }));
    }
  };

  const getButtonStyle = (format, isDownloading) => {
    const baseStyle = "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (isDownloading) {
      return `${baseStyle} bg-gray-400 text-white cursor-not-allowed`;
    }
    
    const styles = {
      pdf: `${baseStyle} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl`,
      excel: `${baseStyle} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl`
    };
    
    return styles[format];
  };

  const getStatusMessage = (format) => {
    const status = downloadStatus[format];
    if (!status) return null;

    const isError = status.type === 'error';
    const bgColor = isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700';
    const icon = isError ? '❌' : '✅';

    return (
      <div className={`mt-2 p-2 rounded-lg border text-sm ${bgColor}`}>
        <span className="mr-2">{icon}</span>
        {status.message}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            📥 Télécharger les Résultats
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Exportez votre analyse complète avec métriques détaillées et exemples
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Bouton PDF */}
        <div>
          <button
            onClick={() => downloadFile('pdf')}
            disabled={downloading.pdf}
            className={getButtonStyle('pdf', downloading.pdf)}
          >
            {downloading.pdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Génération...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L14 4.586A2 2 0 0012.586 4H10a2 2 0 00-2 2v1H6V4a2 2 0 012-2h2.586A2 2 0 0112 2.414L13.414 4H14a2 2 0 012 2v1h-2V6h-2V4H8v2H6V2z" clipRule="evenodd" />
                </svg>
                <span>Rapport PDF</span>
              </>
            )}
          </button>
          
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span>📄</span>
              <span>Rapport exécutif avec graphiques et insights</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span>🎯</span>
              <span>Métriques détaillées et exemples d'avis</span>
            </div>
          </div>
          
          {getStatusMessage('pdf')}
        </div>

        {/* Bouton Excel */}
        <div>
          <button
            onClick={() => downloadFile('excel')}
            disabled={downloading.excel}
            className={getButtonStyle('excel', downloading.excel)}
          >
            {downloading.excel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Génération...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Données Excel</span>
              </>
            )}
          </button>
          
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span>📊</span>
              <span>Données brutes avec calculs détaillés</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span>🔢</span>
              <span>Feuilles multiples pour analyse avancée</span>
            </div>
          </div>
          
          {getStatusMessage('excel')}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
          📋 Contenu des Exports
        </h4>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-red-700 mb-1">📄 Rapport PDF :</h5>
            <ul className="space-y-1 text-xs">
              <li>• Résumé exécutif et métriques clés</li>
              <li>• Graphiques de répartition des sentiments</li>
              <li>• Analyse thématique détaillée</li>
              <li>• Insights avec exemples d'avis</li>
              <li>• Recommandations stratégiques</li>
              <li>• Méthodologie et explications</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-green-700 mb-1">📊 Fichier Excel :</h5>
            <ul className="space-y-1 text-xs">
              <li>• Feuille résumé avec métriques</li>
              <li>• Détail sentiment par avis</li>
              <li>• Analyse thématique complète</li>
              <li>• Distribution et statistiques</li>
              <li>• Données brutes pour réanalyse</li>
              <li>• Formules et calculs transparents</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">💡</span>
            <div className="text-xs text-blue-700">
              <strong>Conseil :</strong> Le fichier Excel permet de faire des analyses complémentaires, 
              filtrer par thèmes ou segments, et suivre l'évolution dans le temps en combinant plusieurs exports.
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de session */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Session active : {sessionId ? sessionId.substring(0, 8) : 'N/A'}...</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Les exports restent disponibles pendant 1 heure après l'analyse
        </p>
      </div>
    </div>
  );
};

export default DownloadButtons;