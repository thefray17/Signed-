
import type { Metadata } from "next";
import { ClientProviders } from "@/components/providers/client-providers";
import "./globals.css";
import { PT_Sans } from "next/font/google";


const ptSans = PT_Sans({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-pt-sans" });


export const metadata: Metadata = {
title: "Signed!",
description: "Document Signing and Tracking System",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en" suppressHydrationWarning>
<body className={`${ptSans.variable} font-sans antialiased`}>
<ClientProviders>{children}</ClientProviders>
</body>
</html>
);
}
