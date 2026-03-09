import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { kitchenService, Kitchen } from "@/services/kitchenService";
import { branchService } from "@/services/branchService";

export default function Kitchens() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<Kitchen | null>(null);
    const [form, setForm] = useState({ name: "", branchId: "", posIp: "", posPort: "" });

    // ================= BRANCHES =================
    const { data: branchesList = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getAll(),
        select: (res: any) => {
            const raw = res?.data?.data ?? res?.data ?? res ?? [];
            return Array.isArray(raw) ? raw : [];
        },
        initialData: [],
    });

    const safeBranches = Array.isArray(branchesList) ? branchesList : [];

    useEffect(() => {
        if (safeBranches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(safeBranches[0]?.id ?? "");
        }
    }, [safeBranches, selectedBranchId]);

    // ================= KITCHENS =================
    const { data: kitchensList = [] } = useQuery({
        queryKey: ["kitchens", selectedBranchId],
        queryFn: () => kitchenService.getAll(selectedBranchId),
        enabled: !!selectedBranchId,
        select: (res: any) => {
            const raw = res?.data?.data ?? res?.data ?? res ?? [];
            return Array.isArray(raw) ? raw : [];
        },
        initialData: [],
    });

    const safeKitchens = Array.isArray(kitchensList) ? kitchensList : [];

    const filtered = safeKitchens.filter((k: Kitchen) =>
        k.name?.toLowerCase().includes(search.toLowerCase())
    );

    // ================= MUTATIONS =================
    const createMutation = useMutation({
        mutationFn: () =>
            kitchenService.create({
                name: form.name,
                branchId: form.branchId,
                ...(form.posIp ? { posIp: form.posIp } : {}),
                ...(form.posPort ? { posPort: form.posPort } : {}),
            }),
        onSuccess: () => {
            toast.success("Oshxona yaratildi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDialogOpen(false);
            setForm({ name: "", branchId: selectedBranchId, posIp: "", posPort: "" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: () =>
            kitchenService.update(editItem!.id, {
                name: form.name,
                ...(form.posIp ? { posIp: form.posIp } : {}),
                ...(form.posPort ? { posPort: form.posPort } : {}),
            }),
        onSuccess: () => {
            toast.success("Oshxona yangilandi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDialogOpen(false);
            setEditItem(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => kitchenService.delete(id),
        onSuccess: () => {
            toast.success("O'chirildi");
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
            setDeleteId(null);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => kitchenService.toggleStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kitchens", selectedBranchId] });
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: "", branchId: selectedBranchId, posIp: "", posPort: "" });
        setDialogOpen(true);
    };

    const openEdit = (k: Kitchen) => {
        setEditItem(k);
        setForm({ name: k.name, branchId: k.branchId, posIp: k.posIp || "", posPort: k.posPort || "" });
        setDialogOpen(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) return toast.error("Nom kiriting");
        editItem ? updateMutation.mutate() : createMutation.mutate();
    };

    // ================= UI =================
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Oshxonalar</h2>
                <Button onClick={openAdd} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Qo'shish
                </Button>
            </div>

            <div className="flex gap-3 mb-4">
                <Input
                    placeholder="Qidirish..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />

                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Filial tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                        {safeBranches.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                                {b.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomi</TableHead>
                            <TableHead>POS IP</TableHead>
                            <TableHead>POS Port</TableHead>
                            <TableHead>Holat</TableHead>
                            <TableHead className="text-right">Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((k: Kitchen) => (
                            <TableRow key={k.id}>
                                <TableCell>{k.name}</TableCell>
                                <TableCell>{k.posIp || "—"}</TableCell>
                                <TableCell>{k.posPort || "—"}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={k.status === "ACTIVE"}
                                        onCheckedChange={() => toggleMutation.mutate(k.id)}
                                        disabled={toggleMutation.isPending}
                                    />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(k)}>
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => setDeleteId(k.id)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Ma'lumot yo'q
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* ADD / EDIT DIALOG */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? "Tahrirlash" : "Yangi oshxona"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Nomi</Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Saqlash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Rostdan ham o‘chirmoqchimisiz?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Bekor</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                        >
                            O‘chirish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
