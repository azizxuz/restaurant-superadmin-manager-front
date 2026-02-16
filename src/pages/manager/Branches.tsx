import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogDescription,
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
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  branchService,
  BranchPayload,
  BranchResponse,
} from "@/services/branchService";
import { userService } from "@/services/userService";
import { statusLabels } from "@/lib/mock-data";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManagerBranches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<BranchResponse | null>(null);
  const [form, setForm] = useState({ name: "", addres: "" });

  // 📦 Serverdan filiallarni olish
  const {
    data: branchData,
    isLoading: branchesLoading,
    isError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAll(),
  });

  const branchList: BranchResponse[] = branchData?.data || [];

  // 📦 Barcha xodimlarni olish (barcha filiallar uchun)
  const { data: allUsersData } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      try {
        // Barcha filiallardan xodimlarni olish
        const allStaff = [];
        for (const branch of branchList) {
          try {
            const response = await userService.getStaffByBranch(branch.id);

            // Response strukturasini tekshirish
            let staffData = [];
            if (response?.data?.data && Array.isArray(response.data.data)) {
              staffData = response.data.data;
            } else if (response?.data && Array.isArray(response.data)) {
              staffData = response.data;
            } else if (Array.isArray(response)) {
              staffData = response;
            }

            allStaff.push(...staffData);
          } catch (err) {
            console.error(`Error fetching staff for branch ${branch.id}:`, err);
          }
        }
        return allStaff;
      } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
      }
    },
    enabled: branchList.length > 0,
  });

  const allUsers = Array.isArray(allUsersData) ? allUsersData : [];

  // ✅ Filial yaratish
  const createMutation = useMutation({
    mutationFn: (data: BranchPayload) => branchService.create(data),
    onSuccess: () => {
      toast.success("Filial yaratildi");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setDialogOpen(false);
      setForm({ name: "", addres: "" });
    },
    onError: (error: any) => {
      console.error("Create error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // ✅ Filial tahrirlash
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchPayload }) =>
      branchService.update(id, data),
    onSuccess: () => {
      toast.success("Filial yangilandi");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDialogOpen(false);
      setEditItem(null);
      setForm({ name: "", addres: "" });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // ✅ Filial o'chirish
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => {
      toast.success("Filial o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  // ✅ Status toggle
  const toggleMutation = useMutation({
    mutationFn: (id: string) => branchService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (error: any) => {
      console.error("Toggle error:", error);
      toast.error(error?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const filtered = branchList.filter((b) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Xodimlar sonini hisoblash funksiyasi
  const getStaffCount = (branchId: string): number => {
    return allUsers.filter((u) => u.branchId === branchId).length;
  };

  // --- Dialoglar ---
  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", addres: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: BranchResponse) => {
    setEditItem(b);
    setForm({ name: b.name, addres: b.addres || "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Validatsiya
    if (!form.name.trim()) {
      toast.error("Filial nomini kiriting");
      return;
    }

    const payload: BranchPayload = {
      name: form.name.trim(),
      addres: form.addres.trim(),
    };

    if (editItem) {
      // ✅ Tahrirlash
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      // ✅ Yangi filial yaratish
      createMutation.mutate(payload);
    }
  };

  const toggleStatus = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (branchesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Xatolik yuz berdi</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["branches"] })
            }
          >
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Filiallar</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Qo'shish
        </Button>
      </div>

      <Input
        placeholder="Qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs mb-4"
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Manzil</TableHead>
              <TableHead>Xodimlar</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => {
              const staffCount = getStaffCount(b.id);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.addres || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{staffCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={b.status === "ACTIVE"}
                        onCheckedChange={() => toggleStatus(b.id)}
                        disabled={toggleMutation.isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {statusLabels[b.status as keyof typeof statusLabels] ||
                          b.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(b)}
                    >
                      Tahrirlash
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteId(b.id)}
                    >
                      O'chirish
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  {search ? "Filial topilmadi" : "Hozircha filiallar yo'q"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Qo'shish/Tahrirlash Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Filialni tahrirlash" : "Yangi filial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Filial nomi"
              />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                value={form.addres}
                onChange={(e) => setForm({ ...form, addres: e.target.value })}
                placeholder="Filial manzili"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
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

      {/* O'chirish Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Filialni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu filialdagi barcha xodimlar, mahsulotlar va buyurtmalar o'chib
              ketadi. Aniq o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
