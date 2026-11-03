import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppProvider } from '@/lib/store';
import { Shell } from '@/components/shell';
import Dashboard from '@/pages/dashboard';
import Wedding from '@/pages/wedding';
import Budget from '@/pages/budget';
import Vendors from '@/pages/vendors';
import Assistant from '@/pages/assistant';
import Support from '@/pages/support';
import Family from '@/pages/family';
import Settings from '@/pages/settings';
import Onboarding from '@/pages/onboarding';

const queryClient = new QueryClient();

function Router() {
  const [loc] = useLocation();
  if (loc === '/onboarding') return <RoutedErrorBoundary><Onboarding /></RoutedErrorBoundary>;
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/wedding" component={Wedding} />
          <Route path="/budget" component={Budget} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/assistant" component={Assistant} />
          <Route path="/support" component={Support} />
          <Route path="/family" component={Family} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
