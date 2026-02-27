import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchService } from "@/services/branchService";
import api from "@/lib/api";
import { formatPrice } from "@/lib/mock-data";
import {
    Loader2, Plus, Trash2, Search, GitBranch, Tag, Layers,
    ChevronLeft, ChevronRight, Calendar,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface BranchResponse { id: string; name: string; status: string; }

interface CostCategory {
    id: string; name: string; branchId: string;
    status: string; createdAt: string; updatedAt: string;
    cost: unknown[];
}
interface CostCategoryResponse { totalCost: number; data: CostCategory[]; }

interface CostsCategory {
    id: string; name: string; branchId: string; status: string;
    createdAt: string; updatedAt: string;
}
interface Cost {
    id: string; name: string; desc: string;
    quantity: number; costAmount: string;
    branchId: string; costsCategoryId: string;
    createdAt: string; updatedAt: string;
    costsCategory?: CostsCategory;
}
interface CostResponse { totalExpense: number; data: Cost[]; total?: number; }

type TimeFilter = "yesterday" | "today" | "last7" | "last30" | "custom";

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: "today", label: "Bugun" },
    { value: "yesterday", label: "Kecha" },
    { value: "last7", label: "7 kun" },
    { value: "last30", label: "30 kun" },
    { value: "custom", label: "Boshqa" },
];

const LIMIT = 10;

// ─── Services ──────────────────────────────────────────────────────────────────
const catService = {
    getAll: (branchId: string, search?: string) => {
        const q = search ? `?search=${search}` : "";
        return api.get<CostCategoryResponse>(`/cost-category/${branchId}${q}`);
    },
    create: (data: { name: string; branchId: string }) =>
        api.post<CostCategory>("/cost-category", data),
    update: (id: string, name: string) =>
        api.patch<CostCategory>(`/cost-category/${id}`, { name }),
    delete: (id: string) => api.delete<CostCategory>(`/cost-category/${id}`),
    deleteMany: (branchId: string, ids: string[]) =>
        api.post<{ count: number }>(`/cost-category/delete-many/${branchId}`, { ids }),
};

const costService = {
    getAll: (branchId: string, params: Record<string, string>) => {
        const q = new URLSearchParams(params).toString();
        return api.get<CostResponse>(`/cost/${branchId}${q ? `?${q}` : ""}`);
    },
    create: (data: {
        name: string; desc: string; quantity: number;
        costAmount: string; branchId: string; costsCategoryId: string;
    }) => api.post<Cost>("/cost", data),
    update: (id: string, data: Partial<{
        name: string; desc: string; quantity: number;
        costAmount: string; costsCategoryId: string;
    }>) => api.patch<Cost>(`/cost/${id}`, data),
    delete: (id: string) => api.delete<Cost>(`/cost/${id}`),
    deleteMany: (branchId: string, ids: string[]) =>
        api.post<{ count: number }>(`/cost/delete-many/${branchId}`, { ids }),
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Xarajatlar() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("costs");
    const [selectedBranchId, setSelectedBranchId] = useState("");

    // ── Category state
    const [catSearch, setCatSearch] = useState("");
    const [catSelected, setCatSelected] = useState<Set<string>>(new Set());
    const [catDialog, setCatDialog] = useState(false);
    const [catEdit, setCatEdit] = useState<CostCategory | null>(null);
    const [catName, setCatName] = useState("");
    const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
    const [catDeleteMany, setCatDeleteMany] = useState(false);

    // ── Cost filters
    const [costSearch, setCostSearch] = useState("");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [catIdFilter, setCatIdFilter] = useState("ALL");
    const [page, setPage] = useState(1);

    // ── Cost CRUD state
    const [costSelected, setCostSelected] = useState<Set<string>>(new Set());
    const [costDialog, setCostDialog] = useState(false);
    const [costEdit, setCostEdit] = useState<Cost | null>(null);
    const [costDeleteId, setCostDeleteId] = useState<string | null>(null);
    const [costDeleteMany, setCostDeleteMany] = useState(false);
    const [costForm, setCostForm] = useState({
        name: "", desc: "", quantity: "1", costAmount: "", costsCategoryId: "",
    });

    // reset page on filter change
    useEffect(() => { setPage(1); }, [costSearch, timeFilter, fromDate, toDate, catIdFilter, selectedBranchId]);

    // ── Branches
    const { data: branchesRaw, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getAll().then((r) => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const branches: BranchResponse[] = (() => {
        const raw = branchesRaw as unknown;
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            for (const k of ["data", "items"]) if (Array.isArray(obj[k])) return obj[k] as BranchResponse[];
        }
        return [];
    })();

    useEffect(() => {
        if (branches.length > 0 && !selectedBranchId) setSelectedBranchId(branches[0].id);
    }, [branches]);

    // ── Category query
    const catQK = ["cost-categories", selectedBranchId, catSearch];
    const { data: catRes, isLoading: catsLoading } = useQuery({
        queryKey: catQK,
        queryFn: () => catService.getAll(selectedBranchId, catSearch).then((r) => r.data),
        enabled: !!selectedBranchId,
    });
    const categories: CostCategory[] = catRes?.data ?? [];

    // ── Cost query — full params
    const isCustom = timeFilter === "custom";
    const canFetch = !!selectedBranchId && (!isCustom || (!!fromDate && !!toDate));

    const buildCostParams = (): Record<string, string> => {
        const p: Record<string, string> = {
            filter: timeFilter,
            page: String(page),
            limit: String(LIMIT),
        };
        if (costSearch) p.search = costSearch;
        if (catIdFilter !== "ALL") p.costsCategoryId = catIdFilter;
        if (isCustom && fromDate) p.from = fromDate;
        if (isCustom && toDate) p.to = toDate;
        return p;
    };

    const costQK = ["costs", selectedBranchId, costSearch, timeFilter, fromDate, toDate, catIdFilter, page];
    const { data: costRes, isLoading: costsLoading } = useQuery({
        queryKey: costQK,
        queryFn: () => costService.getAll(selectedBranchId, buildCostParams()).then((r) => r.data),
        enabled: canFetch,
    });
    const costs: Cost[] = costRes?.data ?? [];
    const totalExpense: number = costRes?.totalExpense ?? 0;
    const totalCount: number = costRes?.total ?? costs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

    // ════════════════════════════════════════════════════════════════════════════
    // CATEGORY MUTATIONS
    // ════════════════════════════════════════════════════════════════════════════
    const catCreateMut = useMutation({
        mutationFn: (name: string) => catService.create({ name, branchId: selectedBranchId }),
        onSuccess: (res) => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: [...(old?.data ?? []), res.data],
            }));
            toast.success("Kategoriya yaratildi");
            setCatDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const catUpdateMut = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => catService.update(id, name),
        onSuccess: (res) => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: (old?.data ?? []).map((c) => c.id === res.data.id ? { ...c, ...res.data } : c),
            }));
            toast.success("Kategoriya yangilandi");
            setCatDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const catDeleteMut = useMutation({
        mutationFn: (id: string) => catService.delete(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: (old?.data ?? []).filter((c) => c.id !== id),
            }));
            toast.success("Kategoriya o'chirildi");
            setCatDeleteId(null);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const catDeleteManyMut = useMutation({
        mutationFn: () => catService.deleteMany(selectedBranchId, Array.from(catSelected)),
        onSuccess: () => {
            queryClient.setQueryData(catQK, (old: CostCategoryResponse | undefined) => ({
                totalCost: old?.totalCost ?? 0,
                data: (old?.data ?? []).filter((c) => !catSelected.has(c.id)),
            }));
            toast.success(`${catSelected.size} ta kategoriya o'chirildi`);
            setCatSelected(new Set());
            setCatDeleteMany(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    // ════════════════════════════════════════════════════════════════════════════
    // COST MUTATIONS
    // ════════════════════════════════════════════════════════════════════════════
    const costCreateMut = useMutation({
        mutationFn: () => costService.create({
            name: costForm.name, desc: costForm.desc,
            quantity: Number(costForm.quantity) || 1,
            costAmount: costForm.costAmount,
            branchId: selectedBranchId,
            costsCategoryId: costForm.costsCategoryId,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["costs", selectedBranchId] });
            toast.success("Xarajat qo'shildi");
            setCostDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const costUpdateMut = useMutation({
        mutationFn: () => costService.update(costEdit!.id, {
            name: costForm.name, desc: costForm.desc,
            quantity: Number(costForm.quantity) || 1,
            costAmount: costForm.costAmount,
            costsCategoryId: costForm.costsCategoryId,
        }),
        onSuccess: (res) => {
            queryClient.setQueryData(costQK, (old: CostResponse | undefined) => ({
                totalExpense: old?.totalExpense ?? 0,
                total: old?.total,
                data: (old?.data ?? []).map((c) => c.id === res.data.id ? { ...c, ...res.data } : c),
            }));
            toast.success("Xarajat yangilandi");
            setCostDialog(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const costDeleteMut = useMutation({
        mutationFn: (id: string) => costService.delete(id),
        onSuccess: (res, id) => {
            queryClient.setQueryData(costQK, (old: CostResponse | undefined) => ({
                totalExpense: Math.max(0, (old?.totalExpense ?? 0) - Number(res.data.costAmount)),
                total: Math.max(0, (old?.total ?? 1) - 1),
                data: (old?.data ?? []).filter((c) => c.id !== id),
            }));
            toast.success("Xarajat o'chirildi");
            setCostDeleteId(null);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    const costDeleteManyMut = useMutation({
        mutationFn: () => costService.deleteMany(selectedBranchId, Array.from(costSelected)),
        onSuccess: () => {
            queryClient.setQueryData(costQK, (old: CostResponse | undefined) => {
                const removed = (old?.data ?? []).filter((c) => costSelected.has(c.id));
                const removedSum = removed.reduce((s, c) => s + Number(c.costAmount), 0);
                return {
                    totalExpense: Math.max(0, (old?.totalExpense ?? 0) - removedSum),
                    total: Math.max(0, (old?.total ?? 0) - costSelected.size),
                    data: (old?.data ?? []).filter((c) => !costSelected.has(c.id)),
                };
            });
            toast.success(`${costSelected.size} ta xarajat o'chirildi`);
            setCostSelected(new Set());
            setCostDeleteMany(false);
        },
        onError: () => toast.error("Xatolik yuz berdi"),
    });

    // ── Handlers
    const openAddCat = () => { setCatEdit(null); setCatName(""); setCatDialog(true); };
    const openEditCat = (c: CostCategory) => { setCatEdit(c); setCatName(c.name); setCatDialog(true); };
    const saveCat = () => {
        if (!catName.trim()) return toast.error("Nom kiriting");
        catEdit ? catUpdateMut.mutate({ id: catEdit.id, name: catName.trim() }) : catCreateMut.mutate(catName.trim());
    };

    const openAddCost = () => {
        setCostEdit(null);
        setCostForm({ name: "", desc: "", quantity: "1", costAmount: "", costsCategoryId: categories[0]?.id ?? "" });
        setCostDialog(true);
    };
    const openEditCost = (c: Cost) => {
        setCostEdit(c);
        setCostForm({ name: c.name, desc: c.desc, quantity: String(c.quantity), costAmount: c.costAmount, costsCategoryId: c.costsCategoryId });
        setCostDialog(true);
    };
    const saveCost = () => {
        if (!costForm.name.trim()) return toast.error("Nom kiriting");
        if (!costForm.costAmount) return toast.error("Summa kiriting");
        if (!costForm.costsCategoryId) return toast.error("Kategoriya tanlang");
        costEdit ? costUpdateMut.mutate() : costCreateMut.mutate();
    };

    const toggleCat = (id: string) => setCatSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAllCat = () => setCatSelected(catSelected.size === categories.length ? new Set() : new Set(categories.map((c) => c.id)));
    const toggleCost = (id: string) => setCostSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAllCost = () => setCostSelected(costSelected.size === costs.length ? new Set() : new Set(costs.map((c) => c.id)));

    const isCatSaving = catCreateMut.isPending || catUpdateMut.isPending;
    const isCostSaving = costCreateMut.isPending || costUpdateMut.isPending;

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Xarajatlar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Xarajat kategoriyalari va hisobotlar</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground hidden sm:inline">Filial:</span>
                    {branchesLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                        <Select value={selectedBranchId} onValueChange={(v) => {
                            setSelectedBranchId(v); setCatSelected(new Set()); setCostSelected(new Set());
                        }}>
                            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="costs" className="gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Xarajatlar
                        {totalCount > 0 && <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">{totalCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Kategoriyalar
                        {categories.length > 0 && <Badge variant="secondary" className="ml-0.5 px-1.5 text-xs">{categories.length}</Badge>}
                    </TabsTrigger>
                </TabsList>

                {/* ══ COSTS ════════════════════════════════════════════════════════ */}
                <TabsContent value="costs" className="mt-4">
                    <Card>
                        {/* ── Filter bar ─────────────────────────────────────────── */}
                        <div className="p-4 border-b border-border space-y-3">
                            {/* Row 1: search + time filter + category filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative w-52">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input placeholder="Qidirish..." value={costSearch}
                                        onChange={(e) => setCostSearch(e.target.value)} className="pl-8 h-9" />
                                </div>

                                {/* Time filter — segment buttons */}
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                    {TIME_OPTIONS.map((opt) => (
                                        <button key={opt.value} onClick={() => setTimeFilter(opt.value)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${timeFilter === opt.value
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                                }`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Category filter */}
                                <Select value={catIdFilter} onValueChange={setCatIdFilter}>
                                    <SelectTrigger className="w-44 h-9">
                                        <SelectValue placeholder="Barcha kategoriya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Barcha kategoriya</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Loading */}
                                {costsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

                                {/* Delete many + Add */}
                                <div className="ml-auto flex items-center gap-2">
                                    {costSelected.size > 0 && (
                                        <Button variant="destructive" size="sm" onClick={() => setCostDeleteMany(true)} className="gap-1.5">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {costSelected.size} ta o'chirish
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={openAddCost} className="gap-1.5" disabled={categories.length === 0}>
                                        <Plus className="h-4 w-4" />
                                        Xarajat qo'shish
                                    </Button>
                                </div>
                            </div>

                            {/* Row 2: custom date range */}
                            {timeFilter === "custom" && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40 h-9" />
                                    <span className="text-muted-foreground text-sm">—</span>
                                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40 h-9" />
                                    {(!fromDate || !toDate) && (
                                        <span className="text-xs text-amber-600">Ikkala sanani ham tanlang</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Warning: no categories */}
                        {categories.length === 0 && !catsLoading && (
                            <div className="text-center py-2.5 text-sm text-amber-700 bg-amber-50 border-b border-amber-200 px-4">
                                ⚠️ Xarajat qo'shish uchun avval kategoriya yarating
                            </div>
                        )}

                        {/* ── Table ───────────────────────────────────────────────── */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox checked={costs.length > 0 && costSelected.size === costs.length}
                                            onCheckedChange={toggleAllCost} disabled={costs.length === 0} />
                                    </TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Tavsif</TableHead>
                                    <TableHead>Kategoriya</TableHead>
                                    <TableHead>Miqdor</TableHead>
                                    <TableHead>Summa</TableHead>
                                    <TableHead>Sana</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costsLoading ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-12">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell></TableRow>
                                ) : isCustom && (!fromDate || !toDate) ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                                        Sana oralig'ini tanlang
                                    </TableCell></TableRow>
                                ) : !selectedBranchId ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Filial tanlang</TableCell></TableRow>
                                ) : costs.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                                        Xarajatlar topilmadi
                                    </TableCell></TableRow>
                                ) : (
                                    costs.map((c) => (
                                        <TableRow key={c.id} className={costSelected.has(c.id) ? "bg-muted/40" : ""}>
                                            <TableCell>
                                                <Checkbox checked={costSelected.has(c.id)} onCheckedChange={() => toggleCost(c.id)} />
                                            </TableCell>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">{c.desc || "—"}</TableCell>
                                            <TableCell>
                                                {c.costsCategory
                                                    ? <Badge variant="secondary">{c.costsCategory.name}</Badge>
                                                    : <span className="text-muted-foreground text-sm">—</span>}
                                            </TableCell>
                                            <TableCell className="text-sm">{c.quantity} dona</TableCell>
                                            <TableCell className="font-semibold">{formatPrice(Number(c.costAmount))}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditCost(c)}>Tahrirlash</Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                                                    onClick={() => setCostDeleteId(c.id)}>O'chirish</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* ── Footer: total + pagination ───────────────────────────── */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            {/* Total */}
                            <div className="text-sm text-muted-foreground">
                                {totalCount > 0 && (
                                    <>
                                        <span>{totalCount} ta xarajat</span>
                                        {totalExpense > 0 && (
                                            <span className="ml-3">
                                                Jami: <span className="font-semibold text-foreground">{formatPrice(totalExpense)}</span>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) =>
                                            p === "..." ? (
                                                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                                            ) : (
                                                <Button key={p} variant={page === p ? "default" : "outline"}
                                                    size="icon" className="h-8 w-8 text-sm"
                                                    onClick={() => setPage(p as number)}>
                                                    {p}
                                                </Button>
                                            )
                                        )}
                                    <Button variant="outline" size="icon" className="h-8 w-8"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* ══ CATEGORIES ═══════════════════════════════════════════════════ */}
                <TabsContent value="categories" className="mt-4">
                    <Card>
                        <div className="flex items-center gap-3 p-4 border-b border-border flex-wrap">
                            <div className="relative w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Kategoriya qidirish..." value={catSearch}
                                    onChange={(e) => setCatSearch(e.target.value)} className="pl-8 h-9" />
                            </div>
                            {catSelected.size > 0 && (
                                <Button variant="destructive" size="sm" onClick={() => setCatDeleteMany(true)} className="gap-1.5">
                                    <Trash2 className="h-3.5 w-3.5" />{catSelected.size} ta o'chirish
                                </Button>
                            )}
                            <Button size="sm" onClick={openAddCat} className="ml-auto gap-1.5">
                                <Plus className="h-4 w-4" />Kategoriya qo'shish
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox checked={categories.length > 0 && catSelected.size === categories.length}
                                            onCheckedChange={toggleAllCat} disabled={categories.length === 0} />
                                    </TableHead>
                                    <TableHead>Nomi</TableHead>
                                    <TableHead>Xarajatlar</TableHead>
                                    <TableHead>Holat</TableHead>
                                    <TableHead>Yaratilgan</TableHead>
                                    <TableHead className="text-right">Amallar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {catsLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-12">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell></TableRow>
                                ) : !selectedBranchId ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Filial tanlang</TableCell></TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                        {catSearch ? "Qidiruv bo'yicha natija topilmadi" : "Kategoriyalar mavjud emas"}
                                    </TableCell></TableRow>
                                ) : (
                                    categories.map((c) => (
                                        <TableRow key={c.id} className={catSelected.has(c.id) ? "bg-muted/40" : ""}>
                                            <TableCell>
                                                <Checkbox checked={catSelected.has(c.id)} onCheckedChange={() => toggleCat(c.id)} />
                                            </TableCell>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{Array.isArray(c.cost) ? c.cost.length : 0} ta</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                                                    {c.status === "ACTIVE" ? "Faol" : "Nofaol"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEditCat(c)}>Tahrirlash</Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                                                    onClick={() => setCatDeleteId(c.id)}>O'chirish</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {categories.length > 0 && (
                            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
                                {categories.length} ta kategoriya
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ══ Category Dialog ═══════════════════════════════════════════════ */}
            <Dialog open={catDialog} onOpenChange={setCatDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{catEdit ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Kategoriya nomi" value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveCat()} autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCatDialog(false)} disabled={isCatSaving}>Bekor qilish</Button>
                        <Button onClick={saveCat} disabled={isCatSaving}>
                            {isCatSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Cost Dialog ═══════════════════════════════════════════════════ */}
            <Dialog open={costDialog} onOpenChange={setCostDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{costEdit ? "Xarajatni tahrirlash" : "Yangi xarajat"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Nomi <span className="text-destructive">*</span></Label>
                            <Input placeholder="Masalan: Svet" value={costForm.name}
                                onChange={(e) => setCostForm({ ...costForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tavsif</Label>
                            <Input placeholder="Izoh (ixtiyoriy)" value={costForm.desc}
                                onChange={(e) => setCostForm({ ...costForm, desc: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Miqdor</Label>
                                <Input type="number" min={1} placeholder="1" value={costForm.quantity}
                                    onChange={(e) => setCostForm({ ...costForm, quantity: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Summa (so'm) <span className="text-destructive">*</span></Label>
                                <Input type="number" min={0} placeholder="0" value={costForm.costAmount}
                                    onChange={(e) => setCostForm({ ...costForm, costAmount: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Kategoriya <span className="text-destructive">*</span></Label>
                            <Select value={costForm.costsCategoryId}
                                onValueChange={(v) => setCostForm({ ...costForm, costsCategoryId: v })}>
                                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCostDialog(false)} disabled={isCostSaving}>Bekor qilish</Button>
                        <Button onClick={saveCost} disabled={isCostSaving}>
                            {isCostSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Alert Dialogs ══════════════════════════════════════════════════ */}
            {/* Cat delete single */}
            <AlertDialog open={!!catDeleteId} onOpenChange={() => setCatDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>Unga bog'liq xarajatlar ham o'chishi mumkin.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={catDeleteMut.isPending}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => catDeleteId && catDeleteMut.mutate(catDeleteId)}
                            disabled={catDeleteMut.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {catDeleteMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cat delete many */}
            <AlertDialog open={catDeleteMany} onOpenChange={setCatDeleteMany}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{catSelected.size} ta kategoriyani o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>Tanlangan <strong>{catSelected.size} ta</strong> kategoriya o'chib ketadi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={catDeleteManyMut.isPending}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => catDeleteManyMut.mutate()}
                            disabled={catDeleteManyMut.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {catDeleteManyMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cost delete single */}
            <AlertDialog open={!!costDeleteId} onOpenChange={() => setCostDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>Bu xarajat butunlay o'chiriladi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={costDeleteMut.isPending}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => costDeleteId && costDeleteMut.mutate(costDeleteId)}
                            disabled={costDeleteMut.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {costDeleteMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cost delete many */}
            <AlertDialog open={costDeleteMany} onOpenChange={setCostDeleteMany}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{costSelected.size} ta xarajatni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>Tanlangan <strong>{costSelected.size} ta</strong> xarajat o'chib ketadi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={costDeleteManyMut.isPending}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={() => costDeleteManyMut.mutate()}
                            disabled={costDeleteManyMut.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {costDeleteManyMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}O'chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
