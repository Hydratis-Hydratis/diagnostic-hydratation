import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AdminOverview, type AnalyticsData } from "@/components/admin/AdminOverview";
import { AdminAcquisition } from "@/components/admin/AdminAcquisition";
import { AdminAbandons } from "@/components/admin/AdminAbandons";
import { AdminProfiles } from "@/components/admin/AdminProfiles";
import { AdminResults } from "@/components/admin/AdminResults";
import { DiagnosticsTable } from "@/components/admin/DiagnosticsTable";
import { SupportRequests } from "@/components/admin/SupportRequests";
import logoHydratis from "@/assets/logo-hydratis.png";

const AdminDashboard = () => {
  const { loading, isAdmin, signOut } = useAdminAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

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
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="abandons">Abandons</TabsTrigger>
            <TabsTrigger value="profiles">Profils</TabsTrigger>
            <TabsTrigger value="results">Résultats</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            <TabsTrigger value="support">Demandes d'aide</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview onDataLoaded={setAnalyticsData} />
          </TabsContent>
          <TabsContent value="acquisition">
            {analyticsData ? <AdminAcquisition data={analyticsData} /> : <p className="text-muted-foreground">Chargez d'abord la Vue d'ensemble</p>}
          </TabsContent>
          <TabsContent value="abandons">
            {analyticsData ? <AdminAbandons data={analyticsData} /> : <p className="text-muted-foreground">Chargez d'abord la Vue d'ensemble</p>}
          </TabsContent>
          <TabsContent value="profiles">
            {analyticsData ? <AdminProfiles data={analyticsData} /> : <p className="text-muted-foreground">Chargez d'abord la Vue d'ensemble</p>}
          </TabsContent>
          <TabsContent value="results">
            {analyticsData ? <AdminResults data={analyticsData} /> : <p className="text-muted-foreground">Chargez d'abord la Vue d'ensemble</p>}
          </TabsContent>
          <TabsContent value="diagnostics"><DiagnosticsTable /></TabsContent>
          <TabsContent value="support"><SupportRequests /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
