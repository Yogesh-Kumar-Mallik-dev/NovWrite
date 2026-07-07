"use client";

import {
  MotionValue,
  useMotionValue,
} from "motion/react";
import {
  RefObject,
  useEffect,
} from "react";

export interface ElementScroll {
  /** Current scroll position in px. */
  scrollY: MotionValue<number>;

  /** Scroll progress (0..1). */
  progress: MotionValue<number>;

  /** Scrollbar thumb size (0..1). */
  thumbSize: MotionValue<number>;

  /** Maximum scroll distance in px. */
  maxScroll: MotionValue<number>;

  /** Whether the element is scrollable. */
  canScroll: MotionValue<boolean>;
}

export function useElementScroll(
  ref: RefObject<HTMLElement | null>,
): ElementScroll {
  const scrollY = useMotionValue(0);
  const progress = useMotionValue(0);

  const thumbSize = useMotionValue(1);
  const maxScroll = useMotionValue(0);
  const canScroll = useMotionValue(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = Math.max(
        0,
        el.scrollHeight - el.clientHeight,
      );

      scrollY.set(el.scrollTop);

      maxScroll.set(max);

      progress.set(
        max > 0
          ? el.scrollTop / max
          : 0,
      );

      thumbSize.set(
        Math.min(
          1,
          el.clientHeight /
          Math.max(el.scrollHeight, 1),
        ),
      );

      canScroll.set(max > 0);
    };

    update();

    const resizeObserver =
      new ResizeObserver(update);

    resizeObserver.observe(el);

    el.addEventListener(
      "scroll",
      update,
      {
        passive: true,
      },
    );

    return () => {
      resizeObserver.disconnect();

      el.removeEventListener(
        "scroll",
        update,
      );
    };
  }, [
    ref,
    scrollY,
    progress,
    thumbSize,
    maxScroll,
    canScroll,
  ]);

  return {
    scrollY,
    progress,
    thumbSize,
    maxScroll,
    canScroll,
  };
}
