"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { useEffect, useRef, type ReactNode } from "react";

import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR = `
a[href],
button:not([disabled]),
textarea:not([disabled]),
input:not([disabled]),
select:not([disabled]),
[tabindex]:not([tabindex="-1"])
`;

const SIZE_CLASSES = {
  sm: "w-72",
  md: "w-80",
  lg: "w-96",
  xl: "w-[32rem]",
} as const;

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  size?: keyof typeof SIZE_CLASSES;
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  ariaLabel?: string;
  dismissable?: boolean;
}

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  size = "md",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true,
}: DrawerProps) {
  const reduce = useReducedMotion();

  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement;

    requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.tabIndex !== -1 &&
          element.offsetParent !== null,
      );

      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === panel) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;

      previousFocus.current?.focus();
    };
  }, [open, onOpenChange]);

  const offscreen = side === "right" ? "100%" : "-100%";

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close drawer"
            tabIndex={dismissable ? 0 : -1}
            onClick={() => dismissable && onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: EASE_OUT,
            }}
            className={cn(
              "absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-sm",
              backdropClassName,
            )}
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { x: offscreen }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: offscreen }}
            transition={
              reduce
                ? {
                  duration: 0.2,
                  ease: EASE_OUT,
                }
                : SPRING_PANEL
            }
            className={cn(
              "absolute inset-y-0 flex max-w-[85vw] flex-col bg-background shadow-2xl",
              SIZE_CLASSES[size],
              side === "right"
                ? "right-0 border-l border-border"
                : "left-0 border-r border-border",
              className,
            )}
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
