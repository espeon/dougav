/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.externals.push("bun:sqlite");
    return config;
  },
  experimental: {
    //dynamicIO: true,
    cpus: 4,
  },
};

export default nextConfig;
