/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["kepler.gl", "react-map-gl"],
};

module.exports = nextConfig;
