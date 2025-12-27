/**
 * Root Layout
 *
 * The main layout component that wraps all pages
 * Includes Header, Providers, and global styles
 *
 * @module app/layout
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers/Providers";
import Header from "@/components/layout/Header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniBlox Store - Premium E-commerce",
  description:
    "Discover premium products with exclusive discounts. Every 5th order gets 10% off!",
  keywords: ["e-commerce", "online shopping", "discounts", "premium products"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
