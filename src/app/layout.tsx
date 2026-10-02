import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ПРЯМО — такси без посредников | комиссия 8% вместо 24–37%",
  description:
    "ПРЯМО — честный агрегатор такси: комиссия 8% фикс или 0% по подписке, прозрачный чек, рейтинг 2.0, живая карта спроса. Прямая связь водителя и пассажира.",
  keywords: [
    "такси",
    "агрегатор такси",
    "ПРЯМО",
    "альтернатива Яндекс Такси",
    "такси для водителей",
    "низкая комиссия такси",
  ],
  authors: [{ name: "ПРЯМО" }],
  openGraph: {
    title: "ПРЯМО — такси без посредников",
    description:
      "Комиссия 8% фикс или 0% с подпиской. Водитель видит выплату до принятия заказа — всегда.",
    siteName: "ПРЯМО",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
