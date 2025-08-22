
import type { ReactNode } from "react";

// This layout is now handled by the route group at src/app/(dashboard)/layout.tsx
// This file can be deleted, but we'll keep it empty to be safe.
export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
