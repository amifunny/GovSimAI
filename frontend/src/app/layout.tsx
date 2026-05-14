import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GovSim AI · Multi-Agent Policy Simulator',
  description:
    'Evaluate Indian public policy with 8 specialized AI agents, RAG over policy PDFs, MCP tool adapters, policy battle mode, and a future simulator.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
