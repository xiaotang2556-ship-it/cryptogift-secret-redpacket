import type { Metadata } from "next";
import Script from 'next/script';
import { ClientProviders } from '../components/ClientProviders';
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoGift - Secret Red Packet",
  description: "A privacy-preserving red packet challenge powered by FHEVM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* 加载 FHEVM Relayer SDK v0.3.0-5 (匹配 FHEVM v0.9) */}
        <Script
          src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
          strategy="beforeInteractive"
        />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

