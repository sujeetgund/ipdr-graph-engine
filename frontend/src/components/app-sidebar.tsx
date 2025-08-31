"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  History,
  GitGraph,
  PanelLeft,
  FileClock,
  Trash2,
  BarChart3,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/use-reports";
import { Skeleton } from "./ui/skeleton";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center p-4 mx-2 mt-4 rounded-lg bg-sidebar-accent/50 text-center border border-dashed border-sidebar-border group-data-[collapsible=icon]:hidden">
    <BarChart3 className="w-10 h-10 mb-3 text-primary" />
    <h3 className="mb-1 text-sm font-semibold text-sidebar-foreground">
      Ready for Analysis
    </h3>
    <p className="mb-4 text-xs text-sidebar-foreground/70">
      Upload a file to generate and view your first graph report.
    </p>
    <Button asChild size="sm" className="w-full">
      <Link href="/">
        <Upload className="w-4 h-4 mr-2" />
        Upload File
      </Link>
    </Button>
  </div>
);

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { reports, isLoaded } = useReports();
  const recentReports = reports.slice(0, 5);

  return (
    <>
      <SidebarHeader className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center overflow-hidden">
          <Image
            src="/logo.png"
            alt="IPDR Graph Engine"
            height={36}
            width={36}
          />
          <h1 className="text-lg font-headline font-bold whitespace-nowrap group-data-[collapsible=icon]:hidden">
            IPDR Graph Engine
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/"}
              tooltip="Dashboard"
            >
              <Link href="/">
                <Home />
                <span className="group-data-[collapsible=icon]:hidden">
                  Dashboard
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/history")}
              tooltip="History"
            >
              <Link href="/history">
                <History />
                <span className="group-data-[collapsible=icon]:hidden">
                  History
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-4" />

        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2 font-code uppercase tracking-wider">
            <FileClock className="h-4 w-4" />
            Recent Reports
          </h2>
        </div>

        {!isLoaded ? (
          <div className="space-y-2 px-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : reports.length > 0 ? (
          <SidebarMenu>
            {recentReports.map((report) => (
              <SidebarMenuItem key={report.id}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`/report/${report.id}`)}
                  tooltip={report.fileName}
                >
                  <Link href={`/report/${report.id}`}>
                    <span className="truncate group-data-[collapsible=icon]:hidden font-code text-xs">
                      {report.fileName}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <EmptyState />
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground font-code">
          Built for CIIS 2025 Hackathon
        </p>
        <div
          className="flex items-center justify-center bg-primary/10 text-primary p-1"
          style={{
            boxShadow:
              "0 0 20px hsl(var(--primary)/0.35), inset 0 0 1px hsl(var(--primary)/0.2)",
          }}
        >
          <p className="">TEAM BRIGADE</p>
        </div>
      </SidebarFooter>
    </>
  );
}
