"use client";

import { PropsWithChildren } from "react";
import { ThemeProvider } from "./ThemeProvider";

const Provider = ({ children }: PropsWithChildren) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export default Provider;
