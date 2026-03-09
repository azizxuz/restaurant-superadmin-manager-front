import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { branchService } from '@/services/branchService';
import { Loader2, Search, GitBranch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

type OrderStatus = 'SUCCESS' | 'CANCELED' | 'PENDING';

interface OrderProduct {
    id: string;
    name: string;
    price: number;
}

interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    count: number;
    status: string;
    product: OrderProduct;
}

interface OrderRoom {
    id: string;
    name: string;
    price: number;
}

interface OrderUser {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumer: string;
}

interface Order {
    id: string;
    userId: string;
    roomId: string;
    branchId: string;
    status: OrderStatus;
    type: string;
    createdAt: string;
    endAt: string;
    orderItem: OrderItem[];
    room: OrderRoom;
    user: OrderUser;
}

interface BranchResponse {
    id: string;
    name: string;
    status: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    SUCCESS: 'Yakunlangan',
    PENDING: 'Kutilmoqda',
    CANCELED: 'Bekor qilingan',
};

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
    SUCCESS: 'default',
    PENDING: 'secondary',
    CANCELED: 'destructive',
};

function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        for (const key of ['data', 'items', 'result', 'results', 'content']) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
    }
    return [];
}

function getOrderTotal(order: Order): number {
    return order.orderItem.reduce((sum, item) => {
        return sum + item.product.price * item.count;
    }, 0);
}

export default function ManagerOrders() {
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter] = useState('');

    // Branches
    const { data: branchesRaw, isLoading: branchesLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: () => branchService.getAll(),
        staleTime: 5 * 60 * 1000,
    });
    const branches = toArray<BranchResponse>(branchesRaw);

    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches]);

    // Orders
    const { data: ordersRaw, isLoading: ordersLoading } = useQuery({
        queryKey: ['orders', selectedBranchId],
        queryFn: async () => {
            const res = await api.get(`/order/branch/${selectedBranchId}`);
            return res.data;
        },
        enabled: !!selectedBranchId,
    });
    const allOrders = toArray<Order>(ordersRaw);

    // Client-side filter
    const filtered = allOrders.filter((o) => {
        const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const matchDate = !dateFilter || o.createdAt.startsWith(dateFilter);

        const prodNames = o.orderItem.map((oi) => oi.product?.name || '').join(' ');
        const text = `${o.id} ${o.room?.name || ''} ${o.user?.firstName || ''} ${o.user?.lastName || ''} ${prodNames}`.toLowerCase();
        const matchSearch = !search || text.includes(search.toLowerCase());

        return matchStatus && matchDate && matchSearch;
    });

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Buyurtmalar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Filial bo'yicha barcha buyurtmalar
                    </p>
                </div>

                {/* Branch — global tanlov */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Filial:</span>
                    </div>
                    {branchesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger className="w-44 h-9">
                                <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* ── Table card ──────────────────────────────────────────────────────── */}
            <Card>
                {/* Filters inside card header */}
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Xona, afitsant, mahsulot..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>

                    {/* Status filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Barcha holat</SelectItem>
                            <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                            <SelectItem value="SUCCESS">Yakunlangan</SelectItem>
                            <SelectItem value="CANCELED">Bekor qilingan</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date filter */}
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-40 h-9"
                    />

                    {/* Count */}
                    {!ordersLoading && (
                        <span className="text-sm text-muted-foreground ml-auto">
                            {filtered.length} ta buyurtma
                        </span>
                    )}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Buyurtma</TableHead>
                            <TableHead>Xona / Stol</TableHead>
                            <TableHead>Afitsant</TableHead>
                            <TableHead>Mahsulotlar</TableHead>
                            <TableHead>Summa</TableHead>
                            <TableHead>Holat</TableHead>
                            <TableHead>Sana</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ordersLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : !selectedBranchId ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                    Filial tanlang
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                    Buyurtma topilmadi
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((o) => {
                                const prodNames = o.orderItem.map(
                                    (oi) => `${oi.product?.name || '?'} x${oi.count}`
                                );
                                const total = getOrderTotal(o);

                                return (
                                    <TableRow key={o.id}>
                                        {/* ID */}
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {o.id.slice(0, 8)}
                                        </TableCell>

                                        {/* Room */}
                                        <TableCell className="font-medium">
                                            {o.room?.name || '—'}
                                        </TableCell>

                                        {/* Waiter */}
                                        <TableCell>
                                            {o.user
                                                ? `${o.user.firstName} ${o.user.lastName}`
                                                : '—'}
                                        </TableCell>

                                        {/* Products */}
                                        <TableCell className="max-w-[220px]">
                                            <div className="flex flex-wrap gap-1">
                                                {prodNames.slice(0, 3).map((n, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {n}
                                                    </Badge>
                                                ))}
                                                {prodNames.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{prodNames.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Total */}
                                        <TableCell className="font-semibold">
                                            {formatPrice(total)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[o.status]}>
                                                {STATUS_LABELS[o.status]}
                                            </Badge>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(o.createdAt).toLocaleDateString('uz-UZ')}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
