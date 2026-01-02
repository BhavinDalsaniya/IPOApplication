/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    formats: ['image/webp'],
  },
  // Enable compression
  compress: true,
  // Optimize CSS
  optimizeCss: true,
}

module.exports = nextConfig
