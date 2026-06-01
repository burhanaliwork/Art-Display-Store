import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Link, useLocation } from "wouter";
import { useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  phone: z.string().min(10, "رقم الهاتف غير صالح"),
  address: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل"),
  notes: z.string().optional(),
});

export default function Cart() {
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const [location, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const formatter = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 });

  const onSubmit = (data: z.infer<typeof checkoutSchema>) => {
    if (items.length === 0) return;

    createOrder.mutate({
      data: {
        ...data,
        items: items.map(item => ({
          paintingId: item.painting.id,
          paintingTitle: item.painting.title,
          size: item.selectedSize,
          price: item.price
        }))
      }
    }, {
      onSuccess: () => {
        clearCart();
        setIsSuccess(true);
        toast.success("تم إرسال الطلب بنجاح");
      },
      onError: () => {
        toast.error("حدث خطأ أثناء إرسال الطلب");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-serif font-bold mb-4">تم استلام طلبك بنجاح!</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          شكراً لتسوقك من معرض اللوحات. سنتواصل معك قريباً لتأكيد تفاصيل التوصيل.
        </p>
        <Button onClick={() => setLocation("/")} size="lg" className="w-full">
          العودة للمعرض
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h1 className="text-3xl font-serif font-bold mb-6">سلة المشتريات فارغة</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          لم تقم بإضافة أي لوحات إلى سلة المشتريات بعد.
        </p>
        <Button onClick={() => setLocation("/")} size="lg">
          استكشف اللوحات
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold mb-8">سلة المشتريات</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3 space-y-6">
          {items.map((item, i) => (
            <div key={`${item.painting.id}-${item.selectedSize}-${i}`} className="flex gap-4 p-4 bg-card border rounded-lg shadow-sm">
              <div className="w-24 h-24 shrink-0 bg-muted rounded overflow-hidden">
                <img src={item.painting.imageUrl} alt={item.painting.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{item.painting.title}</h3>
                    <p className="text-muted-foreground text-sm">المقاس: {item.selectedSize}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.painting.id, item.selectedSize)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="font-bold text-primary" dir="ltr">
                  {formatter.format(item.price)}
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>المجموع الكلي:</span>
              <span className="text-primary" dir="ltr">{formatter.format(totalPrice)}</span>
            </div>
          </div>
        </div>
        
        <div className="lg:w-1/3">
          <div className="bg-card border rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">تفاصيل التوصيل</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسمك الكامل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input placeholder="07XX XXX XXXX" dir="ltr" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان الكامل</FormLabel>
                      <FormControl>
                        <Textarea placeholder="المحافظة، المنطقة، أقرب نقطة دالة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أي ملاحظات حول الطلب أو التوصيل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg mt-6" 
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      تأكيد الطلب
                      <ArrowRight className="mr-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}