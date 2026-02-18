export type Status = "ACTIVE" | "INACTIVE";
export type OrderStatus = "PENDING" | "SUCCESS" | "CANCELED";
export type UserRole =
  | "SUPERADMIN"
  | "MANAGER"
  | "AFITSANT"
  | "CHEF"
  | "KASSA"
  | "SUPER_AFITSANT"; // ✅ Type'da mavjud

export interface Company {
  id: string;
  name: string;
  phone: string;
  founderName: string;
  logo?: string;
  bio?: string;
}
export interface Branch {
  id: string;
  name: string;
  address?: string;
  companyId: string;
  status: Status;
}
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  status: Status;
}
export interface Room {
  id: string;
  name: string;
  branchId: string;
}
export interface ProductCategory {
  id: string;
  name: string;
  branchId: string;
  status: Status;
}
export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  branchId: string;
  productCategoryId: string;
  status: Status;
}
export interface Order {
  id: string;
  userId: string;
  roomId: string;
  branchId: string;
  status: OrderStatus;
  createdAt: string;
  endAt: string;
}
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  branchId: string;
  count: number;
}

export const companies: Company[] = [
  {
    id: "c1",
    name: "Milliy Taomlar",
    phone: "+998712345678",
    founderName: "Akbar Karimov",
    bio: "O'zbek milliy taomlari tarmog'i",
  },
  {
    id: "c2",
    name: "Silk Road Restaurant",
    phone: "+998712345679",
    founderName: "Jasur Toshmatov",
    bio: "Premium restoran",
  },
  {
    id: "c3",
    name: "Oasis Cafe",
    phone: "+998712345680",
    founderName: "Nodira Aliyeva",
    bio: "Zamonaviy kafe",
  },
];

export const branches: Branch[] = [
  {
    id: "b1",
    name: "Chilonzor filiali",
    address: "Chilonzor 9-kvartal",
    companyId: "c1",
    status: "ACTIVE",
  },
  {
    id: "b2",
    name: "Yunusobod filiali",
    address: "Yunusobod 4-kvartal",
    companyId: "c1",
    status: "ACTIVE",
  },
  {
    id: "b3",
    name: "Sergeli filiali",
    address: "Sergeli 7-kvartal",
    companyId: "c1",
    status: "INACTIVE",
  },
  {
    id: "b4",
    name: "Tashkent City",
    address: "Tashkent City Mall",
    companyId: "c2",
    status: "ACTIVE",
  },
  {
    id: "b5",
    name: "Samarqand filiali",
    address: "Registon ko'chasi",
    companyId: "c2",
    status: "INACTIVE",
  },
  {
    id: "b6",
    name: "Mirzo Ulug'bek",
    address: "Mirzo Ulug'bek tumani",
    companyId: "c3",
    status: "ACTIVE",
  },
];

export const users: User[] = [
  {
    id: "u1",
    firstName: "Muhammadrioz",
    lastName: "Daminboev",
    phoneNumber: "+998901234567",
    role: "SUPERADMIN",
    companyId: "c1",
    status: "ACTIVE",
  },
  {
    id: "u2",
    firstName: "Aziz",
    lastName: "Rahimov",
    phoneNumber: "+998901234568",
    role: "MANAGER",
    companyId: "c1",
    branchId: "b1",
    status: "ACTIVE",
  },
  {
    id: "u3",
    firstName: "Bekzod",
    lastName: "Sultonov",
    phoneNumber: "+998901234569",
    role: "MANAGER",
    companyId: "c1",
    branchId: "b2",
    status: "ACTIVE",
  },
  {
    id: "u4",
    firstName: "Dilshod",
    lastName: "Ergashev",
    phoneNumber: "+998901234570",
    role: "AFITSANT",
    companyId: "c1",
    branchId: "b1",
    status: "ACTIVE",
  },
  {
    id: "u5",
    firstName: "Eldor",
    lastName: "Yusupov",
    phoneNumber: "+998901234571",
    role: "AFITSANT",
    companyId: "c1",
    branchId: "b1",
    status: "ACTIVE",
  },
  {
    id: "u6",
    firstName: "Farxod",
    lastName: "Tursunov",
    phoneNumber: "+998901234572",
    role: "CHEF",
    companyId: "c1",
    branchId: "b1",
    status: "ACTIVE",
  },
  {
    id: "u7",
    firstName: "Gulnora",
    lastName: "Karimova",
    phoneNumber: "+998901234573",
    role: "CHEF",
    companyId: "c1",
    branchId: "b2",
    status: "ACTIVE",
  },
  {
    id: "u8",
    firstName: "Hamid",
    lastName: "Normatov",
    phoneNumber: "+998901234574",
    role: "KASSA",
    companyId: "c1",
    branchId: "b1",
    status: "ACTIVE",
  },
  {
    id: "u9",
    firstName: "Ilhom",
    lastName: "Aliyev",
    phoneNumber: "+998901234575",
    role: "KASSA",
    companyId: "c1",
    branchId: "b2",
    status: "ACTIVE",
  },
  {
    id: "u10",
    firstName: "Jamshid",
    lastName: "Oripov",
    phoneNumber: "+998901234576",
    role: "AFITSANT",
    companyId: "c1",
    branchId: "b2",
    status: "INACTIVE",
  },
  {
    id: "u11",
    firstName: "Kamoliddin",
    lastName: "Xolov",
    phoneNumber: "+998901234577",
    role: "MANAGER",
    companyId: "c2",
    branchId: "b4",
    status: "ACTIVE",
  },
  {
    id: "u12",
    firstName: "Laziz",
    lastName: "Mirzayev",
    phoneNumber: "+998901234578",
    role: "AFITSANT",
    companyId: "c2",
    branchId: "b4",
    status: "ACTIVE",
  },
  {
    id: "u13",
    firstName: "Mavluda",
    lastName: "Saidova",
    phoneNumber: "+998901234579",
    role: "MANAGER",
    companyId: "c3",
    branchId: "b6",
    status: "ACTIVE",
  },
];

export const productCategories: ProductCategory[] = [
  { id: "pc1", name: "Birinchi taomlar", branchId: "b1", status: "ACTIVE" },
  { id: "pc2", name: "Ikkinchi taomlar", branchId: "b1", status: "ACTIVE" },
  { id: "pc3", name: "Salatlar", branchId: "b1", status: "ACTIVE" },
  { id: "pc4", name: "Ichimliklar", branchId: "b1", status: "ACTIVE" },
  {
    id: "pc5",
    name: "Nonlar va pishiriqlar",
    branchId: "b1",
    status: "ACTIVE",
  },
  { id: "pc6", name: "Shirinliklar", branchId: "b1", status: "INACTIVE" },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Mastava",
    desc: "An'anaviy guruch sho'rva",
    price: 28000,
    branchId: "b1",
    productCategoryId: "pc1",
    status: "ACTIVE",
  },
  {
    id: "p2",
    name: "Shurpa",
    desc: "Go'shtli sabzavotli sho'rva",
    price: 32000,
    branchId: "b1",
    productCategoryId: "pc1",
    status: "ACTIVE",
  },
  {
    id: "p3",
    name: "Lag'mon",
    desc: "Qo'lda cho'zilgan lag'mon",
    price: 35000,
    branchId: "b1",
    productCategoryId: "pc1",
    status: "ACTIVE",
  },
  {
    id: "p4",
    name: "Osh (Palov)",
    desc: "An'anaviy o'zbek oshi",
    price: 38000,
    branchId: "b1",
    productCategoryId: "pc2",
    status: "ACTIVE",
  },
  {
    id: "p5",
    name: "Manti",
    desc: "5 dona, go'shtli",
    price: 30000,
    branchId: "b1",
    productCategoryId: "pc2",
    status: "ACTIVE",
  },
  {
    id: "p6",
    name: "Chuchvara",
    desc: "Go'shtli chuchvara",
    price: 28000,
    branchId: "b1",
    productCategoryId: "pc2",
    status: "ACTIVE",
  },
  {
    id: "p7",
    name: "Kabob",
    desc: "Tандирda pishirilgan",
    price: 45000,
    branchId: "b1",
    productCategoryId: "pc2",
    status: "ACTIVE",
  },
  {
    id: "p8",
    name: "Achichiq salat",
    desc: "Pomidor, bodring, piyoz",
    price: 15000,
    branchId: "b1",
    productCategoryId: "pc3",
    status: "ACTIVE",
  },
  {
    id: "p9",
    name: "Sezar salat",
    desc: "Tovuq go'shtli sezar",
    price: 25000,
    branchId: "b1",
    productCategoryId: "pc3",
    status: "ACTIVE",
  },
  {
    id: "p10",
    name: "Coca-Cola",
    desc: "0.5L",
    price: 10000,
    branchId: "b1",
    productCategoryId: "pc4",
    status: "ACTIVE",
  },
  {
    id: "p11",
    name: "Choy (qora)",
    desc: "Choynek",
    price: 8000,
    branchId: "b1",
    productCategoryId: "pc4",
    status: "ACTIVE",
  },
  {
    id: "p12",
    name: "Kompot",
    desc: "Uy kompoti 1L",
    price: 15000,
    branchId: "b1",
    productCategoryId: "pc4",
    status: "ACTIVE",
  },
  {
    id: "p13",
    name: "Non",
    desc: "Tandirda pishirilgan non",
    price: 5000,
    branchId: "b1",
    productCategoryId: "pc5",
    status: "ACTIVE",
  },
  {
    id: "p14",
    name: "Somsa",
    desc: "Go'shtli tandir somsa",
    price: 12000,
    branchId: "b1",
    productCategoryId: "pc5",
    status: "ACTIVE",
  },
  {
    id: "p15",
    name: "Halvaitar",
    desc: "An'anaviy shirinlik",
    price: 18000,
    branchId: "b1",
    productCategoryId: "pc6",
    status: "ACTIVE",
  },
];

export const rooms: Room[] = Array.from({ length: 20 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `${i + 1}-xona`,
  branchId: "b1",
}));

export const orders: Order[] = [
  {
    id: "o1",
    userId: "u4",
    roomId: "r1",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-13T10:30:00Z",
    endAt: "2026-02-13T11:15:00Z",
  },
  {
    id: "o2",
    userId: "u4",
    roomId: "r3",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-13T11:00:00Z",
    endAt: "2026-02-13T12:00:00Z",
  },
  {
    id: "o3",
    userId: "u5",
    roomId: "r5",
    branchId: "b1",
    status: "PENDING",
    createdAt: "2026-02-13T12:30:00Z",
    endAt: "2026-02-13T13:30:00Z",
  },
  {
    id: "o4",
    userId: "u5",
    roomId: "r2",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-12T14:00:00Z",
    endAt: "2026-02-12T15:00:00Z",
  },
  {
    id: "o5",
    userId: "u4",
    roomId: "r7",
    branchId: "b1",
    status: "CANCELED",
    createdAt: "2026-02-12T16:00:00Z",
    endAt: "2026-02-12T16:30:00Z",
  },
  {
    id: "o6",
    userId: "u5",
    roomId: "r10",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-11T12:00:00Z",
    endAt: "2026-02-11T13:00:00Z",
  },
  {
    id: "o7",
    userId: "u4",
    roomId: "r4",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-11T18:00:00Z",
    endAt: "2026-02-11T19:30:00Z",
  },
  {
    id: "o8",
    userId: "u5",
    roomId: "r8",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-10T11:00:00Z",
    endAt: "2026-02-10T12:30:00Z",
  },
  {
    id: "o9",
    userId: "u4",
    roomId: "r12",
    branchId: "b1",
    status: "PENDING",
    createdAt: "2026-02-13T13:00:00Z",
    endAt: "2026-02-13T14:00:00Z",
  },
  {
    id: "o10",
    userId: "u5",
    roomId: "r15",
    branchId: "b1",
    status: "SUCCESS",
    createdAt: "2026-02-09T19:00:00Z",
    endAt: "2026-02-09T20:30:00Z",
  },
];

export const orderItems: OrderItem[] = [
  { id: "oi1", orderId: "o1", productId: "p4", branchId: "b1", count: 2 },
  { id: "oi2", orderId: "o1", productId: "p2", branchId: "b1", count: 1 },
  { id: "oi3", orderId: "o1", productId: "p11", branchId: "b1", count: 1 },
  { id: "oi4", orderId: "o2", productId: "p7", branchId: "b1", count: 3 },
  { id: "oi5", orderId: "o2", productId: "p8", branchId: "b1", count: 2 },
  { id: "oi6", orderId: "o3", productId: "p5", branchId: "b1", count: 4 },
  { id: "oi7", orderId: "o3", productId: "p10", branchId: "b1", count: 4 },
  { id: "oi8", orderId: "o4", productId: "p4", branchId: "b1", count: 1 },
  { id: "oi9", orderId: "o4", productId: "p13", branchId: "b1", count: 2 },
  { id: "oi10", orderId: "o5", productId: "p3", branchId: "b1", count: 2 },
  { id: "oi11", orderId: "o6", productId: "p4", branchId: "b1", count: 3 },
  { id: "oi12", orderId: "o6", productId: "p14", branchId: "b1", count: 5 },
  { id: "oi13", orderId: "o7", productId: "p7", branchId: "b1", count: 2 },
  { id: "oi14", orderId: "o8", productId: "p1", branchId: "b1", count: 1 },
  { id: "oi15", orderId: "o8", productId: "p9", branchId: "b1", count: 1 },
  { id: "oi16", orderId: "o9", productId: "p6", branchId: "b1", count: 3 },
  { id: "oi17", orderId: "o10", productId: "p4", branchId: "b1", count: 2 },
  { id: "oi18", orderId: "o10", productId: "p12", branchId: "b1", count: 2 },
];

// Helper to calculate order total
export function getOrderTotal(orderId: string): number {
  return orderItems
    .filter((oi) => oi.orderId === orderId)
    .reduce((sum, oi) => {
      const product = products.find((p) => p.id === oi.productId);
      return sum + (product?.price ?? 0) * oi.count;
    }, 0);
}

// Generate revenue data for charts
export function generateRevenueData(
  days: number
): { date: string; revenue: number; expense: number }[] {
  const data: { date: string; revenue: number; expense: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const revenue = Math.floor(2000000 + Math.random() * 5000000);
    const expense = Math.floor(800000 + Math.random() * 2000000);
    data.push({
      date: d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }),
      revenue,
      expense,
    });
  }
  return data;
}

export function formatPrice(price: number): string {
  return price.toLocaleString("uz-UZ") + " so'm";
}

// ✅ SUPER_AFITSANT label qo'shildi
export const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  MANAGER: "Menejer",
  AFITSANT: "Afitsant",
  SUPER_AFITSANT: "Super Afitsant", // ← QO'SHILDI
  CHEF: "Oshpaz",
  KASSA: "Kassir",
};

export const statusLabels: Record<string, string> = {
  ACTIVE: "Faol",
  INACTIVE: "Arxiv",
  PENDING: "Kutilmoqda",
  SUCCESS: "Yakunlangan",
  CANCELED: "Bekor qilingan",
};
