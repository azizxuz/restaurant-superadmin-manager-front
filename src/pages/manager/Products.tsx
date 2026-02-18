import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { branchService, BranchResponse } from "@/services/branchService";
import { formatPrice, statusLabels } from "@/lib/mock-data";
import api from "@/lib/api";
import {
  Plus,
  Loader2,
  Store,
  RefreshCw,
  MapPin,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Popular Product Service (inline) ────────────────────────────────────────
const popularProductService = {
  getByBranch: (branchId: string) =>
    api.get(`/popular-products/all/manager/${branchId}`),
  create: (data: { productId: string; branchId: string }) =>
    api.post("/popular-products", data),
  delete: (id: string) => api.delete(`/popular-products/${id}`),
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = "ACTIVE" | "INACTIVE";

interface ProductCategory {
  id: string;
  name: string;
  branchId: string;
  status: StatusType;
}

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  amount: number;
  unit: string;
  branchId: string;
  productCategoryId: string;
  status: StatusType;
}

interface PopularProduct {
  id: string;
  productId: string;
  branchId: string;
  createdAt?: string;
}

// API har xil struktura qaytarishi mumkin — doim arrayga normallash
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function ManagerProducts() {
  const queryClient = useQueryClient();

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("products");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  // Product dialog
  const [prodDialog, setProdDialog] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    desc: "",
    price: "",
    productCategoryId: "",
  });
  const [deleteProdId, setDeleteProdId] = useState<string | null>(null);

  // Category dialog
  const [catDialog, setCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // Popular products dialog
  const [popularDialog, setPopularDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deletePopularId, setDeletePopularId] = useState<string | null>(null);

  // ─── Branches ─────────────────────────────────────────────────────────────
  const { data: branchesRaw, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches-my"],
    queryFn: () => branchService.getAll().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const branches = toArray<BranchResponse>(branchesRaw);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      setCatFilter("ALL");
      setSearch("");
    }
  }, [selectedBranchId]);

  // ─── Categories ───────────────────────────────────────────────────────────
  const {
    data: catsRaw,
    isLoading: catsLoading,
    refetch: refetchCats,
  } = useQuery({
    queryKey: ["categories", selectedBranchId],
    queryFn: () =>
      categoryService.getByBranch(selectedBranchId).then((r) => r.data),
    enabled: !!selectedBranchId,
  });
  const categories = toArray<ProductCategory>(catsRaw);
  const activeCats = categories.filter((c) => c.status === "ACTIVE");

  // ─── Products ─────────────────────────────────────────────────────────────
  const {
    data: prodsRaw,
    isLoading: prodsLoading,
    refetch: refetchProds,
  } = useQuery({
    queryKey: ["products", selectedBranchId],
    queryFn: () =>
      productService.getByBranch(selectedBranchId).then((r) => r.data),
    enabled: !!selectedBranchId,
  });
  const productsList = toArray<Product>(prodsRaw);

  // ─── Popular Products ─────────────────────────────────────────────────────
  const {
    data: popularRaw,
    isLoading: popularLoading,
    refetch: refetchPopular,
  } = useQuery({
    queryKey: ["popular-products", selectedBranchId],
    queryFn: () =>
      popularProductService.getByBranch(selectedBranchId).then((r) => r.data),
    enabled: !!selectedBranchId,
  });
  const popularList = toArray<PopularProduct>(popularRaw);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // ─── Product mutations ────────────────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: (data: Parameters<typeof productService.create>[0]) =>
      productService.create(data),
    onSuccess: () => {
      toast.success("Mahsulot yaratildi");
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
      setProdDialog(false);
    },
    onError: () => toast.error("Mahsulot yaratishda xatolik"),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof productService.update>[1];
    }) => productService.update(id, data),
    onSuccess: () => {
      toast.success("Mahsulot yangilandi");
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
      setProdDialog(false);
    },
    onError: () => toast.error("Mahsulot yangilashda xatolik"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      toast.success("Mahsulot o'chirildi");
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
      setDeleteProdId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const toggleProductMutation = useMutation({
    mutationFn: (id: string) => productService.toggleStatus(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      }),
    onError: () => {
      toast.error("Holat o'zgartirishda xatolik");
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
    },
  });

  // ─── Category mutations ───────────────────────────────────────────────────
  const createCategoryMutation = useMutation({
    mutationFn: (data: Parameters<typeof categoryService.create>[0]) =>
      categoryService.create(data),
    onSuccess: () => {
      toast.success("Kategoriya yaratildi");
      queryClient.invalidateQueries({
        queryKey: ["categories", selectedBranchId],
      });
      setCatDialog(false);
    },
    onError: () => toast.error("Kategoriya yaratishda xatolik"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof categoryService.update>[1];
    }) => categoryService.update(id, data),
    onSuccess: () => {
      toast.success("Kategoriya yangilandi");
      queryClient.invalidateQueries({
        queryKey: ["categories", selectedBranchId],
      });
      setCatDialog(false);
    },
    onError: () => toast.error("Kategoriya yangilashda xatolik"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      toast.success("Kategoriya o'chirildi");
      queryClient.invalidateQueries({
        queryKey: ["categories", selectedBranchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["products", selectedBranchId],
      });
      setDeleteCatId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryService.toggleStatus(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["categories", selectedBranchId],
      }),
    onError: () => {
      toast.error("Holat o'zgartirishda xatolik");
      queryClient.invalidateQueries({
        queryKey: ["categories", selectedBranchId],
      });
    },
  });

  // ─── Popular Product mutations ────────────────────────────────────────────
  const createPopularMutation = useMutation({
    mutationFn: (data: { productId: string; branchId: string }) =>
      popularProductService.create(data),
    onSuccess: () => {
      toast.success("Tezkor mahsulotga qo'shildi");
      queryClient.invalidateQueries({
        queryKey: ["popular-products", selectedBranchId],
      });
      setPopularDialog(false);
      setSelectedProductId("");
    },
    onError: () => toast.error("Tezkor mahsulotga qo'shishda xatolik"),
  });

  const deletePopularMutation = useMutation({
    mutationFn: (id: string) => popularProductService.delete(id),
    onSuccess: () => {
      toast.success("Tezkor mahsulotdan o'chirildi");
      queryClient.invalidateQueries({
        queryKey: ["popular-products", selectedBranchId],
      });
      setDeletePopularId(null);
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  // ─── Filtered ─────────────────────────────────────────────────────────────
  const filteredProducts = productsList.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || p.productCategoryId === catFilter;
    return matchSearch && matchCat;
  });

  // Tezkor mahsulotlar uchun mavjud mahsulotlar (hali qo'shilmagan)
  const availableForPopular = productsList.filter(
    (p) =>
      p.status === "ACTIVE" &&
      !popularList.some((pop) => pop.productId === p.id)
  );

  // ─── Product handlers ─────────────────────────────────────────────────────
  const openAddProd = () => {
    setEditProd(null);
    setProdForm({
      name: "",
      desc: "",
      price: "",
      productCategoryId: activeCats[0]?.id || "",
    });
    setProdDialog(true);
  };

  const openEditProd = (p: Product) => {
    setEditProd(p);
    setProdForm({
      name: p.name,
      desc: p.desc,
      price: String(p.price),
      productCategoryId: p.productCategoryId,
    });
    setProdDialog(true);
  };

  const saveProd = () => {
    if (!prodForm.name.trim()) return toast.error("Mahsulot nomini kiriting");
    if (!prodForm.price || isNaN(Number(prodForm.price)))
      return toast.error("Narxni to'g'ri kiriting");
    if (!prodForm.productCategoryId) return toast.error("Kategoriyani tanlang");

    if (editProd) {
      updateProductMutation.mutate({
        id: editProd.id,
        data: {
          name: prodForm.name,
          desc: prodForm.desc,
          price: Number(prodForm.price),
          productCategoryId: prodForm.productCategoryId,
        },
      });
    } else {
      createProductMutation.mutate({
        name: prodForm.name,
        desc: prodForm.desc,
        price: Number(prodForm.price),
        amount: 0,
        unit: "DONA",
        branchId: selectedBranchId,
        productCategoryId: prodForm.productCategoryId,
      });
    }
  };

  // ─── Category handlers ────────────────────────────────────────────────────
  const openAddCat = () => {
    setEditCat(null);
    setCatName("");
    setCatDialog(true);
  };

  const openEditCat = (c: ProductCategory) => {
    setEditCat(c);
    setCatName(c.name);
    setCatDialog(true);
  };

  const saveCat = () => {
    if (!catName.trim()) return toast.error("Kategoriya nomini kiriting");
    if (editCat) {
      updateCategoryMutation.mutate({
        id: editCat.id,
        data: { name: catName },
      });
    } else {
      createCategoryMutation.mutate({
        name: catName,
        branchId: selectedBranchId,
      });
    }
  };

  // ─── Popular handlers ─────────────────────────────────────────────────────
  const openAddPopular = () => {
    setSelectedProductId("");
    setPopularDialog(true);
  };

  const savePopular = () => {
    if (!selectedProductId) {
      return toast.error("Mahsulotni tanlang");
    }
    createPopularMutation.mutate({
      productId: selectedProductId,
      branchId: selectedBranchId,
    });
  };

  const isProdSaving =
    createProductMutation.isPending || updateProductMutation.isPending;
  const isCatSaving =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;
  const isPopularSaving = createPopularMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mahsulotlar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filial bo'yicha mahsulot va kategoriyalarni boshqaring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchCats();
            refetchProds();
            refetchPopular();
          }}
          className="gap-1.5"
          disabled={!selectedBranchId}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Yangilash
        </Button>
      </div>

      {/* Branch selector */}
      <Card className="p-4">
        {branchesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Filiallar
            yuklanmoqda...
          </div>
        ) : branches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Hech qanday filial topilmadi
          </p>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Faol filial
                </p>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger className="h-8 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0 w-72">
                    <SelectValue placeholder="Filial tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium">{b.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBranchId && (
              <div className="flex gap-5 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold">{productsList.length}</p>
                  <p className="text-xs text-muted-foreground">Mahsulot</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-lg font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Kategoriya</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {productsList.filter((p) => p.status === "ACTIVE").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Faol</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-lg font-bold text-amber-600">
                    {popularList.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Tezkor</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {!selectedBranchId ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Davom etish uchun yuqoridan filial tanlang
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="products">
              Mahsulotlar
              {productsList.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
                  {productsList.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories">
              Kategoriyalar
              {categories.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
                  {categories.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="popular">
              <Star className="h-3.5 w-3.5 mr-1" />
              Tezkor Mahsulotlar
              {popularList.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 text-xs">
                  {popularList.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ══ Products ══════════════════════════════════════════════════════ */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex gap-2 flex-1 min-w-0">
                <Input
                  placeholder="Mahsulot qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Barcha kategoriyalar</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.name}
                          {c.status === "INACTIVE" && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-1"
                            >
                              Nofaol
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={openAddProd}
                size="sm"
                disabled={activeCats.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" /> Mahsulot qo'shish
              </Button>
            </div>

            {activeCats.length === 0 && !catsLoading && (
              <div className="text-center py-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                ⚠️ Mahsulot qo'shish uchun avval faol kategoriya yarating
              </div>
            )}

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narx</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prodsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-10"
                      >
                        {search || catFilter !== "ALL"
                          ? "Qidiruv natijasi topilmadi"
                          : "Mahsulotlar mavjud emas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((p) => {
                      const cat = categories.find(
                        (c) => c.id === p.productCategoryId
                      );
                      const isPopular = popularList.some(
                        (pop) => pop.productId === p.id
                      );
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {p.name}
                              {isPopular && (
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                            {p.desc || "—"}
                          </TableCell>
                          <TableCell>
                            {cat ? (
                              <Badge variant="secondary">{cat.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(p.price)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={p.status === "ACTIVE"}
                                onCheckedChange={() =>
                                  toggleProductMutation.mutate(p.id)
                                }
                                disabled={toggleProductMutation.isPending}
                              />
                              <Badge
                                variant={
                                  p.status === "ACTIVE"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {statusLabels[p.status]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditProd(p)}
                            >
                              Tahrirlash
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteProdId(p.id)}
                            >
                              O'chirish
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ══ Categories ════════════════════════════════════════════════════ */}
          <TabsContent value="categories">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedBranch?.name}
                </span>{" "}
                filialining kategoriyalari
              </p>
              <Button onClick={openAddCat} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Kategoriya qo'shish
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-10"
                      >
                        Kategoriyalar mavjud emas
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((c) => {
                      const prodCount = productsList.filter(
                        (p) => p.productCategoryId === c.id
                      ).length;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{prodCount} ta</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={c.status === "ACTIVE"}
                                onCheckedChange={() =>
                                  toggleCategoryMutation.mutate(c.id)
                                }
                                disabled={toggleCategoryMutation.isPending}
                              />
                              <Badge
                                variant={
                                  c.status === "ACTIVE"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {statusLabels[c.status]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCat(c)}
                            >
                              Tahrirlash
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteCatId(c.id)}
                            >
                              O'chirish
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ══ Popular Products ══════════════════════════════════════════════ */}
          <TabsContent value="popular">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Tezkor mahsulotlar
                </p>
                <p className="text-xs text-muted-foreground">
                  Afitsantlar uchun tez buyurtma berish imkoniyati
                </p>
              </div>
              <Button
                onClick={openAddPopular}
                size="sm"
                disabled={availableForPopular.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" /> Qo'shish
              </Button>
            </div>

            {availableForPopular.length === 0 && !popularLoading && (
              <div className="text-center py-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                ⚠️ Barcha faol mahsulotlar allaqachon tezkor ro'yxatda
              </div>
            )}

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead>Kategoriya</TableHead>
                    <TableHead>Narx</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : popularList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-10"
                      >
                        Hozircha tezkor mahsulotlar yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    popularList.map((pop) => {
                      const product = productsList.find(
                        (p) => p.id === pop.productId
                      );
                      const cat = categories.find(
                        (c) => c.id === product?.productCategoryId
                      );
                      return (
                        <TableRow key={pop.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              {product?.name || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {cat ? (
                              <Badge variant="secondary">{cat.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {product ? formatPrice(product.price) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletePopularId(pop.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ══ Product Dialog ════════════════════════════════════════════════════ */}
      <Dialog open={prodDialog} onOpenChange={setProdDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editProd ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Mahsulot nomini kiriting"
                value={prodForm.name}
                onChange={(e) =>
                  setProdForm({ ...prodForm, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Input
                placeholder="Qisqacha tavsif (ixtiyoriy)"
                value={prodForm.desc}
                onChange={(e) =>
                  setProdForm({ ...prodForm, desc: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  Narx (so'm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={prodForm.price}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Kategoriya <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={prodForm.productCategoryId}
                  onValueChange={(v) =>
                    setProdForm({ ...prodForm, productCategoryId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              Filial:{" "}
              <span className="font-medium text-foreground ml-1">
                {selectedBranch?.name}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProdDialog(false)}
              disabled={isProdSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={saveProd} disabled={isProdSaving}>
              {isProdSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editProd ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Category Dialog ═══════════════════════════════════════════════════ */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editCat ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Kategoriya nomini kiriting"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              Filial:{" "}
              <span className="font-medium text-foreground ml-1">
                {selectedBranch?.name}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDialog(false)}
              disabled={isCatSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={saveCat} disabled={isCatSaving}>
              {isCatSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {editCat ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Popular Product Dialog ════════════════════════════════════════════ */}
      <Dialog open={popularDialog} onOpenChange={setPopularDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tezkor mahsulotga qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Mahsulot <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mahsulotni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {availableForPopular.map((p) => {
                    const cat = categories.find(
                      (c) => c.id === p.productCategoryId
                    );
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {cat?.name} • {formatPrice(p.price)}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Tezkor mahsulotlar afitsantlarga buyurtma tezroq berish imkonini
              beradi
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPopularDialog(false)}
              disabled={isPopularSaving}
            >
              Bekor qilish
            </Button>
            <Button onClick={savePopular} disabled={isPopularSaving}>
              {isPopularSaving && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Product ════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteProdId}
        onOpenChange={() => setDeleteProdId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu mahsulot butunlay o'chiriladi. Qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteProdId && deleteProductMutation.mutate(deleteProdId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete Category ═══════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteCatId}
        onOpenChange={() => setDeleteCatId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Unga bog'liq{" "}
              <strong>
                {deleteCatId
                  ? productsList.filter(
                      (p) => p.productCategoryId === deleteCatId
                    ).length
                  : 0}{" "}
                ta mahsulot
              </strong>{" "}
              ham o'chishi mumkin. Davom etasizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCatId && deleteCategoryMutation.mutate(deleteCatId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Delete Popular Product ════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deletePopularId}
        onOpenChange={() => setDeletePopularId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tezkor mahsulotdan o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu mahsulot tezkor ro'yxatdan olib tashlanadi. Asosiy mahsulotlar
              ro'yxatida qoladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePopularId && deletePopularMutation.mutate(deletePopularId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePopularMutation.isPending}
            >
              {deletePopularMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
