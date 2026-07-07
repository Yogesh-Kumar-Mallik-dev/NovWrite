"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/motion/switch";
import { useThemeToggle } from "@/components/motion/theme-toggle";
import { THEME_SWITCH_DELAY } from "@/refrence/ease";
import { cn } from "@/lib/utils";

interface ThemeSwitchProps {
  className?: string;
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { isDark, mounted, toggle } = useThemeToggle({
    variant: "circle-blur",
    start: "bottom-up",
  });

  const [checked, setChecked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (mounted) {
      setChecked(isDark);
    }
  }, [mounted, isDark]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCheckedChange = (nextChecked: boolean) => {
    if (nextChecked === checked) return;

    setChecked(nextChecked);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      toggle();
      timeoutRef.current = null;
    }, THEME_SWITCH_DELAY);
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-7 w-12 animate-pulse rounded-full bg-muted",
          className,
        )}
      />
    );
  }

  return (
    <Switch
      className={className}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      thumb={
        checked ? (
          <Moon className="size-3 text-primary" />
        ) : (
          <Sun className="size-3 text-yellow-500" />
        )
      }
    />
  );
}
