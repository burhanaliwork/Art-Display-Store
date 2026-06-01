import { Link, useLocation } from "wouter";
import { useGetAdminMe, useAdminLogout, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { LayoutDashboard, Image as ImageIcon, LogOut, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: admin, isLoading, isError } = useGetAdminMe();
  const logout = useAdminLogout();

  useEffect(() => {
    if (!isLoading && (!admin?.loggedIn || isError)) {
      setLocation("/admin");
    }
  }, [admin, isLoading, isError, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
        setLocation("/admin");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admin?.loggedIn) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/30">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-l flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-serif font-bold text-primary">لوحة التحكم</h2>
          <p className="text-sm text-muted-foreground mt-1">مرحباً، {admin.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location === '/admin/dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">الرئيسية والإحصائيات</span>
          </Link>
          <Link href="/admin/paintings" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location === '/admin/paintings' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
            <ImageIcon className="h-5 w-5" />
            <span className="font-medium">إدارة اللوحات</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
