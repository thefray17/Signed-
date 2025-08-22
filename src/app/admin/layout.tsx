// This file is deprecated. Layout logic is now handled by src/app/(dashboard)/layout.tsx.
// It is intentionally left empty to prevent routing errors.
import type { ReactNode } from "react";

export default function DeprecatedAdminLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
