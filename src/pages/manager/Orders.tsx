import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { orders, orderItems, products, users, rooms, formatPrice, getOrderTotal, statusLabels, OrderStatus } from '@/lib/mock-data';

export default function ManagerOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;

    const orderRoom = rooms.find(r => r.id === o.roomId);
    const waiter = users.find(u => u.id === o.userId);
    const items = orderItems.filter(oi => oi.orderId === o.id);
    const prodNames = items.map(oi => products.find(p => p.id === oi.productId)?.name || '').join(' ');

    const searchText = `${o.id} ${orderRoom?.name || ''} ${waiter?.firstName || ''} ${waiter?.lastName || ''} ${prodNames}`.toLowerCase();
    const matchSearch = search === '' || searchText.includes(search.toLowerCase());

    const matchDate = dateFilter === '' || o.createdAt.startsWith(dateFilter);

    return matchStatus && matchSearch && matchDate;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Buyurtmalar</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="Qidirish (xona, afitsant, mahsulot)..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha holat</SelectItem>
            <SelectItem value="PENDING">Kutilmoqda</SelectItem>
            <SelectItem value="SUCCESS">Yakunlangan</SelectItem>
            <SelectItem value="CANCELED">Bekor qilingan</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyurtma</TableHead>
              <TableHead>Xona</TableHead>
              <TableHead>Afitsant</TableHead>
              <TableHead>Mahsulotlar</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(o => {
              const room = rooms.find(r => r.id === o.roomId);
              const waiter = users.find(u => u.id === o.userId);
              const items = orderItems.filter(oi => oi.orderId === o.id);
              const prodNames = items.map(oi => {
                const p = products.find(pr => pr.id === oi.productId);
                return p ? `${p.name} x${oi.count}` : '';
              }).filter(Boolean);

              const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
                SUCCESS: 'default',
                PENDING: 'secondary',
                CANCELED: 'destructive',
              };

              return (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{room?.name || '—'}</TableCell>
                  <TableCell>{waiter ? `${waiter.firstName} ${waiter.lastName}` : '—'}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {prodNames.slice(0, 3).map((n, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                      {prodNames.length > 3 && <Badge variant="outline" className="text-xs">+{prodNames.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(getOrderTotal(o.id))}</TableCell>
                  <TableCell><Badge variant={statusVariant[o.status]}>{statusLabels[o.status]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(o.createdAt).toLocaleDateString('uz-UZ')}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Buyurtma topilmadi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
