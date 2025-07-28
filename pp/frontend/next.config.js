/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration pour l'export statique (optionnel)
  output: 'standalone',
  
  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  
  // Configuration des images (si nécessaire)
  images: {
    domains: ['localhost'],
    unoptimized: true, // Pour l'export statique
  },
  
  // Configuration des en-têtes de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configuration Webpack personnalisée (si nécessaire)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimisations pour Chart.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  
  // Redirection de l'API vers le backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;