import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamDataProvider } from "@/contexts/TeamDataContext";
import { LottieLoader } from "@/components/LottieAnimation";
import WhatsAppFAB from "./components/WhatsAppFAB";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Stats = lazy(() => import("./pages/Stats"));
const Results = lazy(() => import("./pages/Results"));
const Players = lazy(() => import("./pages/Players"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TeamDataProvider>
              <Suspense fallback={<LottieLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/players" element={<Players />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <WhatsAppFAB />
            </TeamDataProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
