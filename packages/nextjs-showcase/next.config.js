/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fhevm-sdk'],
  
  // CORS 头配置（FHEVM WebAssembly 必需）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',  // 改为 credentialless，允许跨域 fetch
          },
        ],
      },
    ];
  },
  
  // Webpack 配置（解决 MetaMask SDK 和 WalletConnect 依赖问题）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback：忽略 React Native 依赖
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 抑制警告
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /@react-native-async-storage/ },
      { module: /pino-pretty/ },
    ];
    
    return config;
  },
};

module.exports = nextConfig;

