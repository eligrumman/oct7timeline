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
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
