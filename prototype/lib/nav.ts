import { LayoutGrid, Users, FileStack, Activity } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/requests", label: "Document Requests", icon: FileStack },
  { href: "/app/activity", label: "Activity", icon: Activity },
] as const;
