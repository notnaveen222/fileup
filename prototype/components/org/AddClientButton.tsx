"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddClientModal } from "@/components/org/AddClientModal";

export function AddClientButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus size={15} />
        Add client
      </Button>
      <AddClientModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
