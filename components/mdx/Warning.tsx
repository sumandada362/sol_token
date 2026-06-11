import type { ReactNode } from "react";

export function Warning({ children }: { children: ReactNode }) {
  return <div className="mdx-warning">{children}</div>;
}
