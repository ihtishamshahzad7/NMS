import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";

export default function NocLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-y-auto scrollbar-thin">
        {children}
      </div>
      <CommandPalette />
    </div>
  );
}
