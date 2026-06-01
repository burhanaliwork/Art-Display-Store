import { Link, useLocation } from "wouter";
import { useAdminLogin, useGetAdminMe, getGetAdminMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const ADMIN_TOKEN_KEY = "admin_token";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export default function AdminLogin() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useAdminLogin();
  const { data: admin, isLoading } = useGetAdminMe({ query: { retry: false } });

  useEffect(() => {
    if (!isLoading && admin?.loggedIn) {
      setLocation("/admin/dashboard");
    }
  }, [admin, isLoading, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login.mutate({ data }, {
      onSuccess: (session) => {
        localStorage.setItem(ADMIN_TOKEN_KEY, session.token);
        setAuthTokenGetter(() => localStorage.getItem(ADMIN_TOKEN_KEY));
        queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
        toast.success("تم تسجيل الدخول بنجاح");
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast.error("بيانات الدخول غير صحيحة");
      }
    });
  };

  if (isLoading || admin?.loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-card border rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              <span>الرجوع للمتجر</span>
            </Button>
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">تسجيل الدخول للمشرفين</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input dir="ltr" className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" dir="ltr" className="text-right" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-lg" 
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}