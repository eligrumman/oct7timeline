/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["kepler.gl", "react-map-gl"],
  webpack: (config, { isServer }) => {
    // Ignore WebSocket and related modules - we don't use Parquet files
    // These are only needed by Kepler.gl's Parquet parser which we don't use
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      bufferutil: false,
      'utf-8-validate': false,
    };

    return config;
  },
};

module.exports = nextConfig;
