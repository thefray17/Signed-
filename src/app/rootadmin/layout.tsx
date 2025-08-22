
import React from 'react';

// This layout is now simpler because the main app shell handles the sidebar.
export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
