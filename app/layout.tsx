import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import FirebaseSetup from '@/components/FirebaseSetup';
import VideoBackground from '@/components/VideoBackground';

export const metadata: Metadata = {
  title: 'Discord Clone',
  description: 'A Discord-like chat application with profile setup, workspaces, and private chats.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-black">
        <VideoBackground />
        {children}
        <FirebaseSetup />
      </body>
    </html>
  );
}
