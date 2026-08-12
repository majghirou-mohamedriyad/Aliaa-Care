import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "../AdminSidebar";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4 shrink-0 bg-background">
            <SidebarTrigger />
            <span className="font-serif text-lg text-foreground truncate">ALIAA Admin</span>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden w-full max-w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
