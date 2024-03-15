/** @type {import('next').NextConfig} */

import os from "os";

const nextConfig = {
    output: 'standalone',

    webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
        config.module.rules.push({
            test: /\.node$/,
            use: [
                {
                    loader: "nextjs-node-loader",
                    options: {
                        outputPath: config.output.path
                    }
                },
            ],
        });
        return config;
    }
};

export default nextConfig;
