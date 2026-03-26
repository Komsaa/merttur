"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, X, CreditCard, Upload, Trash2, Edit2, ChevronDown, ChevronUp,
  AlertTriangle, Clock, Receipt, Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";

// ============ SABITLER ============
const EXPENSE_CATS = {
  yakit: { label: "Yakıt", icon: "⛽" },
  sanayi: { label: "Sanayi / Bakım", icon: "🔧" },
  market: { label: "Market", icon: "🛒" },
  kirtasiye: { label: "Kırtasiye", icon: "📄" },
  yemek: { label: "Yemek", icon: "🍽️" },
  fatura: { label: "Fatura / Abonelik", icon: "📋" },
  diger: { label: "Diğer", icon: "📌" },
};

const CARD_COLORS = [
  "#1B2437", "#DC2626", "#2563EB", "#059669", "#7C3AED", "#D97706", "#0891B2",
];

// ============ TİPLER ============
type Expense = {
  id: string; cardId: string; amount: number; date: Date | string;
  description: string; category: string; merchant: string | null;
  receiptPhoto: string | null; billingMonth: number; billingYear: number;
};
type Card = {
  id: string; name: string; bank: string | null; lastFour: string | null;
  limit: number | null; billingDay: number; paymentDaysAfterBilling: number;
  color: string; notes: string | null; expenses: Expense[];
};

interface Props {
  cards: Card[];
  currentMonth: number;
  currentYear: number;
}

// Hesap kesim + son ödeme tarihini hesapla
function getBillingDates(card: Card) {
  const today = new Date();
  const day = today.getDate();
  let billingMonth = today.getMonth() + 1;
  let billingYear = today.getFullYear();

  // Eğer kesim günü geçtiyse, bu ay; geçmediyse geçen ayın ekstresi şu an açık
  if (day < card.billingDay) {
    billingMonth = billingMonth === 1 ? 12 : billingMonth - 1;
    if (billingMonth === 12) billingYear--;
  }

  // Kesim tarihi
  const billingDate = new Date(billingYear, billingMonth - 1, card.billingDay);
  // Son ödeme tarihi = kesim + N gün
  const paymentDue = new Date(billingDate);
  paymentDue.setDate(paymentDue.getDate() + card.paymentDaysAfterBilling);

  // Bir sonraki dönem için
  const nextBillingMonth = billingMonth === 12 ? 1 : billingMonth + 1;
  const nextBillingYear = billingMonth === 12 ? billingYear + 1 : billingYear;

  const daysToPayment = differenceInDays(paymentDue, today);

  return { billingMonth, billingYear, billingDate, paymentDue, nextBillingMonth, nextBillingYear, daysToPayment };
}

const emptyCardForm = { name: "", bank: "", lastFour: "", limit: "", billingDay: "1", paymentDaysAfterBilling: "10", color: "#1B2437", notes: "" };
const emptyExpenseForm = { description: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), category: "diger", merchant: "" };

export default function KrediKartlariClient({ cards: initialCards, currentMonth, currentYear }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [cardModal, setCardModal] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [cardLoading, setCardLoading] = useState(false);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expenseModal, setExpenseModal] = useState<string | null>(null); // cardId
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [expLoading, setExpLoading] = useState(false);

  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadExpenseId, setPendingUploadExpenseId] = useState<string | null>(null);

  function sc(f: string, v: string) { setCardForm((p) => ({ ...p, [f]: v })); }
  function se(f: string, v: string) { setExpenseForm((p) => ({ ...p, [f]: v })); }

  function openAddCard() { setEditCard(null); setCardForm(emptyCardForm); setCardModal(true); }
  function openEditCard(c: Card) {
    setEditCard(c);
    setCardForm({
      name: c.name, bank: c.bank ?? "", lastFour: c.lastFour ?? "",
      limit: c.limit?.toString() ?? "", billingDay: c.billingDay.toString(),
      paymentDaysAfterBilling: c.paymentDaysAfterBilling.toString(),
      color: c.color, notes: c.notes ?? "",
    });
    setCardModal(true);
  }

  async function saveCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardForm.name.trim()) { toast.error("Kart adı zorunlu"); return; }
    setCardLoading(true);
    try {
      const url = editCard ? `/api/credit-cards/${editCard.id}` : "/api/credit-cards";
      const method = editCard ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cardForm) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editCard ? "Kart güncellendi" : "Kart eklendi!");
      setCardModal(false);
      router.refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Hata"); }
    finally { setCardLoading(false); }
  }

  async function deleteCard(id: string, name: string) {
    if (!confirm(`"${name}" kartı silinsin mi? Tüm harcamalar da silinir.`)) return;
    try {
      await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Kart silindi");
    } catch { toast.error("Silinemedi"); }
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseModal || !expenseForm.description || !expenseForm.amount) { toast.error("Açıklama ve tutar zorunlu"); return; }
    setExpLoading(true);
    try {
      const date = new Date(expenseForm.date);
      // Hangi ekstre dönemine ait?
      const card = cards.find((c) => c.id === expenseModal)!;
      const { billingMonth, billingYear } = getBillingDates(card);
      const res = await fetch("/api/credit-card-expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expenseForm, cardId: expenseModal, billingMonth, billingYear }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Harcama eklendi!");
      setExpenseModal(null);
      setExpenseForm(emptyExpenseForm);
      router.refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Hata"); }
    finally { setExpLoading(false); }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Bu harcama silinsin mi?")) return;
    try {
      await fetch(`/api/credit-card-expenses/${id}`, { method: "DELETE" });
      toast.success("Silindi");
      router.refresh();
    } catch { toast.error("Silinemedi"); }
  }

  async function uploadReceipt(expenseId: string, file: File) {
    setUploadingId(expenseId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "credit_card");
      fd.append("entityId", expenseId);
      fd.append("docType", "receipt");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Yükleme hatası");
      const { url } = await res.json();
      await fetch(`/api/credit-card-expenses/${expenseId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptPhoto: url }),
      });
      toast.success("Fiş yüklendi!");
      router.refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Hata"); }
    finally { setUploadingId(null); setPendingUploadExpenseId(null); }
  }

  // Hesap kesim/ödeme uyarıları
  const urgentCards = useMemo(() =>
    cards.map((c) => ({ card: c, billing: getBillingDates(c) }))
      .filter(({ billing }) => billing.daysToPayment >= 0 && billing.daysToPayment <= 7),
    [cards]
  );

  // Toplam harcama (seçili dönem)
  const periodTotal = useMemo(() =>
    cards.reduce((sum, c) =>
      sum + c.expenses
        .filter((e) => e.billingMonth === filterMonth && e.billingYear === filterYear)
        .reduce((s, e) => s + e.amount, 0), 0),
    [cards, filterMonth, filterYear]
  );

  const monthName = format(new Date(filterYear, filterMonth - 1, 1), "MMMM yyyy", { locale: tr });

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Kredi Kartları</h1>
          <p className="text-slate-500 text-sm mt-1">{cards.length} kart · {monthName} toplamı: <span className="font-bold text-slate-700">{formatCurrency(periodTotal)}</span></p>
        </div>
        <button onClick={openAddCard} className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Kart Ekle
        </button>
      </div>

      {/* Ödeme uyarıları */}
      {urgentCards.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-800">Yaklaşan Kart Ödemeleri ({urgentCards.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {urgentCards.map(({ card, billing }) => {
              const periodExpenses = card.expenses.filter((e) => e.billingMonth === billing.billingMonth && e.billingYear === billing.billingYear);
              const total = periodExpenses.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={card.id} className="bg-white border border-red-200 rounded-xl px-4 py-3 text-sm">
                  <div className="font-bold text-slate-800">{card.name}</div>
                  <div className="text-red-600 font-semibold text-lg">{formatCurrency(total)}</div>
                  <div className={`text-xs font-bold mt-1 ${billing.daysToPayment === 0 ? "text-red-600" : "text-amber-600"}`}>
                    Son ödeme: {billing.daysToPayment === 0 ? "Bugün!" : `${billing.daysToPayment} gün sonra`}
                    <span className="ml-1 text-slate-400 font-normal">({formatDate(billing.paymentDue)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dönem filtresi */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500 font-medium">Dönem:</span>
        <select value={`${filterYear}-${filterMonth}`} onChange={(e) => {
          const [y, m] = e.target.value.split("-");
          setFilterYear(parseInt(y)); setFilterMonth(parseInt(m));
        }} className="text-sm max-w-xs">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1; const y = d.getFullYear();
            return (
              <option key={i} value={`${y}-${m}`}>{format(d, "MMMM yyyy", { locale: tr })}</option>
            );
          })}
        </select>
      </div>

      {/* Kart listesi */}
      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-500 mb-2">Henüz kart eklenmedi</h3>
          <button onClick={openAddCard} className="inline-flex items-center gap-2 bg-[#DC2626] text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Kart Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const billing = getBillingDates(card);
            const periodExpenses = card.expenses.filter((e) => e.billingMonth === filterMonth && e.billingYear === filterYear);
            const periodTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
            const isExpanded = expandedCard === card.id;
            const isUrgent = billing.daysToPayment >= 0 && billing.daysToPayment <= 7;

            return (
              <div key={card.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isUrgent ? "border-red-200" : "border-slate-100"}`}>
                {/* Kart başlığı */}
                <div className="flex items-center gap-4 p-5">
                  {/* Kart görseli */}
                  <div className="w-14 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: card.color }}>
                    {card.lastFour ? `*${card.lastFour}` : <CreditCard className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800">{card.name}</div>
                    <div className="text-xs text-slate-400">
                      {card.bank && `${card.bank} · `}
                      Kesim: {card.billingDay}. gün · Ödeme: +{card.paymentDaysAfterBilling} gün
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-slate-800 text-lg">{formatCurrency(periodTotal)}</div>
                    <div className="text-xs text-slate-400">{periodExpenses.length} harcama</div>
                    {isUrgent && (
                      <div className="text-xs text-red-600 font-bold">
                        {billing.daysToPayment === 0 ? "⚠️ Bugün ödeme!" : `⚠️ ${billing.daysToPayment}g kaldı`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button onClick={() => { setExpenseModal(card.id); setExpenseForm(emptyExpenseForm); }} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded-lg transition-colors">
                      <Plus className="w-3 h-3" /> Harcama
                    </button>
                    <button onClick={() => openEditCard(card)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCard(card.id, card.name)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedCard(isExpanded ? null : card.id)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Harcamalar listesi */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Ekstre bilgisi */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                      <span><Clock className="w-3 h-3 inline mr-1" />Son ödeme: <span className="font-semibold text-slate-700">{formatDate(billing.paymentDue)}</span></span>
                      {card.limit && (
                        <span>Limit: <span className="font-semibold">{formatCurrency(card.limit)}</span> · Kalan: <span className={`font-semibold ${periodTotal > card.limit ? "text-red-600" : "text-green-600"}`}>{formatCurrency(card.limit - periodTotal)}</span></span>
                      )}
                    </div>

                    {periodExpenses.length === 0 ? (
                      <div className="px-5 py-8 text-center text-slate-400 text-sm">Bu dönemde harcama yok</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {periodExpenses.map((exp) => {
                          const cat = EXPENSE_CATS[exp.category as keyof typeof EXPENSE_CATS] ?? EXPENSE_CATS.diger;
                          return (
                            <div key={exp.id} className="flex items-center gap-4 px-5 py-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                                {cat.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-700">{exp.description}</div>
                                <div className="text-xs text-slate-400">
                                  {formatDate(new Date(exp.date))} · {cat.label}
                                  {exp.merchant && ` · ${exp.merchant}`}
                                </div>
                              </div>
                              <div className="font-bold text-slate-800 flex-shrink-0">{formatCurrency(exp.amount)}</div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {exp.receiptPhoto ? (
                                  <a href={exp.receiptPhoto} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline px-1">
                                    <Receipt className="w-3.5 h-3.5" /> Fiş
                                  </a>
                                ) : (
                                  <label className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg cursor-pointer">
                                    {uploadingId === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                    Fiş
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(exp.id, f); }} />
                                  </label>
                                )}
                                <button onClick={() => deleteExpense(exp.id)} className="p-1 text-slate-300 hover:text-red-500 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dönem toplam */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm text-slate-500">{monthName} toplamı</span>
                      <span className="font-black text-slate-800">{formatCurrency(periodTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== KART EKLEME/DÜZENLEME MODALI ===== */}
      {cardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCardModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editCard ? "Kartı Düzenle" : "Kart Ekle"}</h2>
              <button onClick={() => setCardModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveCard} className="p-6 space-y-4">
              <div>
                <label>Kart Adı *</label>
                <input type="text" value={cardForm.name} onChange={(e) => sc("name", e.target.value)} placeholder="Garanti İş Kartı" required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Banka</label>
                  <input type="text" value={cardForm.bank} onChange={(e) => sc("bank", e.target.value)} placeholder="Garanti, Akbank..." />
                </div>
                <div>
                  <label>Son 4 Hane</label>
                  <input type="text" value={cardForm.lastFour} onChange={(e) => sc("lastFour", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" maxLength={4} />
                </div>
              </div>
              <div>
                <label>Limit (₺)</label>
                <input type="number" step="0.01" value={cardForm.limit} onChange={(e) => sc("limit", e.target.value)} placeholder="50000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Hesap Kesim Günü</label>
                  <input type="number" min="1" max="28" value={cardForm.billingDay} onChange={(e) => sc("billingDay", e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Her ayın kaçında hesap kesilir?</p>
                </div>
                <div>
                  <label>Son Ödeme (+gün)</label>
                  <input type="number" min="1" max="30" value={cardForm.paymentDaysAfterBilling} onChange={(e) => sc("paymentDaysAfterBilling", e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Kesimden kaç gün sonra?</p>
                </div>
              </div>
              <div>
                <label>Kart Rengi</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {CARD_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => sc("color", c)}
                      className={`w-8 h-8 rounded-lg transition-all ${cardForm.color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCardModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={cardLoading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {cardLoading ? "Kaydediliyor..." : editCard ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== HARCAMA EKLEME MODALI ===== */}
      {expenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setExpenseModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Harcama Ekle</h2>
              <button onClick={() => setExpenseModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={addExpense} className="p-6 space-y-4">
              <div>
                <label>Açıklama *</label>
                <input type="text" value={expenseForm.description} onChange={(e) => se("description", e.target.value)} placeholder="Araç yedek parça, ofis malzemesi..." required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Tutar (₺) *</label>
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => se("amount", e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label>Tarih</label>
                  <input type="date" value={expenseForm.date} onChange={(e) => se("date", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Kategori</label>
                  <select value={expenseForm.category} onChange={(e) => se("category", e.target.value)}>
                    {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Nereden / Firma</label>
                  <input type="text" value={expenseForm.merchant} onChange={(e) => se("merchant", e.target.value)} placeholder="Opsiyonel" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setExpenseModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">İptal</button>
                <button type="submit" disabled={expLoading} className="flex-1 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
                  {expLoading ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
    </div>
  );
}
