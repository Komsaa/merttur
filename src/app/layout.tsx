import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "Mert Tur - Gölmarmara Okul ve Personel Servisi",
    template: "%s | Mert Tur",
  },
  description:
    "Gölmarmara ve Manisa bölgesinde güvenilir okul ve personel servis hizmetleri. 10+ araç, profesyonel şöförler.",
  keywords: ["okul servisi", "personel servisi", "Gölmarmara", "Manisa", "Mert Tur"],
  openGraph: {
    title: "Mert Tur - Gölmarmara Okul ve Personel Servisi",
    description: "Güvenilir ve profesyonel servis hizmeti",
    locale: "tr_TR",
    type: "website",
    url: "https://merttur.com",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1B2437",
              color: "#fff",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#DC2626", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
