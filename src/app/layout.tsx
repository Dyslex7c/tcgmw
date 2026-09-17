import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AppKitProvider } from "@/context/AppKitProvider";

export const metadata: Metadata = {
  title: "AVOX — Real-Time Crypto Trading Card Game",
  description: "Web3 TCG where live crypto price feeds dictate in-battle card stats in real time. Powered by Pyth Oracle and Chainlink VRF.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,700&family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Michroma&family=Orbitron:wght@600;700;800;900&family=Oxanium:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700&family=Russo+One&family=Share+Tech+Mono&family=Syne:wght@700;800&family=Teko:wght@500;600;700&family=Unbounded:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          id="disable-telemetry"
          dangerouslySetInnerHTML={{
            __html: `window.ClientAnalytics=window.ClientAnalytics||{init:function(){},identify:function(){},PlatformName:{web:"web",ios:"ios",android:"android"},logEvent:function(){},logPageView:function(){},logMetric:function(){},logTrace:function(){},markStep:function(){},markStepOnce:function(){},incrementUjNavigation:function(){}};`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#07090E] text-slate-100 font-hanken selection:bg-emerald-500/30 selection:text-emerald-300">
        <AppKitProvider>
          <AppShell>{children}</AppShell>
        </AppKitProvider>
      </body>
    </html>
  );
}

