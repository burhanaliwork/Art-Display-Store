import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { ShoppingBag, Phone } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-serif font-bold text-primary">معرض اللوحات</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-muted-foreground" dir="ltr">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium tracking-wide">0786 736 6886</span>
            </div>
            
            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {items.length > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="border-t bg-card mt-12 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl font-serif font-bold text-primary mb-4">معرض اللوحات</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            منصة مخصصة لعرض وبيع اللوحات الفنية الأصلية في العراق. كل لوحة هي قصة تروى بالألوان.
          </p>
          <div className="flex justify-center items-center gap-2 text-muted-foreground" dir="ltr">
            <Phone className="h-4 w-4" />
            <span>0786 736 6886</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
