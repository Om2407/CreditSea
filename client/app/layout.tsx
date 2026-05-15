import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LMS — Loan Management System',
  description: 'A complete loan management platform for borrowers and operations teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0a0a0f', color: '#f0f0f8', minHeight: '100vh' }}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#16161f',
                color: '#f0f0f8',
                border: '1px solid #2a2a3a',
                borderRadius: '10px',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#16161f' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
