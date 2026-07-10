"use client"

import { Button } from "@/components/motion/button/base";
import { SectionHeader } from "@/table/SectionHeader";
import { SpiritRootTable } from "@/table/SpiritRootstable";
import { ArrowRight } from "lucide-react";

const SpiritRootsPage = () => {
  return (
    <main className="p-6">
      <SectionHeader
        title="Spirit Roots"
        description="Manage every spirit root available in the novel."
        action={
          <Button
            variant="primary"
            size="md"
            ripple
            className="font-bold"
          >
            Add Spirit Root
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <SpiritRootTable />
    </main>
  );
};

export default SpiritRootsPage;
