import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMutation } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { productCategories as initCats, products as initProducts, formatPrice, statusLabels, ProductCategory, Product, Status } from '@/lib/mock-data';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerProducts() {
  const [categories, setCategories] = useState<ProductCategory[]>(initCats);
  const [productsList, setProductsList] = useState<Product[]>(initProducts);
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const [prodDialog, setProdDialog] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', desc: '', price: '', productCategoryId: '' });
  const [prodPhoto, setProdPhoto] = useState<File | null>(null);
  const [deleteProdId, setDeleteProdId] = useState<string | null>(null);

  const [catDialog, setCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<ProductCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '' });
  const [catIcon, setCatIcon] = useState<File | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const activeCats = categories.filter(c => c.status === 'ACTIVE');

  const createProductMutation = useMutation({
    mutationFn: (data: Parameters<typeof productService.create>[0]) => productService.create(data),
    onSuccess: () => toast.success('Mahsulot yaratildi'),
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => toast.success("Mahsulot o'chirildi"),
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const toggleProductMutation = useMutation({
    mutationFn: (id: string) => productService.toggleStatus(id),
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Parameters<typeof categoryService.create>[0]) => categoryService.create(data),
    onSuccess: () => toast.success('Kategoriya yaratildi'),
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryService.toggleStatus(id),
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const filteredProducts = productsList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'ALL' || p.productCategoryId === catFilter;
    return matchSearch && matchCat;
  });

  // Product handlers
  const openAddProd = () => { setEditProd(null); setProdForm({ name: '', desc: '', price: '', productCategoryId: activeCats[0]?.id || '' }); setProdPhoto(null); setProdDialog(true); };
  const openEditProd = (p: Product) => { setEditProd(p); setProdForm({ name: p.name, desc: p.desc, price: String(p.price), productCategoryId: p.productCategoryId }); setProdPhoto(null); setProdDialog(true); };
  const saveProd = () => {
    const data = { ...prodForm, price: Number(prodForm.price) };
    if (editProd) {
      setProductsList(prev => prev.map(p => p.id === editProd.id ? { ...p, ...data } : p));
    } else {
      createProductMutation.mutate({
        name: data.name, desc: data.desc, price: data.price,
        amount: 0, unit: 'DONA', branchId: 'b1',
        productCategoryId: data.productCategoryId,
        photo: prodPhoto || undefined,
      });
      setProductsList(prev => [...prev, { id: `p${Date.now()}`, ...data, branchId: 'b1', status: 'ACTIVE' as Status }]);
    }
    setProdDialog(false);
  };
  const deleteProd = () => {
    if (deleteProdId) {
      setProductsList(prev => prev.filter(p => p.id !== deleteProdId));
      deleteProductMutation.mutate(deleteProdId);
      setDeleteProdId(null);
    }
  };
  const toggleProdStatus = (id: string) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p));
    toggleProductMutation.mutate(id);
  };

  // Category handlers
  const openAddCat = () => { setEditCat(null); setCatForm({ name: '' }); setCatIcon(null); setCatDialog(true); };
  const openEditCat = (c: ProductCategory) => { setEditCat(c); setCatForm({ name: c.name }); setCatIcon(null); setCatDialog(true); };
  const saveCat = () => {
    if (editCat) {
      setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...catForm } : c));
    } else {
      createCategoryMutation.mutate({ name: catForm.name, branchId: 'b1', icon: catIcon || undefined });
      setCategories(prev => [...prev, { id: `pc${Date.now()}`, ...catForm, branchId: 'b1', status: 'ACTIVE' as Status }]);
    }
    setCatDialog(false);
  };
  const deleteCat = () => { if (deleteCatId) { setCategories(prev => prev.filter(c => c.id !== deleteCatId)); setDeleteCatId(null); } };
  const toggleCatStatus = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c));
    toggleCategoryMutation.mutate(id);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Mahsulotlar</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="categories">Kategoriyalar</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Barcha kategoriya</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openAddProd} size="sm"><Plus className="h-4 w-4 mr-1" /> Qo'shish</Button>
          </div>

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
                {filteredProducts.map(p => {
                  const cat = categories.find(c => c.id === p.productCategoryId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.desc}</TableCell>
                      <TableCell><Badge variant="secondary">{cat?.name || '—'}</Badge></TableCell>
                      <TableCell className="font-medium">{formatPrice(p.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={p.status === 'ACTIVE'} onCheckedChange={() => toggleProdStatus(p.id)} />
                          <span className="text-sm text-muted-foreground">{statusLabels[p.status]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditProd(p)}>Tahrirlash</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteProdId(p.id)}>O'chirish</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Mahsulot topilmadi</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex items-center justify-between mb-4">
            <div />
            <Button onClick={openAddCat} size="sm"><Plus className="h-4 w-4 mr-1" /> Qo'shish</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Mahsulotlar soni</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => {
                  const prodCount = productsList.filter(p => p.productCategoryId === c.id).length;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="secondary">{prodCount}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={c.status === 'ACTIVE'} onCheckedChange={() => toggleCatStatus(c.id)} />
                          <span className="text-sm text-muted-foreground">{statusLabels[c.status]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditCat(c)}>Tahrirlash</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteCatId(c.id)}>O'chirish</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={prodDialog} onOpenChange={setProdDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editProd ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nomi</Label><Input value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tavsif</Label><Input value={prodForm.desc} onChange={e => setProdForm({ ...prodForm, desc: e.target.value })} /></div>
            <div className="space-y-2"><Label>Narx (so'm)</Label><Input type="number" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Kategoriya</Label>
              <Select value={prodForm.productCategoryId} onValueChange={v => setProdForm({ ...prodForm, productCategoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>{activeCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Rasm</Label><Input type="file" accept="image/*" onChange={e => setProdPhoto(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdDialog(false)}>Bekor qilish</Button>
            <Button onClick={saveProd} disabled={createProductMutation.isPending}>
              {createProductMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nomi</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Icon</Label><Input type="file" accept="image/*" onChange={e => setCatIcon(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Bekor qilish</Button>
            <Button onClick={saveCat} disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={!!deleteProdId} onOpenChange={() => setDeleteProdId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle><AlertDialogDescription>Aniq o'chirmoqchimisiz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Bekor qilish</AlertDialogCancel><AlertDialogAction onClick={deleteProd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">O'chirish</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle><AlertDialogDescription>Bu kategoriyaning barcha mahsulotlari ham o'chib ketadi. Aniq o'chirmoqchimisiz?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Bekor qilish</AlertDialogCancel><AlertDialogAction onClick={deleteCat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">O'chirish</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
