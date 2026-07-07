"use client";

import { usePathname } from "next/navigation";
import { navRegistry } from "@/refrence/navRegistry";

export const CentralNav = () => {
  const pathname = usePathname();

  const current = navRegistry.find((item) => item.href === pathname);

  return (
    <h1 className="text-lg font-semibold">
      {current?.label ?? "NovWrite"}
    </h1>
  );
}
