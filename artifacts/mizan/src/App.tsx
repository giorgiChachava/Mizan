import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppProvider } from '@/lib/store';
import { Shell } from '@/components/shell';
import Dashboard from '@/pages/dashboard';
import Wedding from '@/pages/wedding';
import Budget from '@/pages/budget';
import Vendors from '@/pages/vendors';
import VendorDetail from '@/pages/vendor-detail';
import Invitations from '@/pages/invitations';
import InvitePage from '@/pages/invite';
import Settings from '@/pages/settings';

const queryClient = new QueryClient();

function Router() {
  const [loc] = useLocation();
  if (loc.startsWith('/invite/')) {
    return <RoutedErrorBoundary><Switch><Route path="/invite/:token" component={InvitePage} /></Switch></RoutedErrorBoundary>;
  }
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/wedding" component={Wedding} />
          <Route path="/budget" component={Budget} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/vendors/:id" component={VendorDetail} />
          <Route path="/invitations" component={Invitations} />
          <Route path="/settings" component={Settings} />
          <Route path="/onboarding"><Redirect to="/" /></Route>
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
