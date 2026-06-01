import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";
import { Layout } from "@/components/layout";
import { AdminLayout } from "@/components/admin-layout";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { ADMIN_TOKEN_KEY } from "@/pages/admin";

// Restore admin token on app startup
const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
if (savedToken) {
  setAuthTokenGetter(() => localStorage.getItem(ADMIN_TOKEN_KEY));
}

import Home from "@/pages/home";
import Cart from "@/pages/cart";
import AdminLogin from "@/pages/admin";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPaintings from "@/pages/admin-paintings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/admin">
        <AdminLogin />
      </Route>
      <Route path="/admin/dashboard">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/paintings">
        <AdminLayout>
          <AdminPaintings />
        </AdminLayout>
      </Route>
      <Route path="/cart">
        <Layout>
          <Cart />
        </Layout>
      </Route>
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
