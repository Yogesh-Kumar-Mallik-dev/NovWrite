"use client";

import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const NavbarLayout = ({
  className,
  left,
  center,
  right,
}: NavbarProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "border-b bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-6">
        <div className="flex flex-1 items-center">
          {left}
        </div>

        <nav className="flex items-center justify-center gap-2">
          {center}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          {right}
        </div>
      </div>
    </header>
  );
}
