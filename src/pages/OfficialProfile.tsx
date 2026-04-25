import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, TrendingUp, Settings, 
  Calendar as CalendarIcon, 
  Wallet, Trophy, LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { GeneralErrorBoundary } from "@/components/GeneralErrorBoundary";

// Modularized Components
import { ProfileSummaryCard } from "@/components/official/ProfileSummaryCard";
import { StatsManager } from "@/components/official/StatsManager";
import { PlayerManagement } from "@/components/official/PlayerManagement";
import { MatchPerformanceRecorder } from "@/components/official/MatchPerformanceRecorder";
import { ContributionManagement } from "@/components/official/ContributionManagement";
import { FinanceManagement } from "@/components/official/FinanceManagement";
import { FanManagement } from "@/components/official/FanManagement";
import { LeagueStandings } from "@/components/official/LeagueStandings";
import { TrainingRecorder } from "@/components/official/TrainingRecorder";
import { GalleryManagement } from "@/components/official/GalleryManagement";
import { JerseyWashing } from "@/components/official/JerseyWashing";

const OfficialProfile = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const isManager = profile?.role === "manager" || profile?.id === "fadhir-id";
  const isFadhir = profile?.id === "fadhir-id" || profile?.role === "manager";
  const isVictor = profile?.id === "victor-id" || profile?.role === "manager";

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12 bg-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <GeneralErrorBoundary>
            <ProfileSummaryCard />
          </GeneralErrorBoundary>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <TabsList className="bg-secondary/50 p-1 h-auto flex flex-wrap md:flex-nowrap">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-heading text-xs py-2">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </TabsTrigger>
                {(isManager || isFadhir) && (
                  <TabsTrigger value="finance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-heading text-xs py-2">
                    <Wallet className="w-4 h-4 mr-2" /> Finance
                  </TabsTrigger>
                )}
                {isManager && (
                  <TabsTrigger value="squad" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-heading text-xs py-2">
                    <Users className="w-4 h-4 mr-2" /> Squad
                  </TabsTrigger>
                )}
                <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-heading text-xs py-2">
                  <TrendingUp className="w-4 h-4 mr-2" /> Stats
                </TabsTrigger>
                {isManager && (
                  <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-heading text-xs py-2">
                    <Settings className="w-4 h-4 mr-2" /> System
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <GeneralErrorBoundary>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <StatsManager />
                    </motion.div>
                  </GeneralErrorBoundary>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <GeneralErrorBoundary>
                      <LeagueStandings />
                    </GeneralErrorBoundary>
                    <GeneralErrorBoundary>
                      <TrainingRecorder />
                    </GeneralErrorBoundary>
                  </div>

                  <GeneralErrorBoundary>
                    <GalleryManagement />
                  </GeneralErrorBoundary>
                </div>

                <div className="space-y-8">
                  <GeneralErrorBoundary>
                    <MatchPerformanceRecorder />
                  </GeneralErrorBoundary>
                  
                  {isVictor && (
                    <GeneralErrorBoundary>
                      <JerseyWashing />
                    </GeneralErrorBoundary>
                  )}

                  <Card className="bg-card border-border card-glow">
                    <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Training Attendance</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground font-body">Attendance synchronization in progress...</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="finance">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <GeneralErrorBoundary>
                    <FinanceManagement />
                  </GeneralErrorBoundary>
                </div>
                <div>
                  <GeneralErrorBoundary>
                    <ContributionManagement />
                  </GeneralErrorBoundary>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="squad">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <GeneralErrorBoundary>
                    <PlayerManagement />
                  </GeneralErrorBoundary>
                </div>
                <div>
                  <GeneralErrorBoundary>
                    <FanManagement />
                  </GeneralErrorBoundary>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-card border-border card-glow min-h-[600px]">
                    <CardHeader><CardTitle className="font-heading text-xl text-foreground flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Advanced Player Analytics</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground font-body">Visualizing player impact and performance metrics across the season.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-8">
                  <Card className="bg-card border-border card-glow">
                    <CardHeader><CardTitle className="font-heading text-lg text-foreground">Top Performers</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                        <span className="font-heading text-sm">Most Goals</span>
                        <Badge className="bg-primary">N/A</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="bg-card border-border card-glow">
                    <CardHeader>
                      <CardTitle className="font-heading text-xl text-foreground flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-destructive" /> System Administration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 font-body">
                      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                        <h4 className="font-heading text-destructive mb-2">Critical Actions</h4>
                        <p className="text-sm text-muted-foreground mb-4">These actions affect global data and cannot be undone.</p>
                        <div className="flex gap-4">
                          <Button variant="destructive" size="sm">Export All Data</Button>
                          <Button variant="outline" size="sm">Audit Logs</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default OfficialProfile;
