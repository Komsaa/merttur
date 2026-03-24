import { Settings, Bot, Database, Users, Phone } from "lucide-react";

export default function AyarlarPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Ayarlar</h1>
        <p className="text-slate-500 text-sm mt-1">Sistem ayarları ve entegrasyonlar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firma Bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#DC2626]" />
            Firma Bilgileri
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Firma Adı</span>
              <span className="font-semibold">Mert Tur</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Telefon</span>
              <span className="font-semibold">0506 122 73 63</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Konum</span>
              <span className="font-semibold">Gölmarmara / Manisa</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Website</span>
              <span className="font-semibold">merttur.com</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Bot */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-500" />
            WhatsApp Bot
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm">
              <div className="text-slate-500 text-xs mb-2 font-sans font-semibold">Bot başlatma komutu:</div>
              <code className="text-slate-700">npm run bot</code>
            </div>
            <div className="text-sm text-slate-600 space-y-2">
              <p><span className="font-semibold">1.</span> Fazlalık telefona WhatsApp kur</p>
              <p><span className="font-semibold">2.</span> VPS'te <code className="bg-slate-100 px-1 rounded text-xs">npm run bot</code> çalıştır</p>
              <p><span className="font-semibold">3.</span> Terminaldeki QR kodu tara</p>
              <p><span className="font-semibold">4.</span> Bot grubu dinlemeye başlar</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <strong>Grup adı</strong> .env dosyasındaki <code>WHATSAPP_GROUP_NAME</code> ile eşleşmeli.
            </div>
          </div>
        </div>

        {/* Kullanıcılar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Panel Kullanıcıları
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            3 admin hesabı: sen, baban ve abin. Şifreler .env dosyasından ayarlanır.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs space-y-1">
            <div className="text-slate-400">ADMIN_EMAIL_1=sen@merttur.com</div>
            <div className="text-slate-400">ADMIN_PASSWORD_1=sifreni-buraya-yaz</div>
            <div className="text-slate-300">...</div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Şifre değişikliği için:{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">npm run db:seed</code>
          </div>
        </div>

        {/* Veritabanı */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            Veritabanı
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs space-y-1">
              <div className="text-slate-400"># Şema güncelleme:</div>
              <div className="text-slate-700">npm run db:push</div>
              <div className="text-slate-400 mt-2"># Görsel yönetim:</div>
              <div className="text-slate-700">npm run db:studio</div>
              <div className="text-slate-400 mt-2"># İlk veri:</div>
              <div className="text-slate-700">npm run db:seed</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              Coolify'da PostgreSQL servisi eklediğinde bağlantı stringini <strong>DATABASE_URL</strong> olarak ayarla.
            </div>
          </div>
        </div>
      </div>

      {/* Belge Süreleri Hatırlatıcısı */}
      <div className="bg-[#1B2437] rounded-2xl p-6 text-white">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#DC2626]" />
          Belge Yenileme Takvimi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {[
            { label: "SRC-2 Belgesi", period: "5 yılda bir", type: "Şöför" },
            { label: "Psikoteknik", period: "5 yılda bir (2 yıl olabilir)", type: "Şöför" },
            { label: "Adli Sicil Kaydı", period: "Yıllık (3 ay geçerli)", type: "Şöför" },
            { label: "Sağlık Raporu", period: "Yıllık", type: "Şöför" },
            { label: "Teknik Muayene", period: "6 AYDA BİR ⚠️", type: "Araç", urgent: true },
            { label: "Trafik Sigortası", period: "Yıllık", type: "Araç" },
            { label: "Güzergah İzni", period: "Yıllık", type: "Araç" },
            { label: "Okul Uygunluk / J Plaka", period: "Yıllık (her Eylül)", type: "Araç" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 ${item.urgent ? "bg-red-500/20 border border-red-500/30" : "bg-white/5 border border-white/10"}`}>
              <div className={`text-xs font-semibold mb-1 ${item.type === "Şöför" ? "text-blue-300" : "text-amber-300"}`}>{item.type}</div>
              <div className="font-medium">{item.label}</div>
              <div className={`text-xs mt-1 ${item.urgent ? "text-red-300 font-bold" : "text-slate-400"}`}>{item.period}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
