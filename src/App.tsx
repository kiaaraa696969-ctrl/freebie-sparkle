import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAdBlockDetector } from "@/hooks/useAdBlockDetector";
import { AdBlockOverlay } from "@/components/AdBlockOverlay";
import Index from "./pages/Index";
import AccountDetail from "./pages/AccountDetail";
import AccountReveal from "./pages/AccountReveal";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Vip from "./pages/Vip";
import AboutFaq from "./pages/AboutFaq";
import NotFound from "./pages/NotFound";
import { AdsterraGlobalAds } from "@/components/AdsterraGlobalAds";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const { adBlockDetected, recheck } = useAdBlockDetector();

  return (
    <>
      {!isAdmin && adBlockDetected && <AdBlockOverlay onRecheck={recheck} />}
      {!isAdmin && <AdsterraGlobalAds />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/account/:slug" element={<AccountDetail />} />
        <Route path="/account/:slug/reveal" element={<AccountReveal />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/vip" element={<Vip />} />
        <Route path="/about" element={<AboutFaq />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
