import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, isValid } from "date-fns";
import { tr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Belge durumu: gün farkına göre renk/durum döner
export type DocStatus = "expired" | "critical" | "warning" | "valid" | "missing";

export function getDocStatus(expiryDate: Date | null | undefined): DocStatus {
  if (!expiryDate) return "missing";
  if (!isValid(new Date(expiryDate))) return "missing";

  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "critical";
  if (daysLeft <= 30) return "warning";
  return "valid";
}

export function getDocStatusLabel(status: DocStatus): string {
  const labels: Record<DocStatus, string> = {
    expired: "Süresi Geçmiş",
    critical: "Kritik (7 gün)",
    warning: "Yaklaşıyor",
    valid: "Geçerli",
    missing: "Yüklenmedi",
  };
  return labels[status];
}

export function getDocStatusColor(status: DocStatus): string {
  const colors: Record<DocStatus, string> = {
    expired: "bg-red-100 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    valid: "bg-green-100 text-green-700 border-green-200",
    missing: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return colors[status];
}

export function getDocStatusDot(status: DocStatus): string {
  const dots: Record<DocStatus, string> = {
    expired: "bg-red-500",
    critical: "bg-red-500",
    warning: "bg-amber-500",
    valid: "bg-green-500",
    missing: "bg-gray-300",
  };
  return dots[status];
}

export function getDaysLeft(expiryDate: Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  return differenceInDays(new Date(expiryDate), today);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd.MM.yyyy", { locale: tr });
  } catch {
    return "-";
  }
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: tr });
  } catch {
    return "-";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Belge adları
export const DRIVER_DOCS = {
  license: "Ehliyet",
  src: "SRC Belgesi",
  psychotech: "Psikoteknik",
  criminalRecord: "Adli Sicil",
  healthReport: "Sağlık Raporu",
  residenceDoc: "İkametgah",
} as const;

export const VEHICLE_DOCS = {
  routePermit: "Güzergah İzin",
  inspection: "Muayene (6 ay)",
  insurance: "Trafik Sigortası",
  kasko: "Kasko",
  approval: "Uygunluk Belgesi",
  plateAuth: "J Plaka Tescil",
} as const;

// İş tipleri
export const JOB_TYPES = {
  okul: { label: "Okul Servisi", color: "bg-blue-100 text-blue-700" },
  personel: { label: "Personel Servisi", color: "bg-purple-100 text-purple-700" },
  ozel: { label: "Özel Sefer", color: "bg-amber-100 text-amber-700" },
  transfer: { label: "Transfer", color: "bg-teal-100 text-teal-700" },
  gezi: { label: "Gezi / Tur", color: "bg-pink-100 text-pink-700" },
} as const;

// Ödeme tipleri
export const PAYMENT_TYPES = {
  veresiye: "Veresiye",
  nakit: "Nakit",
  kart: "Kart",
} as const;

// Finans kategorileri
export const FINANCE_CATEGORIES = {
  income: {
    sozlesme: "Sözleşme Geliri",
    sefer: "Sefer Geliri",
    diger_gelir: "Diğer Gelir",
  },
  expense: {
    yakit: "Yakıt",
    maas: "Maaş",
    bakim: "Bakım / Tamir",
    sigorta: "Sigorta",
    harc: "Harç / Belge",
    vergi: "Vergi",
    diger_gider: "Diğer Gider",
  },
} as const;

// Tüm uyarıları olan belgeleri bul
export function getExpiringDocs(
  items: Array<{
    id: string;
    name: string;
    type: "driver" | "vehicle";
    docName: string;
    expiryDate: Date | null | undefined;
  }>
) {
  return items
    .map((item) => ({
      ...item,
      status: getDocStatus(item.expiryDate),
      daysLeft: getDaysLeft(item.expiryDate),
    }))
    .filter((item) => item.status !== "valid" && item.status !== "missing")
    .sort((a, b) => (a.daysLeft ?? -999) - (b.daysLeft ?? -999));
}
