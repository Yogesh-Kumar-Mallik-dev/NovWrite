"use client";

import {
  MotionValue,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

// Slight lag so the thumb feels attached to the content instead of perfectly rigid.
const SCROLLBAR_SPRING = {
  stiffness: 120,
  damping: 30,
  mass: 0.6,
};

type CommonProps = {
  /** Scroll progress (0..1). */
  progress: MotionValue<number>;

  /** Thumb size (0..1). */
  thumbSize: MotionValue<number>;

  /** Spring-smooth the thumb movement. */
  spring?: boolean;

  /** Thickness in px. */
  thickness?: number;

  className?: string;
};

type VerticalProps = CommonProps & {
  orientation?: "vertical";
  position?: "left" | "right";
};

type HorizontalProps = CommonProps & {
  orientation: "horizontal";
  position?: "top" | "bottom";
};

export type ScrollbarProps =
  | VerticalProps
  | HorizontalProps;

function useScrollbarProgress(
  progress: MotionValue<number>,
  spring: boolean,
) {
  const reduce = useReducedMotion();
  const smooth = useSpring(
    progress,
    SCROLLBAR_SPRING,
  );

  return spring && !reduce
    ? smooth
    : progress;
}

const TRACK_POSITION = {
  top: "top-0 left-0 right-0",
  bottom: "bottom-0 left-0 right-0",

  left: "left-0 top-0 bottom-0",
  right: "right-0 top-0 bottom-0",
} as const;

export function ScrollIndicator({
  progress,
  thumbSize,
  spring = true,
  orientation = "vertical",
  position = "right",
  thickness = 3,
  className,
}: ScrollbarProps) {
  const value = useScrollbarProgress(
    progress,
    spring,
  );

  const translate = useTransform(
    [value, thumbSize],
    (values) => {
      const p = values[0] as number;
      const size = values[1] as number;

      return p * (1 - size) * 100;
    },
  );

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-50",
        TRACK_POSITION[position],
      )}
      style={
        orientation === "vertical"
          ? { width: thickness }
          : { height: thickness }
      }
    >
      <motion.div
        className={cn(
          "absolute rounded-full bg-primary",
          className,
        )}
        style={
          orientation === "vertical"
            ? {
              width: "100%",
              height: useTransform(
                thumbSize,
                (v) => `${v * 100}%`,
              ),
              y: useTransform(
                translate,
                (v) => `${v}%`,
              ),
            }
            : {
              height: "100%",
              width: useTransform(
                thumbSize,
                (v) => `${v * 100}%`,
              ),
              x: useTransform(
                translate,
                (v) => `${v}%`,
              ),
            }
        }
      />
    </div>
  );
}
