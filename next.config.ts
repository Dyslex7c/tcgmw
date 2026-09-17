import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Typecheck is run locally via npx tsc --noEmit; skipping it during Next build saves 6-10s on Vercel
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@x402": false,
      "@x402/core": false,
      "@x402/evm": false,
      "@x402/evm/upto/client": false,
      "@x402/evm/exact/client": false,
      "@metamask/connect-evm": false,
      "@walletconnect/ethereum-provider": false,
      accounts: false
    };

    // Suppress dynamic expression critical dependency warnings from third-party EVM chain definitions (e.g. ox/tempo)
    config.module = {
      ...(config.module || {}),
      exprContextCritical: false
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Critical dependency: the request of a dependency is an expression/
      },
      {
        module: /ox.*tempo/
      }
    ];

    return config;
  }
};

export default nextConfig;
