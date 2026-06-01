import { useGetOrderStats, useListOrders, useUpdateOrderStatus, getListOrdersQueryKey, getGetOrderStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, CheckCircle, Truck, Inbox, XCircle, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const statusMap = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  shipped: { label: 'مشحون', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'تم التوصيل', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200' },
} as const;

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetOrderStats();
  const { data: orders, isLoading: ordersLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const formatter = new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 });

  const handleStatusChange = (orderId: number, status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => {
    updateStatus.mutate({
      id: orderId,
      data: { status }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrderStatsQueryKey() });
        toast.success("تم تحديث حالة الطلب بنجاح");
      },
      onError: () => toast.error("حدث خطأ أثناء تحديث حالة الطلب")
    });
  };

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold text-foreground">الرئيسية والإحصائيات</h1>
      
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
              <Inbox className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">تم التوصيل</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" dir="ltr">{formatter.format(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">أحدث الطلبات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-medium">رقم الطلب</th>
                <th className="p-4 font-medium">العميل</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">المجموع</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {orders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد طلبات بعد</td>
                </tr>
              ) : (
                orders?.map(order => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium" dir="ltr">#{order.id}</td>
                    <td className="p-4">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted-foreground mt-1" dir="ltr">{order.phone}</div>
                    </td>
                    <td className="p-4 text-muted-foreground" dir="ltr">
                      {format(new Date(order.createdAt), 'yyyy/MM/dd HH:mm')}
                    </td>
                    <td className="p-4 font-medium text-primary" dir="ltr">
                      {formatter.format(order.totalPrice)}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={statusMap[order.status as keyof typeof statusMap].color}>
                        {statusMap[order.status as keyof typeof statusMap].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(val) => handleStatusChange(order.id, val as any)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="confirmed">مؤكد</SelectItem>
                          <SelectItem value="shipped">مشحون</SelectItem>
                          <SelectItem value="delivered">تم التوصيل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}