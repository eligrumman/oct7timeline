/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["kepler.gl", "react-map-gl"],
  webpack: (config, { isServer }) => {
    // Ignore optional peer dependencies used by kepler.gl's ws package
    // These are Node.js-only WebSocket optimization modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
    };

    // Also add externals to prevent webpack from trying to bundle them
    config.externals = config.externals || [];
    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });

    return config;
  },
};

module.exports = nextConfig;
