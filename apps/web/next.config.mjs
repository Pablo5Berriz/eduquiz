/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',

  transpilePackages: ['@eduquiz/auth', '@eduquiz/db', '@eduquiz/i18n', '@eduquiz/ui', '@eduquiz/utils'],

  experimental: {
    instrumentationHook: true,
  },

  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    if (isServer) {
      config.externals.push('@node-rs/argon2');
    }
    return config;
  },
};

export default nextConfig;
