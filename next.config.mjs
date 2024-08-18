/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    webpack: (config) => {
      config.externals.push("bun:sqlite");
      return config;
    },
  };
  
  export default nextConfig;