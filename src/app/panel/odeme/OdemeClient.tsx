"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, X, Trash2, Edit2, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Wallet, FileText, CreditCard,
  Building2, ChevronDown, ChevronUp, RotateCcw, Clock,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { differenceInDays, isToday, isPast, format } from "date-fns";
import { tr } from "date-fns/locale";

// ============ SABITLER ============
const CONTACT_TYPES = { musteri: "Müşteri", tedarikci: "Tedarikçi", her_ikisi: "Müşteri & Tedarikçi" };
const TXN_TYPES = {
  fatura_kesilen: { label: "Fatura Kesildi", dir: "alacak", icon: "📄" },
  odeme_alindi: { label: "Ödeme Alındı", dir: "alacak", icon: "💚" },
  borc_girisi: { label: "Borç Girişi", dir: "borc", icon: "📋" },
  odeme_yapildi: { label: "Ödeme Yapıldı", dir: "borc", icon: "💸" },
  veresiye: { label: "Veresiye", dir: "borc", icon: "📝" },
  iade: { label: "İade", dir: "alacak", icon: "↩️" },
};
const TXN_CATEGORIES = ["mazot", "sanayi", "vergi", "servis", "kira", "fatura", "diger"];
const STATUS_COLORS: Record<string, string> = {
  bekliyor: "bg-amber-100 text-amber-700",
  odendi: "bg-green-100 text-green-700",
  kismi: "bg-blue-100 text-blue-700",
  gecikti: "bg-red-100 text-red-700",
  iptal: "bg-slate-100 text-slate-400",
};
const STATUS_LABELS: Record<string, string> = {
  bekliyor: "Bekliyor", odendi: "Ödendi", kismi: "Kısmi", gecikti: "Gecikti", iptal: "İptal",
};

// ============ TİPLER ============
type Txn = {
  id: string; contactId: string; type: string; direction: string;
  amount: number; paidAmount: number; date: Date; dueDate: Date | null;
  status: string; description: string | null; invoiceNo: string | null;
  category: string | null;
  contact: { id: string; name: string; type: string };
};
type Check = {
  id: string; contactId: string | null; direction: string; amount: number;
  dueDate: Date; bankName: string | null; checkNo: string | null; status: string; notes: string | null;
  contact: { id: string; name: string } | null;
};
type ContactBalance = {
  id: string; name: string; type: string; phone: string | null;
  totalReceivable: number; totalPayable: number; overdueReceivable: number; netBalance: number;
  transactions: Txn[]; checks: Check[];
};

interface Props {
  contacts: ContactBalance[];
  transactions: Txn[];
  checks: Check[];
  summary: {
    totalReceivable: number; totalPayable: number; overdueTotal: number;
    pendingChecksIn: number; pendingChecksOut: number;
    urgentChecks: Check[];
  };
}

export default function OdemeClient({ contacts, transactions, checks, summary }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"ozet" | "alacaklar" | "borclar" | "cariler" | "cekler">("ozet");
  const [loading, setLoading] = useState(false);

  // Modaller
  const [contactModal, setContactModal] = useState(false);
  const [txnModal, setTxnModal] = useState(false);
  const [checkModal, setCheckModal] = useState(false);
  const [payModal, setPayModal] = useState<Txn | null>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  // Formlar
  const [contactForm, setContactForm] = useState({ name: "", type: "musteri", phone: "", taxNo: "", notes: "" });
  const [txnForm, setTxnForm] = useState({
    contactId: "", type: "fatura_kesilen", date: format(new Date(), "yyyy-MM-dd"),
    dueDate: "", amount: "", invoiceNo: "", description: "", category: "fatura",
  });
  const [checkForm, setCheckForm] = useState({
    contactId: "", direction: "aldik", amount: "", dueDate: "", bankName: "", checkNo: "", notes: "",
  });
  const [payAmount, setPayAmount] = useState("");

  function sc(s: string, v: string) { setContactForm((p) => ({ ...p, [s]: v })); }
  function st(s: string, v: string) { setTxnForm((p) => ({ ...p, [s]: v })); }
  function sk(s: string, v: string) { setCheckForm((p) => ({ ...p, [s]: v })); }

  // Txn tipi → direction otomatik
  const txnDir = TXN_TYPES[txnForm.type as keyof typeof TXN_TYPES]?.dir ?? "alacak";

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.name.trim()) { toast.error("Ad zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error();
      toast.success("Cari eklendi!");
      setContactModal(false);
      router.refresh();
    } catch { toast.error("Hata"); } finally { setLoading(false); }
  }

  async function saveTxn(e: React.FormEvent) {
    e.preventDefault();
    if (!txnForm.contactId || !txnForm.amount) { toast.error("Cari ve tutar zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...txnForm, direction: txnDir }),
      });
      if (!res.ok) throw new Error();
      toast.success("Kaydedildi!");
      setTxnModal(false);
      router.refresh();
    } catch { toast.error("Hata"); } finally { setLoading(false); }
  }

  async function saveCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!checkForm.amount || !checkForm.dueDate) { toast.error("Tutar ve vade zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkForm),
      });
      if (!res.ok) throw new Error();
      toast.success("Çek eklendi!");
      setCheckModal(false);
      router.refresh();
    } catch { toast.error("Hata"); } finally { setLoading(false); }
  }

  async function markPaid(txn: Txn) {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Geçerli tutar gir"); return; }
    const remaining = txn.amount - txn.paidAmount;
    const newPaid = txn.paidAmount + amount;
    const newStatus = newPaid >= txn.amount ? "odendi" : "kismi";
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: newPaid, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(newStatus === "odendi" ? "✅ Tamamen ödendi!" : `Kısmi ödeme: ${formatCurrency(amount)}`);
      setPayModal(null);
      setPayAmount("");
      router.refresh();
    } catch { toast.error("Hata"); } finally { setLoading(false); }
  }

  async function updateCheckStatus(id: string, status: string) {
    try {
      await fetch(`/api/checks/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success(status === "tahsil_edildi" ? "✅ Tahsil edildi!" : "Güncellendi");
      router.refresh();
    } catch { toast.error("Hata"); }
  }

  async function deleteTxn(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  async function deleteCheck(id: string) {
    if (!confirm("Çek silinsin mi?")) return;
    try {
      await fetch(`/api/checks/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  // Alacak listesi (bekleyen, sıralı: gecikmiş önce)
  const receivables = useMemo(() =>
    transactions
      .filter((t) => t.direction === "alacak" && t.status !== "odendi" && t.status !== "iptal")
      .sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 9e12;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 9e12;
        return da - db;
      }),
  [transactions]);

  const payables = useMemo(() =>
    transactions
      .filter((t) => t.direction === "borc" && t.status !== "odendi" && t.status !== "iptal")
      .sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 9e12;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 9e12;
        return da - db;
      }),
  [transactions]);

  const pendingChecks = checks.filter((c) => c.status === "bekliyor");

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Ödemeler / Cari</h1>
          <p className="text-slate-500 text-sm mt-1">Alacak, borç, çek ve cari yönetimi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setContactModal(true)} className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:border-slate-300 px-3 py-2 rounded-xl text-sm font-medium transition-all">
            <Building2 className="w-4 h-4" /> Cari Ekle
          </button>
          <button onClick={() => setCheckModal(true)} className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:border-slate-300 px-3 py-2 rounded-xl text-sm font-medium transition-all">
            <CreditCard className="w-4 h-4" /> Çek Ekle
          </button>
          <button onClick={() => setTxnModal(true)} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Hareket Ekle
          </button>
        </div>
      </div>

      {/* Acil çek uyarısı */}
      {summary.urgentChecks.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-800">⚠️ Bu Hafta Vadesi Gelen Çekler ({summary.urgentChecks.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {summary.urgentChecks.map((c) => {
              const days = differenceInDays(new Date(c.dueDate), new Date());
              return (
                <div key={c.id} className="bg-white border border-red-200 rounded-xl px-4 py-2 text-sm">
                  <div className="font-bold text-red-700">{formatCurrency(c.amount)}</div>
                  <div className="text-slate-600">{c.contact?.name ?? "Belirtilmedi"}</div>
                  <div className={`text-xs font-semibold ${days === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {c.direction === "aldik" ? "Tahsil edilecek" : "Ödenecek"} · {days === 0 ? "Bugün!" : `${days} gün`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ÖZET KARTLARI ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp} label="Toplam Alacak" value={summary.totalReceivable} color="green"
          sub={summary.overdueTotal > 0 ? `${formatCurrency(summary.overdueTotal)} gecikmiş` : undefined} />
        <SummaryCard icon={TrendingDown} label="Toplam Borç" value={summary.totalPayable} color="red" />
        <SummaryCard icon={CreditCard} label="Çek (Alacak)" value={summary.pendingChecksIn} color="blue"
          sub="Tahsil edilecek" />
        <SummaryCard icon={CreditCard} label="Çek (Borç)" value={summary.pendingChecksOut} color="amber"
          sub="Ödenecek" />
      </div>

      {/* ===== SEKMELER ===== */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {(["ozet", "alacaklar", "borclar", "cariler", "cekler"] as const).map((t) => {
          const labels = { ozet: "Genel Bakış", alacaklar: `Alacaklar (${receivables.length})`, borclar: `Borçlar (${payables.length})`, cariler: `Cariler (${contacts.length})`, cekler: `Çekler (${pendingChecks.length})` };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${tab === t ? "border-[#DC2626] text-[#DC2626]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ===== GENEL BAKIŞ ===== */}
      {tab === "ozet" && (
        <div className="space-y-4">
          <h2 className="font-bold text-slate-700">Firma Bazlı Durum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.filter((c) => c.netBalance !== 0 || c.totalPayable !== 0).map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{CONTACT_TYPES[c.type as keyof typeof CONTACT_TYPES] ?? c.type}</div>
                  </div>
                  <div className="text-right">
                    {c.totalReceivable > 0 && (
                      <div className="text-green-600 font-bold text-sm">+{formatCurrency(c.totalReceivable)}</div>
                    )}
                    {c.totalPayable > 0 && (
                      <div className="text-red-500 font-bold text-sm">-{formatCurrency(c.totalPayable)}</div>
                    )}
                  </div>
                </div>
                {c.overdueReceivable > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">
                    ⚠️ {formatCurrency(c.overdueReceivable)} gecikmiş alacak
                  </div>
                )}
              </div>
            ))}
            {contacts.filter((c) => c.netBalance !== 0 || c.totalPayable !== 0).length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-400">
                Henüz cari hareketi yok. &quot;Hareket Ekle&quot; ile başlayın.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ALACAKLAR ===== */}
      {tab === "alacaklar" && (
        <TxnTable
          txns={receivables}
          direction="alacak"
          onPay={(t) => { setPayModal(t); setPayAmount((t.amount - t.paidAmount).toFixed(2)); }}
          onDelete={deleteTxn}
        />
      )}

      {/* ===== BORÇLAR ===== */}
      {tab === "borclar" && (
        <TxnTable
          txns={payables}
          direction="borc"
          onPay={(t) => { setPayModal(t); setPayAmount((t.amount - t.paidAmount).toFixed(2)); }}
          onDelete={deleteTxn}
        />
      )}

      {/* ===== CARİLER ===== */}
      {tab === "cariler" && (
        <div className="space-y-3">
          {contacts.map((c) => {
            const isExpanded = expandedContact === c.id;
            const recentTxns = c.transactions.slice(0, 5) as unknown as Txn[];
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedContact(isExpanded ? null : c.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[#1B2437] rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{CONTACT_TYPES[c.type as keyof typeof CONTACT_TYPES] ?? c.type}
                      {c.phone && ` · ${c.phone}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.totalReceivable > 0 && <div className="text-sm font-bold text-green-600">+{formatCurrency(c.totalReceivable)}</div>}
                    {c.totalPayable > 0 && <div className="text-sm font-bold text-red-500">-{formatCurrency(c.totalPayable)}</div>}
                    {c.totalReceivable === 0 && c.totalPayable === 0 && <div className="text-sm text-slate-300">Bakiye yok</div>}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 pb-5">
                    <div className="flex items-center justify-between mt-4 mb-3">
                      <h3 className="text-sm font-semibold text-slate-600">Son Hareketler</h3>
                      <button onClick={() => { setTxnModal(true); st("contactId", c.id); }} className="text-xs text-[#DC2626] hover:underline">+ Hareket Ekle</button>
                    </div>
                    {c.transactions.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2">Hareket yok</p>
                    ) : (
                      <div className="space-y-2">
                        {(c.transactions as unknown as Txn[]).map((t) => (
                          <div key={t.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-50 last:border-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[t.status] ?? "bg-slate-100"}`}>{STATUS_LABELS[t.status] ?? t.status}</span>
                            <span className="flex-1 text-slate-600 truncate">{t.description || TXN_TYPES[t.type as keyof typeof TXN_TYPES]?.label || t.type}</span>
                            <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(t.date)}</span>
                            <span className={`font-bold flex-shrink-0 ${t.direction === "alacak" ? "text-green-600" : "text-red-500"}`}>
                              {t.direction === "alacak" ? "+" : "-"}{formatCurrency(t.amount)}
                            </span>
                            <button onClick={() => { setPayModal(t); setPayAmount((t.amount - t.paidAmount).toFixed(2)); }} className="p-1 text-blue-400 hover:bg-blue-50 rounded flex-shrink-0" title="Ödeme al/yap">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteTxn(t.id)} className="p-1 text-red-300 hover:bg-red-50 rounded flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {contacts.length === 0 && (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
              <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500 mb-4">Henüz cari eklenmedi</h3>
              <button onClick={() => setContactModal(true)} className="inline-flex items-center gap-2 bg-[#DC2626] text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                <Plus className="w-4 h-4" /> Cari Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== ÇEKLER ===== */}
      {tab === "cekler" && (
        <div className="space-y-4">
          {/* Bekleyen çekler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alacak çekler */}
            <div>
              <h3 className="text-sm font-bold text-green-700 mb-3">
                💚 Tahsil Edilecek Çekler ({checks.filter(c => c.direction === "aldik").length})
              </h3>
              <div className="space-y-2">
                {checks.filter(c => c.direction === "aldik").map(c => <CheckCard key={c.id} check={c} onUpdate={updateCheckStatus} onDelete={deleteCheck} />)}
                {checks.filter(c => c.direction === "aldik").length === 0 && <p className="text-sm text-slate-400 py-2">Çek yok</p>}
              </div>
            </div>
            {/* Borç çekler */}
            <div>
              <h3 className="text-sm font-bold text-red-600 mb-3">
                💸 Ödenecek Çekler ({checks.filter(c => c.direction === "verdik").length})
              </h3>
              <div className="space-y-2">
                {checks.filter(c => c.direction === "verdik").map(c => <CheckCard key={c.id} check={c} onUpdate={updateCheckStatus} onDelete={deleteCheck} />)}
                {checks.filter(c => c.direction === "verdik").length === 0 && <p className="text-sm text-slate-400 py-2">Çek yok</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALLER ===== */}

      {/* Cari Ekle */}
      {contactModal && (
        <Modal title="Yeni Cari" onClose={() => setContactModal(false)}>
          <form onSubmit={saveContact} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label>Firma / Kişi Adı *</label><input type="text" value={contactForm.name} onChange={(e) => sc("name", e.target.value)} placeholder="Örn: ABC Tekstil A.Ş." required /></div>
              <div><label>Tip</label>
                <select value={contactForm.type} onChange={(e) => sc("type", e.target.value)}>
                  {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label>Telefon</label><input type="tel" value={contactForm.phone} onChange={(e) => sc("phone", e.target.value)} /></div>
              <div><label>Vergi No</label><input type="text" value={contactForm.taxNo} onChange={(e) => sc("taxNo", e.target.value)} /></div>
            </div>
            <div><label>Notlar</label><textarea value={contactForm.notes} onChange={(e) => sc("notes", e.target.value)} rows={2} className="resize-none" /></div>
            <ModalActions onClose={() => setContactModal(false)} loading={loading} label="Cari Ekle" />
          </form>
        </Modal>
      )}

      {/* Hareket Ekle */}
      {txnModal && (
        <Modal title="Yeni Hareket" onClose={() => setTxnModal(false)}>
          <form onSubmit={saveTxn} className="space-y-4">
            <div>
              <label>Cari *</label>
              <select value={txnForm.contactId} onChange={(e) => st("contactId", e.target.value)} required>
                <option value="">Seçin...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>İşlem Tipi</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(TXN_TYPES).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => st("type", k)}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${txnForm.type === k ? (v.dir === "alacak" ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500") : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <div className={`mt-2 text-xs font-semibold ${txnDir === "alacak" ? "text-green-600" : "text-red-600"}`}>
                {txnDir === "alacak" ? "✅ Alacak (bize borçlu)" : "❌ Borç (bize borç)"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label>Tutar (₺) *</label><input type="number" step="0.01" value={txnForm.amount} onChange={(e) => st("amount", e.target.value)} placeholder="0.00" required /></div>
              <div><label>Vade Tarihi</label><input type="date" value={txnForm.dueDate} onChange={(e) => st("dueDate", e.target.value)} /></div>
              <div><label>Tarih</label><input type="date" value={txnForm.date} onChange={(e) => st("date", e.target.value)} /></div>
              <div><label>Fatura No</label><input type="text" value={txnForm.invoiceNo} onChange={(e) => st("invoiceNo", e.target.value)} placeholder="FT-2026-001" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Kategori</label>
                <select value={txnForm.category} onChange={(e) => st("category", e.target.value)}>
                  {TXN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label>Açıklama</label><input type="text" value={txnForm.description} onChange={(e) => st("description", e.target.value)} placeholder="Detay..." /></div>
            </div>
            <ModalActions onClose={() => setTxnModal(false)} loading={loading} label="Kaydet" />
          </form>
        </Modal>
      )}

      {/* Çek Ekle */}
      {checkModal && (
        <Modal title="Yeni Çek" onClose={() => setCheckModal(false)}>
          <form onSubmit={saveCheck} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => sk("direction", "aldik")} className={`py-3 rounded-xl border text-sm font-semibold ${checkForm.direction === "aldik" ? "bg-green-500 text-white border-green-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                💚 Aldık (Tahsil)
              </button>
              <button type="button" onClick={() => sk("direction", "verdik")} className={`py-3 rounded-xl border text-sm font-semibold ${checkForm.direction === "verdik" ? "bg-red-500 text-white border-red-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                💸 Verdik (Ödeme)
              </button>
            </div>
            <div>
              <label>Cari (opsiyonel)</label>
              <select value={checkForm.contactId} onChange={(e) => sk("contactId", e.target.value)}>
                <option value="">Seçin...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label>Tutar (₺) *</label><input type="number" step="0.01" value={checkForm.amount} onChange={(e) => sk("amount", e.target.value)} required /></div>
              <div><label>Vade Tarihi *</label><input type="date" value={checkForm.dueDate} onChange={(e) => sk("dueDate", e.target.value)} required /></div>
              <div><label>Banka</label><input type="text" value={checkForm.bankName} onChange={(e) => sk("bankName", e.target.value)} placeholder="Ziraat, Yapı Kredi..." /></div>
              <div><label>Çek No</label><input type="text" value={checkForm.checkNo} onChange={(e) => sk("checkNo", e.target.value)} /></div>
            </div>
            <div><label>Not</label><input type="text" value={checkForm.notes} onChange={(e) => sk("notes", e.target.value)} /></div>
            <ModalActions onClose={() => setCheckModal(false)} loading={loading} label="Çek Ekle" />
          </form>
        </Modal>
      )}

      {/* Ödeme Al/Yap */}
      {payModal && (
        <Modal title={payModal.direction === "alacak" ? "Ödeme Al" : "Ödeme Yap"} onClose={() => setPayModal(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Cari</span><span className="font-semibold">{payModal.contact.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Toplam</span><span className="font-bold">{formatCurrency(payModal.amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Ödenen</span><span className="text-green-600">{formatCurrency(payModal.paidAmount)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-semibold">Kalan</span><span className="font-black text-[#DC2626]">{formatCurrency(payModal.amount - payModal.paidAmount)}</span></div>
            </div>
            <div>
              <label>{payModal.direction === "alacak" ? "Alınan Tutar (₺)" : "Ödenen Tutar (₺)"}</label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="text-xl font-bold" autoFocus />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[payModal.amount - payModal.paidAmount].map((v) => (
                <button key={v} type="button" onClick={() => setPayAmount(v.toFixed(2))} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200">
                  Tamamını öde ({formatCurrency(v)})
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setPayModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
              <button onClick={() => markPaid(payModal)} disabled={loading} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                {loading ? "..." : payModal.direction === "alacak" ? "✅ Tahsil Et" : "💸 Öde"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ YARDIMCI BİLEŞENLER ============

function TxnTable({ txns, direction, onPay, onDelete }: {
  txns: Txn[]; direction: string; onPay: (t: Txn) => void; onDelete: (id: string) => void;
}) {
  if (txns.length === 0) return (
    <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
      <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
      <p className="text-slate-400">{direction === "alacak" ? "Bekleyen alacak yok" : "Bekleyen borç yok"}</p>
    </div>
  );

  const total = txns.reduce((s, t) => s + t.amount - t.paidAmount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-600">{txns.length} kayıt</span>
        <span className={`font-black text-lg ${direction === "alacak" ? "text-green-600" : "text-red-500"}`}>{formatCurrency(total)}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {txns.map((t) => {
          const remaining = t.amount - t.paidAmount;
          const daysLeft = t.dueDate ? differenceInDays(new Date(t.dueDate), new Date()) : null;
          const isOverdue = daysLeft !== null && daysLeft < 0;
          return (
            <div key={t.id} className={`flex items-center gap-4 px-5 py-4 ${isOverdue ? "bg-red-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">{t.contact.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] ?? "bg-slate-100"}`}>{STATUS_LABELS[t.status] ?? t.status}</span>
                  {t.invoiceNo && <span className="text-xs text-slate-400">{t.invoiceNo}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.description || TXN_TYPES[t.type as keyof typeof TXN_TYPES]?.label || t.type}
                  {t.dueDate && (
                    <span className={`ml-2 font-semibold ${isOverdue ? "text-red-600" : daysLeft !== null && daysLeft <= 7 ? "text-amber-600" : "text-slate-400"}`}>
                      Vade: {formatDate(t.dueDate)} {isOverdue ? `(${Math.abs(daysLeft!)}g gecikmiş)` : daysLeft !== null && daysLeft <= 7 ? `(${daysLeft}g kaldı)` : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-black text-sm ${direction === "alacak" ? "text-green-600" : "text-red-500"}`}>{formatCurrency(remaining)}</div>
                {t.paidAmount > 0 && <div className="text-xs text-slate-400">{formatCurrency(t.amount)} toplam</div>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onPay(t)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Ödeme kaydet">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(t.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckCard({ check, onUpdate, onDelete }: {
  check: Check; onUpdate: (id: string, s: string) => void; onDelete: (id: string) => void;
}) {
  const daysLeft = differenceInDays(new Date(check.dueDate), new Date());
  const isUrgent = daysLeft <= 7 && daysLeft >= 0;
  const isPastDue = daysLeft < 0;
  const statusColors: Record<string, string> = {
    bekliyor: "bg-amber-100 text-amber-700",
    tahsil_edildi: "bg-green-100 text-green-700",
    iade_edildi: "bg-slate-100 text-slate-500",
    karsilıksız: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    bekliyor: "Bekliyor", tahsil_edildi: "Tahsil Edildi", iade_edildi: "İade", karsilıksız: "Karşılıksız",
  };

  return (
    <div className={`bg-white border rounded-xl p-4 ${isPastDue && check.status === "bekliyor" ? "border-red-200 bg-red-50" : isUrgent && check.status === "bekliyor" ? "border-amber-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-bold text-slate-800">{formatCurrency(check.amount)}</div>
          <div className="text-sm text-slate-500">{check.contact?.name ?? "Belirtilmedi"}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs ${isPastDue ? "text-red-600 font-bold" : isUrgent ? "text-amber-600 font-semibold" : "text-slate-400"}`}>
              <Clock className="w-3 h-3 inline mr-0.5" />
              {formatDate(check.dueDate)}
              {daysLeft === 0 ? " · Bugün!" : daysLeft < 0 ? ` · ${Math.abs(daysLeft)}g geçti` : ` · ${daysLeft}g kaldı`}
            </span>
            {check.bankName && <span className="text-xs text-slate-400">{check.bankName}</span>}
            {check.checkNo && <span className="text-xs text-slate-400">No: {check.checkNo}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[check.status] ?? "bg-slate-100"}`}>
            {statusLabels[check.status] ?? check.status}
          </span>
          {check.status === "bekliyor" && (
            <div className="flex gap-1">
              <button onClick={() => onUpdate(check.id, "tahsil_edildi")} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 font-medium">
                {check.direction === "aldik" ? "Tahsil" : "Ödendi"}
              </button>
              <button onClick={() => onUpdate(check.id, "karsilıksız")} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 font-medium">Karşılıksız</button>
            </div>
          )}
          <button onClick={() => onDelete(check.id)} className="p-1 text-slate-300 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: number;
  color: "green" | "red" | "blue" | "amber"; sub?: string;
}) {
  const colors = {
    green: "bg-green-50 text-green-600", red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600",
  };
  const textColors = { green: "text-green-600", red: "text-red-500", blue: "text-blue-600", amber: "text-amber-600" };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`text-xl font-black ${textColors[color]}`}>{formatCurrency(value)}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
      <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
        {loading ? "Kaydediliyor..." : label}
      </button>
    </div>
  );
}
