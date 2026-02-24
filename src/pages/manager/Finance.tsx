import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { branchService } from "@/services/branchService";
import api from "@/lib/api";
import { formatPrice } from "@/lib/mock-data";
import { Loader2, Users, Wallet, ChefHat, Search, GitBranch } from "lucide-react";

interface BranchResponse { id: string; name: string; status: string; }
interface WaiterFinance { id: string; firstName: string; lastName: string; phoneNumer: string; totalOrders: number; totalSum: number; totalKpi: number; }
interface ChefFinance { id: string; firstName: string; lastName: string; phoneNumer: string; totalDishes: number; totalSum: number; }

const MOCK_CHEFS: ChefFinance[] = [
    { id: "1", firstName: "Jasur", lastName: "Toshmatov", phoneNumer: "+998901234567", totalDishes: 120, totalSum: 2400000 },
    { id: "2", firstName: "Dilnoza", lastName: "Yusupova", phoneNumer: "+998907654321", totalDishes: 98, totalSum: 1960000 },
    { id: "3", firstName: "Bobur", lastName: "Rahimov", phoneNumer: "+998991112233", totalDishes: 75, totalSum: 1500000 },
];

function toArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        for (const key of ["data", "items", "result", "results", "content"]) {
            if (Array.isArray(obj[key])) return obj[key] as T[];
        }
    }
    return [];
}

export default function Finance() {
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [waiterSearch, setWaiterSearch] = useState("");
    const [chefSearch, setChefSearch] = useState("");
    const [activeTab, setActiveTab] = useState("waiters");

    const { data: branchesRaw, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getAll().then((r) => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const branches = toArray<BranchResponse>(branchesRaw);

    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches]);

    const { data: waitersRaw, isLoading: waitersLoading } = useQuery({
        queryKey: ["waiters-finance", selectedBranchId, waiterSearch],
        queryFn: async () => {
            const params = waiterSearch ? `?search=${waiterSearch}` : "";
            const res = await api.get(`/user/waiters/finance/${selectedBranchId}${params}`);
            return res.data;
        },
        enabled: !!selectedBranchId,
    });
    const waitersList = toArray<WaiterFinance>(waitersRaw);

    const chefsList = MOCK_CHEFS.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(chefSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* ── Header: sarlavha + branch selector ──────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Moliya</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Xodimlar bo'yicha moliyaviy hisobot</p>
                </div>

                {/* Branch — o'ng tomonda, global tanlov sifatida */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Filial:</span>
                    </div>
                    {branchesLoading ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        </div>
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

            {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="waiters" className="gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Afitsantlar
                        {waitersList.length > 0 && (
                            <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">
                                {waitersList.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="chefs" className="gap-1.5">
                        <ChefHat className="h-3.5 w-3.5" />
                        Oshpazlar
                        <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">
                            {MOCK_CHEFS.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* ══ Waiters ══════════════════════════════════════════════════════════ */}
                <TabsContent value="waiters" className="mt-4">
                    <Card>
                        {/* Search — table ning tepasida, card ichida */}
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Afitsant qidirish..."
                                    value={waiterSearch}
                                    onChange={(e) => setWaiterSearch(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                            {waitersLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ism</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Buyurtmalar</TableHead>
                                    <TableHead>Jami summa</TableHead>
                                    <TableHead>KPI (ulush)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {waitersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : !selectedBranchId ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                            Filial tanlang
                                        </TableCell>
                                    </TableRow>
                                ) : waitersList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                            {waiterSearch ? "Qidiruv bo'yicha natija topilmadi" : "Ma'lumot topilmadi"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    waitersList.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{w.phoneNumer}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{w.totalOrders} ta</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatPrice(w.totalSum)}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-0.5 text-sm font-semibold">
                                                    <Wallet className="h-3 w-3" />
                                                    {formatPrice(w.totalKpi)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* ══ Chefs ════════════════════════════════════════════════════════════ */}
                <TabsContent value="chefs" className="mt-4">
                    <Card>
                        {/* Search + mock badge — card ichida */}
                        <div className="flex items-center gap-3 p-4 border-b border-border">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Oshpaz qidirish..."
                                    value={chefSearch}
                                    onChange={(e) => setChefSearch(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 shrink-0">
                                Mock data
                            </Badge>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ism</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Tayyorlangan taomlar</TableHead>
                                    <TableHead>Jami summa</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chefsList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                                            Oshpaz topilmadi
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    chefsList.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{c.phoneNumer}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{c.totalDishes} ta</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatPrice(c.totalSum)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
