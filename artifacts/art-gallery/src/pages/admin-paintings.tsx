import { useState, useRef } from "react";
import { useListPaintings, useCreatePainting, useUpdatePainting, useDeletePainting, getListPaintingsQueryKey } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Pencil, Trash2, X, ImagePlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Painting } from "@workspace/api-client-react/src/generated/api.schemas";

const sizeSchema = z.object({
  name: z.string().min(1, "اسم المقاس مطلوب"),
  width: z.coerce.number().min(1),
  height: z.coerce.number().min(1),
  unit: z.string().default("cm")
});

const paintingSchema = z.object({
  title: z.string().min(2, "العنوان مطلوب"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "السعر مطلوب"),
  imageUrl: z.string().min(1, "الصورة مطلوبة"),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sizes: z.array(sizeSchema).min(1, "يجب إضافة مقاس واحد على الأقل")
});

export default function AdminPaintings() {
  const { data: paintings, isLoading } = useListPaintings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPainting = useCreatePainting();
  const updatePainting = useUpdatePainting();
  const deletePainting = useDeletePainting();
  const queryClient = useQueryClient();

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageUrl = `/api/storage${response.objectPath}`;
      form.setValue("imageUrl", imageUrl, { shouldValidate: true });
      toast.success("تم رفع الصورة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء رفع الصورة");
      setImagePreview(null);
      form.setValue("imageUrl", "");
    },
  });

  const formatter = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 });

  const form = useForm<z.infer<typeof paintingSchema>>({
    resolver: zodResolver(paintingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      imageUrl: "",
      inStock: true,
      featured: false,
      sizes: [{ name: "Standard", width: 50, height: 70, unit: "cm" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sizes"
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    await uploadFile(file);
  };

  const handleOpenNew = () => {
    form.reset({
      title: "",
      description: "",
      price: 0,
      imageUrl: "",
      inStock: true,
      featured: false,
      sizes: [{ name: "Standard", width: 50, height: 70, unit: "cm" }]
    });
    setImagePreview(null);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (painting: Painting) => {
    form.reset({
      title: painting.title,
      description: painting.description || "",
      price: painting.price,
      imageUrl: painting.imageUrl,
      inStock: painting.inStock,
      featured: painting.featured,
      sizes: painting.sizes
    });
    setImagePreview(painting.imageUrl);
    setEditingId(painting.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه اللوحة؟")) return;
    deletePainting.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaintingsQueryKey() });
        toast.success("تم حذف اللوحة بنجاح");
      },
      onError: () => toast.error("حدث خطأ أثناء الحذف")
    });
  };

  const onSubmit = (data: z.infer<typeof paintingSchema>) => {
    if (editingId) {
      updatePainting.mutate({ id: editingId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaintingsQueryKey() });
          toast.success("تم تحديث اللوحة بنجاح");
          setIsDialogOpen(false);
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث")
      });
    } else {
      createPainting.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaintingsQueryKey() });
          toast.success("تم إضافة اللوحة بنجاح");
          setIsDialogOpen(false);
        },
        onError: () => toast.error("حدث خطأ أثناء الإضافة")
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-foreground">إدارة اللوحات</h1>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="w-5 h-5" />
          إضافة لوحة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paintings?.map((painting) => (
          <div key={painting.id} className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="aspect-[4/3] relative">
              <img src={painting.imageUrl} alt={painting.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                {!painting.inStock && <span className="bg-destructive text-white text-xs px-2 py-1 rounded font-bold">نفدت</span>}
                {painting.featured && <span className="bg-primary text-white text-xs px-2 py-1 rounded font-bold">مميزة</span>}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-lg line-clamp-1 mb-1">{painting.title}</h3>
              <p className="text-primary font-bold mb-4" dir="ltr">{formatter.format(painting.price)}</p>
              <div className="mt-auto flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => handleEdit(painting)}>
                  <Pencil className="w-4 h-4" />
                  تعديل
                </Button>
                <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(painting.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {paintings?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground text-lg">لا توجد لوحات. قم بإضافة لوحة جديدة للبدء.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل اللوحة" : "إضافة لوحة جديدة"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (دينار عراقي)</FormLabel>
                      <FormControl><Input type="number" dir="ltr" className="text-right" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ fieldState }) => (
                  <FormItem>
                    <FormLabel>صورة اللوحة</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 gap-2 text-base"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> جاري رفع الصورة...</>
                          ) : (
                            <><ImagePlus className="w-5 h-5" /> {imagePreview ? "تغيير الصورة" : "اختر صورة من الجهاز"}</>
                          )}
                        </Button>
                        {imagePreview && (
                          <div className="relative rounded-lg overflow-hidden border aspect-video">
                            <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                form.setValue("imageUrl", "");
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {fieldState.error && <p className="text-destructive text-sm">{fieldState.error.message}</p>}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl><Textarea className="resize-none" rows={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border p-4 rounded-lg bg-muted/20 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold">المقاسات المتوفرة</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", width: 0, height: 0, unit: "cm" })}>
                    <Plus className="w-4 h-4 ml-2" /> إضافة مقاس
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <FormField control={form.control} name={`sizes.${index}.name`} render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">الاسم (مثال: كبير)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`sizes.${index}.width`} render={({ field }) => (
                      <FormItem className="w-20">
                        <FormLabel className="text-xs">العرض</FormLabel>
                        <FormControl><Input type="number" dir="ltr" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`sizes.${index}.height`} render={({ field }) => (
                      <FormItem className="w-20">
                        <FormLabel className="text-xs">الطول</FormLabel>
                        <FormControl><Input type="number" dir="ltr" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    {fields.length > 1 && (
                      <Button type="button" variant="outline" size="icon" className="mb-0.5 shrink-0 text-destructive" onClick={() => remove(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-8 border-t pt-4">
                <FormField control={form.control} name="inStock" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 w-full">
                    <FormLabel className="text-base">متوفر في المخزن</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="featured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 w-full">
                    <FormLabel className="text-base">لوحة مميزة</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={isUploading || createPainting.isPending || updatePainting.isPending}>
                  {(createPainting.isPending || updatePainting.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingId ? "تحديث اللوحة" : "إضافة اللوحة"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
