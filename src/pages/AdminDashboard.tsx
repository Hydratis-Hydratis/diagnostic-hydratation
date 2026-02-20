import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { DiagnosticsTable } from "@/components/admin/DiagnosticsTable";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { SupportRequests } from "@/components/admin/SupportRequests";
import logoHydratis from "@/assets/logo-hydratis.png";

const AdminDashboard = () => {
  const { loading, isAdmin, signOut } = useAdminAuth();

  if (loading || !isAdmin) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoHydratis} alt="Hydratis" className="h-8" />
          <h1 className="text-lg font-bold text-foreground">Admin</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
        </Button>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="support">Demandes d'aide</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="diagnostics"><DiagnosticsTable /></TabsContent>
          <TabsContent value="analytics"><AnalyticsCharts /></TabsContent>
          <TabsContent value="support"><SupportRequests /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
