import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/android-mobile.css";
import FeedbackWidget from '../components/FeedbackWidget';
import Footer from '../components/ui/Footer';
import { GoogleAnalytics } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School Advisor SG - PSLE AL Score & Secondary School Finder",
  description: "Find the best secondary school in Singapore using your PSLE AL Score. Compare cut-offs, sports, CCAs, and culture fit. Expert guidance for informed school selection decisions.",
  keywords: [
    "psle score",
    "al score",
    "psle al score",
    "secondary school psle score",
    "al score psle",
    "secondary school",
    "Singapore secondary schools",
    "PSLE cut-off scores",
    "school comparison",
    "CCAs",
    "sports achievements",
    "school culture",
    "integrated program",
    "IP schools",
    "school selection",
    "Singapore education"
  ],
  authors: [{ name: "School Advisor SG" }],
  creator: "School Advisor SG",
  publisher: "School Advisor SG",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_SG',
    url: 'https://schooladvisor.sg',
    siteName: 'School Advisor SG',
    title: 'School Advisor SG - PSLE AL Score & Secondary School Finder',
    description: 'Find the best secondary school in Singapore using your PSLE AL Score. Compare cut-offs, sports, CCAs, and culture fit for informed school selection.',
    images: [
      {
        url: '/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'School Advisor SG - Singapore Secondary School Finder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'School Advisor SG - PSLE AL Score & Secondary School Finder',
    description: 'Find the best secondary school in Singapore using your PSLE AL Score. Compare cut-offs, sports, CCAs, and culture fit.',
    images: ['/hero.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#007aff',
    'theme-color': '#007aff',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://schooladvisor.sg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        {/* Enhanced favicon configuration for production compatibility */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="msapplication-TileImage" content="/favicon.ico" />

        {/* Android detection script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                var isAndroid = /Android/i.test(navigator.userAgent);
                if (isAndroid) {
                  document.documentElement.classList.add('android-mobile');
                }
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
        <Footer />
        <FeedbackWidget />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
