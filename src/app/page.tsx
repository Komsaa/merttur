import Image from "next/image";
import Link from "next/link";
import {
  Bus,
  Shield,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  ChevronRight,
  Star,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-[#1B2437] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Mert Tur Logo"
                width={48}
                height={48}
                className="rounded-lg"
                priority
              />
              <div>
                <span className="text-white font-black text-xl tracking-tight">
                  MERT
                </span>
                <span className="text-white font-light text-xl"> TUR</span>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#hizmetler" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Hizmetlerimiz
              </a>
              <a href="#filomuz" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Filomuz
              </a>
              <a href="#neden-biz" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Neden Biz?
              </a>
              <a href="#iletisim" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                İletişim
              </a>
              <Link
                href="/login"
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                Panel Girişi
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile CTA */}
            <div className="md:hidden flex items-center gap-2">
              <a href="tel:05061227363" className="text-white p-2">
                <Phone className="w-5 h-5" />
              </a>
              <Link
                href="/login"
                className="bg-[#DC2626] text-white px-3 py-2 rounded-lg text-sm font-semibold"
              >
                Panel
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="bg-[#1B2437] text-white relative overflow-hidden">
        {/* Arka plan desen */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #DC2626 0px, #DC2626 1px, transparent 1px, transparent 50px)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#DC2626]/20 text-red-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <MapPin className="w-4 h-4" />
                Gölmarmara · Manisa
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
                Güvenli ve
                <br />
                <span className="text-[#DC2626]">Zamanında</span>
                <br />
                Servis Hizmeti
              </h1>

              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Gölmarmara ve çevre ilçelerde 10+ araç filomuzla okul ve personel
                servis hizmetleri sunuyoruz. Lisanslı şöförler, sigortalı araçlar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:05061227363"
                  className="flex items-center justify-center gap-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-red-500/25"
                >
                  <Phone className="w-5 h-5" />
                  0506 122 73 63
                </a>
                <a
                  href="#hizmetler"
                  className="flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                >
                  Hizmetlerimiz
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "10+", label: "Araç", icon: Bus },
                { number: "100%", label: "Lisanslı Şöför", icon: Shield },
                { number: "7/24", label: "Ulaşılabilir", icon: Clock },
                { number: "∞", label: "Güven", icon: Star },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center"
                >
                  <stat.icon className="w-8 h-8 text-[#DC2626] mx-auto mb-3" />
                  <div className="text-3xl font-black text-white">{stat.number}</div>
                  <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alt dalga */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 L1440,60 L1440,0 Q720,60 0,0 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ===== HİZMETLER ===== */}
      <section id="hizmetler" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">
              Hizmetlerimiz
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Her ihtiyaca uygun servis çözümleri sunuyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Bus,
                title: "Okul Servisi",
                desc: "Çocuklarınızın güvenli okul yolculuğu için J plakalı, yetkili araçlarımızla kapıdan kapıya hizmet.",
                features: ["J plakalı araçlar", "SRC-2 belgeli şöförler", "Günlük rota takibi", "Veli bilgilendirme"],
                color: "blue",
              },
              {
                icon: Users,
                title: "Personel Servisi",
                desc: "Fabrika ve ofis çalışanlarınız için sabah/akşam düzenli sefer hizmeti. Yıllık sözleşmeli.",
                features: ["Esnek güzergah", "Yıllık sözleşme", "Vardiya uyumu", "Klimalı araçlar"],
                color: "red",
              },
              {
                icon: MapPin,
                title: "Özel Sefer",
                desc: "Gezi, tören, toplantı ve özel etkinlikler için araç kiralama hizmeti.",
                features: ["Konforlu araçlar", "Deneyimli şöförler", "Esnek saatler", "Manisa geneli"],
                color: "amber",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    service.color === "red"
                      ? "bg-red-50"
                      : service.color === "blue"
                      ? "bg-blue-50"
                      : "bg-amber-50"
                  }`}
                >
                  <service.icon
                    className={`w-7 h-7 ${
                      service.color === "red"
                        ? "text-[#DC2626]"
                        : service.color === "blue"
                        ? "text-blue-600"
                        : "text-amber-600"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold text-[#1B2437] mb-3">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{service.desc}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FİLOMUZ ===== */}
      <section id="filomuz" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-6">
                Modern ve Güvenli Filomuz
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Tüm araçlarımız düzenli bakımlı, sigortalı ve Türkiye standartlarında
                muayeneli. Şöförlerimiz SRC belgeli ve psikoteknik onaylı.
              </p>

              <div className="space-y-4">
                {[
                  { label: "Aktif Araç Sayısı", value: "10-15 araç", icon: Bus },
                  { label: "Plaka Tipi", value: "45 J Plakalı (Okul Servisi)", icon: Shield },
                  { label: "Yolcu Kapasitesi", value: "9-14 kişilik araçlar", icon: Users },
                  { label: "Hizmet Bölgesi", value: "Gölmarmara ve çevre ilçeler", icon: MapPin },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-[#DC2626]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#DC2626]" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">{item.label}</div>
                      <div className="text-slate-800 font-semibold">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#1B2437] rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Belge Güvencesi</h3>
                <p className="text-slate-400 text-sm mb-8">
                  Tüm şöförlerimiz ve araçlarımız yasal belgelere sahip ve güncel tutulmaktadır.
                </p>
                <div className="space-y-3">
                  {[
                    "SRC-2 Mesleki Yeterlilik Belgesi",
                    "Psikoteknik Değerlendirme Belgesi",
                    "Adli Sicil Kaydı (Yıllık)",
                    "Güzergah İzin Belgesi (Yıllık)",
                    "TÜVTÜRK Teknik Muayene (6 Aylık)",
                    "Zorunlu Trafik Sigortası",
                    "Okul Servisi Uygunluk Belgesi",
                  ].map((doc) => (
                    <div key={doc} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NEDEN BİZ ===== */}
      <section id="neden-biz" className="py-24 bg-[#1B2437] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Neden Mert Tur?</h2>
            <p className="text-slate-400 text-lg">Gölmarmara&apos;nın güvenilen servis firması</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Award,
                title: "Yerel Güven",
                desc: "Gölmarmara'da yıllardır kesintisiz hizmet. Tanınan, güvenilen bir aile işletmesi.",
              },
              {
                icon: Shield,
                title: "Tam Belge",
                desc: "Tüm şöför ve araç belgelerimiz güncel. Yasal zorunlulukların tamamını karşılıyoruz.",
              },
              {
                icon: Clock,
                title: "Dakiklik",
                desc: "Saate dakik servis anlayışı. Rota planlaması ve zaman yönetimi önceliğimiz.",
              },
              {
                icon: Phone,
                title: "Ulaşılabilirlik",
                desc: "İşletme sahibi her zaman ulaşılabilir. Direkt iletişim, aracı yok.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-10 h-10 text-[#DC2626] mb-4" />
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== İLETİŞİM ===== */}
      <section id="iletisim" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B2437] mb-4">
              İletişime Geçin
            </h2>
            <p className="text-slate-500">Fiyat teklifi ve bilgi için hemen arayın</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#DC2626]/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#DC2626]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Telefon</div>
                    <a href="tel:05061227363" className="text-xl font-bold text-[#1B2437] hover:text-[#DC2626] transition-colors">
                      0506 122 73 63
                    </a>
                  </div>
                </div>
                <a
                  href="tel:05061227363"
                  className="w-full flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white py-3 rounded-xl font-semibold transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Hemen Ara
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#DC2626]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#DC2626]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Konum</div>
                    <div className="font-bold text-[#1B2437]">Gölmarmara</div>
                    <div className="text-slate-500 text-sm">Manisa, Türkiye</div>
                    <div className="text-slate-400 text-xs mt-2">
                      Gölmarmara merkez ve çevre ilçelere hizmet
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-[#1B2437] rounded-2xl p-8 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4">Hızlı İletişim</h3>
              <p className="text-slate-400 mb-8">
                WhatsApp üzerinden mesaj gönderin, en kısa sürede dönüş yapalım.
              </p>
              <a
                href="https://wa.me/905061227363?text=Merhaba%2C%20servis%20hizmeti%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg transition-all"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp Yaz
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#1B2437] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Mert Tur" width={40} height={40} className="rounded-lg" />
              <div>
                <div className="font-black text-lg">
                  <span className="text-white">MERT</span>
                  <span className="text-slate-400 font-light"> TUR</span>
                </div>
                <div className="text-slate-500 text-xs">Gölmarmara / Manisa</div>
              </div>
            </div>

            <div className="text-slate-400 text-sm text-center">
              © {new Date().getFullYear()} Mert Tur. Tüm hakları saklıdır.
            </div>

            <a
              href="tel:05061227363"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              0506 122 73 63
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
