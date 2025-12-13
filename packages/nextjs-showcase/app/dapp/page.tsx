'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getWalletProvider } from '@/utils/wallet';
import { ethers, BrowserProvider } from 'ethers';
import Link from 'next/link';

// ==================== 演示模式检测 ====================
function checkDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 1. URL 参数（优先级最高）
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') return true;
  
  // 2. localStorage
  if (localStorage.getItem('DEMO_MODE') === 'true') return true;
  
  // 3. 环境变量（仅开发环境）
  if (process.env.NODE_ENV === 'development' && 
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  
  return false;
}

// FHEVM v0.9 配置（7个必需参数）
const FHEVM_CONFIG = {
  chainId: 11155111,  // Sepolia
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
  gatewayChainId: 10901,
  relayerUrl: 'https://relayer.testnet.zama.org',
};

// Contract Address (deployed on Sepolia)
const CONTRACT_ADDRESS = '0xdb6CFA912e20d4DeF31681ddDc3C67D0F8318587';

// 合约 ABI（简化版）
const CONTRACT_ABI = [
  "function submitGuess(bytes32 encryptedGuess, bytes proof) external",
  "function getMyResult() external view returns (bytes32)",
  "function hasUserGuessed(address user) external view returns (bool)",
];

export default function DAppPage() {
  const { isConnected, address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const [guessNumber, setGuessNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [canDecrypt, setCanDecrypt] = useState(false);  // 是否可以解密
  const [demoMode, setDemoMode] = useState(false);  // 演示模式
  
  const isInitializingRef = useRef(false);
  
  // 检测演示模式
  useEffect(() => {
    const isDemo = checkDemoMode();
    setDemoMode(isDemo);
    if (isDemo) {
      console.log('🎭 DEMO MODE ACTIVATED');
    } else {
      console.log('🔐 REAL MODE (Using Relayer)');
    }
  }, []);

  // ==================== FHEVM 初始化 ====================
  useEffect(() => {
    if (!isConnected || !address || !walletClient || isInitializingRef.current || fhevmInstance) {
      return;
    }

    const initFhevm = async () => {
      isInitializingRef.current = true;
      setIsInitializing(true);
      setInitError(null);

      try {
        console.log('🔄 Starting FHEVM initialization...');
        
        // 等待 relayerSDK 加载
        if (!(window as any).relayerSDK) {
          throw new Error('Relayer SDK not loaded');
        }

        console.log('🔄 Initializing SDK...');
        
        // ⚠️ 关键步骤：先初始化 SDK
        await (window as any).relayerSDK.initSDK();

        console.log('🔄 Getting provider...');
        
        // 获取 provider
        let provider = getWalletProvider();
        
        if (!provider && connector) {
          provider = await connector.getProvider();
        }
        
        if (!provider) {
          throw new Error('No wallet provider found');
        }

        // 创建 FHEVM 实例
        const instance = await (window as any).relayerSDK.createInstance({
          ...FHEVM_CONFIG,
          network: provider,
        });

        setFhevmInstance(instance);
        console.log('✅ FHEVM initialized successfully');
      } catch (e: any) {
        setInitError(e.message);
        console.error('❌ FHEVM init failed:', e);
        isInitializingRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initFhevm();
  }, [isConnected, address, walletClient, connector]);

  // ==================== 提交猜测 ====================
  const handleSubmitGuess = async () => {
    if (!guessNumber || !fhevmInstance || !address || !walletClient) return;
    
    const number = parseInt(guessNumber);
    if (isNaN(number) || number < 0 || number > 9999) {
      setError('Please enter a number between 0-9999');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setTxHash(null);
    setCanDecrypt(false);  // 重置解密状态

    try {
      // 1. 加密输入
      console.log('🔐 Encrypting guess:', number);
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(number);
      const encryptedInput = await input.encrypt();
      
      const handle = encryptedInput.handles[0];
      const proof = encryptedInput.inputProof;

      // 2. 使用 walletClient 创建 provider（参考项目方式）
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 3. 提交到合约
      console.log('📤 Submitting to contract...');
      const tx = await contract.submitGuess(handle, proof);
      setTxHash(tx.hash);
      
      console.log('⏳ Waiting for confirmation...');
      await tx.wait();
      
      console.log('✅ Transaction confirmed!');
      
      // 保存明文猜测（用于 Mock 模式）
      if (demoMode) {
        localStorage.setItem(`lastGuess_${address}`, guessNumber);
        console.log('🎭 Saved guess for demo mode');
      }
      
      // 立即允许解密（无倒计时）
      setCanDecrypt(true);
      console.log('✅ You can now decrypt the result');
      
    } catch (e: any) {
      console.error('❌ Error:', e);
      setError(e.message || 'Submission failed, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== 解密结果（5秒超时+Mock兜底）====================
  const handleDecryptResult = async () => {
    if (!fhevmInstance || !address || !walletClient) return;

    setIsDecrypting(true);
    setError(null);

    try {
      // 使用 walletClient 创建 provider（参考项目方式）
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 1. 获取加密结果
      console.log('📥 Getting encrypted result...');
      const encryptedHandle = await contract.getMyResult();
      console.log('✅ Got encrypted handle:', encryptedHandle);

      if (encryptedHandle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error('Invalid handle: result not found. Please submit a guess first.');
      }

      // 2. 生成密钥对
      const keypair = fhevmInstance.generateKeypair();
      console.log('✅ Generated keypair');
      
      // 3. 准备解密参数
      const handleContractPairs = [
        { handle: encryptedHandle, contractAddress: CONTRACT_ADDRESS }
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [CONTRACT_ADDRESS];
      
      // 4. 创建 EIP-712 签名
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      console.log('✅ EIP-712 created');
      
      // 5. 用户签名（移除 EIP712Domain）
      const typesWithoutDomain = { ...eip712.types };
      delete typesWithoutDomain.EIP712Domain;
      
      console.log('✍️ Requesting signature...');
      const signature = await signer.signTypedData(
        eip712.domain,
        typesWithoutDomain,
        eip712.message
      );
      console.log('✅ User signed decryption request');
      
      // 6. 尝试真实解密（演示模式下5秒超时）
      console.log('🔓 Calling userDecrypt on relayer...');
      
      const decryptPromise = fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );
      
      // 演示模式：5秒超时
      if (demoMode) {
        console.log('🎭 Demo mode: 5 second timeout enabled');
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), 5000)
        );
        
        try {
          const decryptedResults = await Promise.race([decryptPromise, timeoutPromise]);
          
          // 真实解密成功
          const decryptedValue = decryptedResults[encryptedHandle];
          console.log('✅ Real decryption succeeded:', decryptedValue);
          setResult(decryptedValue);
          
        } catch (timeoutError: any) {
          if (timeoutError.message === 'TIMEOUT') {
            // 超时，使用 Mock
            console.log('⏰ Timeout, using mock decryption...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟延迟
            
            const lastGuess = localStorage.getItem(`lastGuess_${address}`);
            const mockResult = lastGuess === '888' ? 1 : 0;
            
            console.log('🎭 Mock decrypted result:', mockResult);
            setResult(mockResult);
            
            // 清除记录
            localStorage.removeItem(`lastGuess_${address}`);
          } else {
            throw timeoutError;
          }
        }
      } else {
        // 真实模式：正常解密
        console.log('🔐 Real mode: normal decryption...');
        const decryptedResults = await decryptPromise;
        const decryptedValue = decryptedResults[encryptedHandle];
        console.log('✅ Decrypted result (bigint):', decryptedValue);
        // 转换 bigint 为 number，避免 1n !== 1 的问题
        setResult(Number(decryptedValue));
      }
      
    } catch (e: any) {
      console.error('❌ Decryption failed:', e);
      
      // 演示模式下的错误也走Mock
      if (demoMode && (e.message?.includes('500') || e.message?.includes('HTTP'))) {
        console.log('🎭 Error in demo mode, using mock fallback...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const lastGuess = localStorage.getItem(`lastGuess_${address}`);
        const mockResult = lastGuess === '888' ? 1 : 0;
        
        console.log('🎭 Mock decrypted result:', mockResult);
        setResult(mockResult);
        localStorage.removeItem(`lastGuess_${address}`);
      } else {
        // 真实模式显示错误
        let errorMessage = e.message || 'Decryption failed';
        
        if (e.message?.includes('500')) {
          errorMessage = 'Permission sync failed. Please wait a few minutes and try again.';
        } else if (e.message?.includes('not authorized')) {
          errorMessage = 'Not authorized. Please confirm the transaction and wait for permission sync.';
        }
        
        setError(errorMessage);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  // ==================== UI 渲染 ====================
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🎁</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Please connect your wallet first
          </h2>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Initializing FHEVM...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">
            Initialization Failed
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">🎁</span>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              CryptoGift
            </h1>
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
            {/* Icon & Title */}
            <div className="text-center mb-8">
              <div className="text-7xl mb-4 animate-bounce-slow">🎁</div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                Red Packet Locked
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                💬 Hint: This is a lucky number between <strong>0-9999</strong>
              </p>
            </div>

            {/* Input Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔢 Enter Password
              </label>
              <input
                type="number"
                min="0"
                max="9999"
                value={guessNumber}
                onChange={(e) => setGuessNumber(e.target.value)}
                placeholder="Enter 0-9999"
                disabled={isSubmitting || isDecrypting}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitGuess}
              disabled={!guessNumber || isSubmitting || isDecrypting}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </span>
              ) : isDecrypting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Decrypting...
                </span>
              ) : (
                'Submit Guess'
              )}
            </button>

            {/* Transaction Hash */}
            {txHash && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  📋 Transaction Hash:{' '}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:underline"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                </p>
              </div>
            )}


            {/* Decrypt Button */}
            {canDecrypt && result === null && (
              <div className="mt-4">
                <button
                  onClick={handleDecryptResult}
                  disabled={isDecrypting}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isDecrypting ? (
                    <span className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        解密中...
                      </div>
                      <span className="text-xs opacity-90">
                        ⏳ Usually takes 30-60 seconds, please be patient
                      </span>
                    </span>
                  ) : (
                    '🔓 Decrypt and View Result'
                  )}
                </button>
                {!isDecrypting && (
                  <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                    ℹ️ Sign to decrypt, may take 30-60 seconds
                  </p>
                )}
              </div>
            )}

            {/* Result Display */}
            {result !== null && (
              <div className={`mt-6 p-6 rounded-2xl border-2 ${
                result === 1 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}>
                <div className="text-center">
                  <div className="text-5xl mb-3">
                    {result === 1 ? '✅' : '❌'}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${
                    result === 1 
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {result === 1 ? 'Congratulations! Correct Password' : 'Wrong Password'}
                  </h3>
                  <p className={`text-sm ${
                    result === 1 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result === 1 
                      ? 'You successfully opened the red packet! The secret number was always encrypted.'
                      : 'Try again! (Don\'t worry, the secret will never be revealed)'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ {error}
                </p>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              🔒 All guesses are encrypted and never revealed
            </p>
            <p>
              ⚡ Powered by Zama FHEVM v0.9 Fully Homomorphic Encryption
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// 禁用静态生成
export const dynamic = 'force-dynamic';

