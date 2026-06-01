import { useState } from "react";
import { useListPaintings } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Expand } from "lucide-react";
import { toast } from "sonner";
import type { Painting, PaintingSize } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Home() {
  const { data: paintings, isLoading } = useListPaintings();
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">معرض اللوحات الفنية</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          اكتشف مجموعة فريدة من اللوحات الفنية الأصلية، مرسومة بأيدي فنانين مبدعين لتضيف لمسة من الجمال والأصالة إلى مساحتك.
        </p>
      </div>

      {!paintings?.length ? (
        <div className="text-center py-20 bg-card rounded-lg border border-dashed">
          <p className="text-muted-foreground text-lg">لا توجد لوحات معروضة حالياً.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {paintings.map((painting) => (
            <PaintingCard 
              key={painting.id} 
              painting={painting} 
              onClick={() => setSelectedPainting(painting)} 
            />
          ))}
        </div>
      )}

      <PaintingModal 
        painting={selectedPainting} 
        onClose={() => setSelectedPainting(null)} 
      />
    </div>
  );
}

function PaintingCard({ painting, onClick }: { painting: Painting, onClick: () => void }) {
  const formatter = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 });

  return (
    <div 
      className="group relative break-inside-avoid mb-6 cursor-pointer bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300"
      onClick={onClick}
    >
      <div className="relative overflow-hidden aspect-[4/5]">
        <img 
          src={painting.imageUrl} 
          alt={painting.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-white/90 text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Expand className="w-4 h-4" />
            عرض التفاصيل
          </span>
        </div>
        {!painting.inStock && (
          <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm font-bold shadow-lg">
            نفدت الكمية
          </div>
        )}
        {painting.featured && painting.inStock && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-bold shadow-lg">
            مميزة
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-serif text-xl font-bold mb-1 text-foreground">{painting.title}</h3>
        <p className="text-primary font-bold text-lg mb-3" dir="ltr">{formatter.format(painting.price)}</p>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {painting.description || "لوحة فنية أصلية"}
        </p>
      </div>
    </div>
  );
}

function PaintingModal({ painting, onClose }: { painting: Painting | null, onClose: () => void }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<PaintingSize | null>(null);

  if (!painting) return null;

  const formatter = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 });

  // Auto-select first size when painting changes
  if (painting.sizes?.length > 0 && (!selectedSize || !painting.sizes.find(s => s.name === selectedSize.name))) {
    setSelectedSize(painting.sizes[0]);
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(painting, selectedSize.name, painting.price);
    toast.success('تم الإضافة إلى السلة', {
      description: `تمت إضافة "${painting.title}" (${selectedSize.name}) إلى سلة المشتريات.`
    });
    onClose();
  };

  return (
    <Dialog open={!!painting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-none shadow-2xl">
        <DialogTitle className="sr-only">{painting.title}</DialogTitle>
        <DialogDescription className="sr-only">{painting.description}</DialogDescription>
        
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-muted relative">
            <img 
              src={painting.imageUrl} 
              alt={painting.title} 
              className="w-full h-full object-cover md:absolute inset-0"
            />
          </div>
          
          {/* Details Section */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{painting.title}</h2>
              <div className="text-2xl font-bold text-primary mb-4" dir="ltr">{formatter.format(painting.price)}</div>
              
              <div className="prose prose-sm text-muted-foreground">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {painting.description || "لا يوجد وصف متوفر لهذه اللوحة."}
                </p>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-3 border-b pb-2">المقاسات المتوفرة</h3>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {painting.sizes.map((size) => (
                  <div 
                    key={size.name}
                    onClick={() => setSelectedSize(size)}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedSize?.name === size.name 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    <div className="font-bold mb-1">{size.name}</div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      {size.width} × {size.height} {size.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t mt-auto">
              <Button 
                className="w-full h-14 text-lg font-bold" 
                size="lg"
                disabled={!painting.inStock || !selectedSize}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                {painting.inStock ? 'أضف إلى السلة' : 'نفدت الكمية'}
              </Button>
              {!painting.inStock && (
                <p className="text-center text-sm text-destructive mt-3 font-medium">
                  هذه اللوحة غير متوفرة حالياً
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}