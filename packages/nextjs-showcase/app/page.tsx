'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const demoParam = searchParams.get('demo');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎁</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              CryptoGift
            </h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="inline-block mb-6 animate-bounce-slow">
              <span className="text-8xl">🎁</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Secret Red Packet Challenge
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
              A mysterious number locks this red packet
            </p>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Only those who guess the password can open it
            </p>

            {/* Feature Tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <span className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                🔒 Fully Encrypted
              </span>
              <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                ⚡ Instant Feedback
              </span>
              <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                🔄 Unlimited Attempts
              </span>
            </div>

            {/* CTA Button */}
            {isConnected ? (
              <Link href={demoParam ? `/dapp?demo=${demoParam}` : '/dapp'}>
                <button className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Start Challenge →
                </button>
              </Link>
            ) : (
              <div className="inline-block">
                <ConnectButton />
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                Fully Homomorphic Encryption
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Powered by Zama FHEVM, your guesses and answers are encrypted end-to-end, never revealed
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                Absolutely Fair
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The secret is stored in an encrypted smart contract, no one can cheat or know it in advance
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                Simple & Fun
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Enter a number, submit your guess, and view the result instantly with no complex operations
              </p>
            </div>
          </div>

          {/* Tech Info */}
          <div className="mt-16 p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              🔧 Tech Stack
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-mono">
                FHEVM v0.9
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-mono">
                Sepolia Testnet
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-mono">
                Next.js 15
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-mono">
                RainbowKit
              </span>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  ⚠️ Multi-Wallet Conflict Notice
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  If you encounter FHEVM initialization failures, please try using <strong>incognito mode</strong> or a <strong>fresh browser environment</strong> to avoid multi-wallet extension conflicts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Built with ❤️ using FHEVM v0.9</p>
          <p className="mt-2">
            <a 
              href="https://docs.zama.org/fhevm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 dark:text-red-400 hover:underline"
            >
              Learn more about Zama →
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

