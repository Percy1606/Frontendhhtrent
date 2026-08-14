import type { Metadata } from "next";
import { League_Spartan, Poppins, Montserrat, Inter, Plus_Jakarta_Sans } from "next/font/google";
import DomErrorBoundary from "@/components/DomErrorBoundary";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-spartan",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "HT-RENT",
  description: "Especialistas en ingeniería eléctrica en media tensión, subestaciones eléctricas y alquiler de equipos de alta confiabilidad en Piura, Chiclayo y Trujillo.",
  icons: {
    icon: "/img/Faviconhh.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${inter.variable} ${leagueSpartan.variable} ${poppins.variable} ${montserrat.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-[#1A1A1A] bg-white selection:bg-[#E63C46] selection:text-white">
        <DomErrorBoundary>{children}</DomErrorBoundary>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontSize: '16px',
              fontWeight: '800',
              padding: '16px 22px',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </body>
    </html>
  );
}
