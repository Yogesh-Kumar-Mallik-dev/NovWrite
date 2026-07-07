"use client";

import { PropsWithChildren } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./query-provider";

const Provider = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ThemeProvider>
  )
};

export default Provider;
