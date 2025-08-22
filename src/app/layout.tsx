// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = { title: "Signed! — Shell Test" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh w-full antialiased">
        <div className="min-h-dvh w-full flex">
          {/* FORCE‑VISIBLE TEST SIDEBAR */}
          <aside className="w-64 shrink-0 bg-green-600 text-white p-3">
            <div className="font-bold mb-2">SIDEBAR TEST</div>
            <ul className="space-y-1 text-sm">
              <li><a href="/root">/root</a></li>
              <li><a href="/admin">/admin</a></li>
              <li><a href="/user">/user</a></li>
            </ul>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="h-12 border-b flex items-center px-3">Topbar</div>
            <main className="p-4">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
