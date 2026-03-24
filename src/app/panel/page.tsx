import { prisma } from "@/lib/prisma";
import {
  getDocStatus,
  formatDate,
  formatCurrency,
  getDaysLeft,
} from "@/lib/utils";
import {
  Users,
  Truck,
  Fuel,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, isPast, isToday } from "date-fns";
import { CheckSquare } from "lucide-react";

async function getDashboardData() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [drivers, vehicles, todayJobs, monthFuel, monthIncome, monthExpense, recentFuel, urgentTasks] =
    await Promise.all([
      prisma.driver.findMany({ where: { status: "active" } }),
      prisma.vehicle.findMany({ where: { status: "active" } }),
      prisma.job.findMany({
        where: {
          date: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999)),
          },
        },
        include: { driver: true, vehicle: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.fuelEntry.aggregate({
        _sum: { totalAmount: true, liters: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.financeEntry.aggregate({
        _sum: { amount: true },
        where: { type: "income", date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.financeEntry.aggregate({
        _sum: { amount: true },
        where: { type: "expense", date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.fuelEntry.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { vehicle: true, driver: true },
      }),
      // Acil + bugün vadesi gelen görevler
      prisma.task.findMany({
        where: {
          status: { in: ["pending", "in_progress"] },
          OR: [
            { priority: "urgent" },
            { priority: "high" },
            { dueDate: { lte: endOfDay(today) } },
          ],
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 5,
      }),
    ]);

  // Tüm belge son tarihleri topla
  const allDocs: Array<{
    id: string;
    name: string;
    type: "driver" | "vehicle";
    docType: string;
    docName: string;
    expiryDate: Date | null;
    href: string;
  }> = [];

  // Şöför belgeleri
  for (const d of drivers) {
    const driverDocs = [
      { key: "src", label: "SRC Belgesi", expiry: d.srcExpiry },
      { key: "psychotech", label: "Psikoteknik", expiry: d.psychotechExpiry },
      { key: "criminalRecord", label: "Adli Sicil", expiry: d.criminalRecordExpiry },
      { key: "healthReport", label: "Sağlık Raporu", expiry: d.healthReportExpiry },
      { key: "license", label: "Ehliyet", expiry: d.licenseExpiry },
    ];
    for (const doc of driverDocs) {
      allDocs.push({
        id: d.id,
        name: d.name,
        type: "driver",
        docType: doc.key,
        docName: doc.label,
        expiryDate: doc.expiry,
        href: `/panel/soforler/${d.id}`,
      });
    }
  }

  // Araç belgeleri
  for (const v of vehicles) {
    const vehicleDocs = [
      { key: "inspection", label: "Muayene (6 ay)", expiry: v.inspectionExpiry },
      { key: "insurance", label: "Trafik Sigortası", expiry: v.insuranceExpiry },
      { key: "routePermit", label: "Güzergah İzni", expiry: v.routePermitExpiry },
      { key: "approval", label: "Uygunluk Belgesi", expiry: v.approvalExpiry },
      { key: "kasko", label: "Kasko", expiry: v.kaskoExpiry },
    ];
    for (const doc of vehicleDocs) {
      vehicleDocs;
      allDocs.push({
        id: v.id,
        name: v.plate,
        type: "vehicle",
        docType: doc.key,
        docName: doc.label,
        expiryDate: doc.expiry,
        href: `/panel/araclar/${v.id}`,
      });
    }
  }

  // Uyarı gereken belgeleri filtrele
  const alertDocs = allDocs
    .filter((doc) => {
      const status = getDocStatus(doc.expiryDate);
      return status === "expired" || status === "critical" || status === "warning";
    })
    .sort((a, b) => {
      const da = getDaysLeft(a.expiryDate) ?? -9999;
      const db = getDaysLeft(b.expiryDate) ?? -9999;
      return da - db;
    })
    .slice(0, 10);

  const expiredCount = allDocs.filter(
    (d) => getDocStatus(d.expiryDate) === "expired"
  ).length;
  const criticalCount = allDocs.filter(
    (d) => getDocStatus(d.expiryDate) === "critical"
  ).length;
  const warningCount = allDocs.filter(
    (d) => getDocStatus(d.expiryDate) === "warning"
  ).length;

  return {
    driverCount: drivers.length,
    vehicleCount: vehicles.length,
    todayJobs,
    monthFuel: monthFuel._sum.totalAmount ?? 0,
    monthFuelLiters: monthFuel._sum.liters ?? 0,
    monthIncome: monthIncome._sum.amount ?? 0,
    monthExpense: (monthExpense._sum.amount ?? 0) + (monthFuel._sum.totalAmount ?? 0),
    recentFuel,
    urgentTasks,
    alertDocs,
    expiredCount,
    criticalCount,
    warningCount,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const now = new Date();

  const alertTotal = data.expiredCount + data.criticalCount + data.warningCount;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {now.toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/panel/isler"
          className="hidden sm:flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Calendar className="w-4 h-4" />
          İş Ekle
        </Link>
      </div>

      {/* ===== UYARI BANNER ===== */}
      {alertTotal > 0 && (
        <div
          className={`rounded-2xl p-5 border-2 ${
            data.expiredCount > 0
              ? "bg-red-50 border-red-200"
              : data.criticalCount > 0
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                data.expiredCount > 0 || data.criticalCount > 0
                  ? "text-red-600"
                  : "text-amber-600"
              }`}
            />
            <div>
              <p
                className={`font-bold ${
                  data.expiredCount > 0 || data.criticalCount > 0
                    ? "text-red-800"
                    : "text-amber-800"
                }`}
              >
                Belge Uyarısı: {alertTotal} belge dikkat gerektiriyor
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                {data.expiredCount > 0 && (
                  <span className="text-red-700 font-semibold">
                    🔴 {data.expiredCount} süresi geçmiş
                  </span>
                )}
                {data.criticalCount > 0 && (
                  <span className="text-red-600">
                    ⚠️ {data.criticalCount} kritik (7 gün)
                  </span>
                )}
                {data.warningCount > 0 && (
                  <span className="text-amber-600">
                    🟡 {data.warningCount} yaklaşıyor (30 gün)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STAT KARTLARI ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Aktif Şöför"
          value={data.driverCount.toString()}
          color="blue"
          href="/panel/soforler"
        />
        <StatCard
          icon={Truck}
          label="Aktif Araç"
          value={data.vehicleCount.toString()}
          color="purple"
          href="/panel/araclar"
        />
        <StatCard
          icon={Fuel}
          label="Bu Ay Yakıt"
          value={formatCurrency(data.monthFuel)}
          sub={`${data.monthFuelLiters.toFixed(0)} lt`}
          color="amber"
          href="/panel/yakit"
        />
        <StatCard
          icon={TrendingUp}
          label="Bu Ay Net"
          value={formatCurrency(data.monthIncome - data.monthExpense)}
          sub={`Gelir: ${formatCurrency(data.monthIncome)}`}
          color={data.monthIncome >= data.monthExpense ? "green" : "red"}
          href="/panel/finans"
        />
      </div>

      {/* ===== 2 KOLON: Belge Uyarıları + Bugünkü Seferler ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Belge Uyarıları */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Belge Uyarıları
            </h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {alertTotal} uyarı
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {data.alertDocs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="font-medium text-slate-600">Tüm belgeler geçerli</p>
                <p className="text-sm">Harika! Hiçbir belge uyarısı yok.</p>
              </div>
            ) : (
              data.alertDocs.map((doc, i) => {
                const status = getDocStatus(doc.expiryDate);
                const daysLeft = getDaysLeft(doc.expiryDate);
                return (
                  <Link
                    key={i}
                    href={doc.href}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        status === "expired" || status === "critical"
                          ? "bg-red-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm truncate">
                          {doc.name}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                          {doc.type === "driver" ? "Şöför" : "Araç"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{doc.docName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {daysLeft !== null && daysLeft < 0 ? (
                        <span className="text-xs font-bold text-red-600">
                          {Math.abs(daysLeft)} gün geçti
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-bold ${
                            (daysLeft ?? 99) <= 7 ? "text-red-600" : "text-amber-600"
                          }`}
                        >
                          {daysLeft} gün kaldı
                        </span>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(doc.expiryDate)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Bugünkü Seferler */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Bugünkü Seferler
            </h2>
            <Link
              href="/panel/isler"
              className="text-xs text-[#DC2626] hover:underline font-medium"
            >
              Tümünü gör
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {data.todayJobs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="font-medium text-slate-500">Bugün sefer yok</p>
                <Link
                  href="/panel/isler"
                  className="text-sm text-[#DC2626] hover:underline mt-1 inline-block"
                >
                  Sefer ekle
                </Link>
              </div>
            ) : (
              data.todayJobs.map((job) => {
                const statusColors: Record<string, string> = {
                  planned: "bg-blue-100 text-blue-700",
                  active: "bg-green-100 text-green-700",
                  completed: "bg-slate-100 text-slate-500",
                  cancelled: "bg-red-100 text-red-600",
                };
                const statusLabels: Record<string, string> = {
                  planned: "Planlandı",
                  active: "Aktif",
                  completed: "Tamamlandı",
                  cancelled: "İptal",
                };
                return (
                  <div
                    key={job.id}
                    className="px-6 py-3.5 flex items-center gap-4"
                  >
                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm font-bold text-slate-700">
                        {job.startTime}
                      </div>
                      {job.endTime && (
                        <div className="text-xs text-slate-400">{job.endTime}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">
                        {job.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {job.driver?.name ?? "Şöför atanmadı"} ·{" "}
                        {job.vehicle?.plate ?? "Araç atanmadı"}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        statusColors[job.status] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {statusLabels[job.status] ?? job.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===== SON YAKIT GİRİŞLERİ ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            Son Yakıt Girişleri
          </h2>
          <Link
            href="/panel/yakit"
            className="text-xs text-[#DC2626] hover:underline font-medium"
          >
            Tümünü gör
          </Link>
        </div>

        <div className="overflow-x-auto">
          {data.recentFuel.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">
              <Fuel className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p>Henüz yakıt girişi yok</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <th className="px-6 py-3 text-left font-semibold">Tarih</th>
                  <th className="px-6 py-3 text-left font-semibold">Araç</th>
                  <th className="px-6 py-3 text-left font-semibold">Şöför</th>
                  <th className="px-6 py-3 text-right font-semibold">Litre</th>
                  <th className="px-6 py-3 text-right font-semibold">Tutar</th>
                  <th className="px-6 py-3 text-center font-semibold">Ödeme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentFuel.map((entry) => (
                  <tr key={entry.id} className="table-row-hover">
                    <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-slate-800">
                        {entry.vehicle.plate}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {entry.driver?.name ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700">
                      {entry.liters.toFixed(2)} lt
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-slate-800">
                      {formatCurrency(entry.totalAmount)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          entry.paymentType === "veresiye"
                            ? "bg-amber-100 text-amber-700"
                            : entry.paymentType === "kart"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {entry.paymentType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== ACİL GÖREVLER ===== */}
      {data.urgentTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-500" />
              Bekleyen Görevler
            </h2>
            <Link href="/panel/gorevler" className="text-xs text-[#DC2626] hover:underline font-medium">
              Tümünü gör
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.urgentTasks.map((task) => {
              const catColors: Record<string, string> = {
                evrak: "bg-blue-100 text-blue-700",
                bakim: "bg-orange-100 text-orange-700",
                sigorta: "bg-purple-100 text-purple-700",
                vergi: "bg-red-100 text-red-700",
                arac: "bg-amber-100 text-amber-700",
                diger: "bg-slate-100 text-slate-500",
              };
              const priColors: Record<string, string> = {
                urgent: "text-red-600 font-bold",
                high: "text-amber-600 font-semibold",
                normal: "text-slate-400",
              };
              const daysLeft = task.dueDate
                ? Math.floor((new Date(task.dueDate).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <Link
                  key={task.id}
                  href="/panel/gorevler"
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === "urgent" ? "bg-red-500" : task.priority === "high" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{task.title}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${catColors[task.category] ?? "bg-slate-100 text-slate-500"}`}>
                      {task.category}
                    </span>
                  </div>
                  {task.dueDate && (
                    <div className={`text-xs flex-shrink-0 ${daysLeft !== null && daysLeft < 0 ? "text-red-600 font-bold" : daysLeft === 0 ? "text-red-500 font-bold" : "text-amber-600"}`}>
                      {daysLeft !== null && daysLeft < 0 ? `${Math.abs(daysLeft)}g geçti` : daysLeft === 0 ? "Bugün!" : `${daysLeft}g`}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card bileşeni
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "purple" | "amber" | "green" | "red";
  href: string;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", ring: "ring-green-100" },
    red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-100" },
  };

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${colors[color].bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors[color].icon}`} />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <div className="text-xl font-black text-slate-800 leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      <div className="text-xs text-slate-500 font-medium mt-1">{label}</div>
    </Link>
  );
}
