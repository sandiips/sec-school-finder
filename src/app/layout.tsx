import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FeedbackWidget from '../components/FeedbackWidget';
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
  title: "School Advisor SG - Find Your Ideal Secondary School",
  description: "Compare and choose the best secondary school in Singapore based on your preferences. Explore CCAs, Sports, Culture fit, Affiliations and more to make an informed decision.",
  keywords: [
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
    title: 'School Advisor SG - Find Your Ideal Secondary School',
    description: 'Compare and choose the best secondary school in Singapore based on your preferences. Explore CCAs, Sports, Culture fit, Affiliations and more.',
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
    title: 'School Advisor SG - Find Your Ideal Secondary School',
    description: 'Compare and choose the best secondary school in Singapore based on your preferences.',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <FeedbackWidget />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
