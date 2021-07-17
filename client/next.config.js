module.exports = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    
    return {
      ...config,
      watchOptions: {
        poll: 10000 // Check for changes every second
      }
    }
  },
}
