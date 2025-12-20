import { Inter } from 'next/font/google';
import './globals.css';
import Layout from '@/components/Layout';
import BackgroundImageWrapper from '@/components/TravelBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PARV Tour & Travels - Booking Management System',
  description: 'Professional tour and travels booking management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <BackgroundImageWrapper>
          <div className="min-h-full">
            <Layout>{children}</Layout>
          </div>
        </BackgroundImageWrapper>
      </body>
    </html>
  );
}