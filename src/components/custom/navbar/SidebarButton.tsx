"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/motion/drawer";

export const SidebarButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="left"
        size="md"
        ariaLabel="Navigation"
      >
        <div className="p-4">Sidebar Content</div>
      </Drawer>
    </>
  );
}
