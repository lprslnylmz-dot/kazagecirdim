/**
 * Kaza türüne göre rehber içeriği ve Kaza Sonrası Asistanı kontrol listeleri.
 *
 * İçerik genel bilgilendirme amaçlıdır; hukuki veya tıbbi tavsiye değildir.
 * Mevzuata dayanan her madde yayından önce bir uzman tarafından gözden geçirilmeli
 * ve en az yılda bir güncellenmelidir (son gözden geçirme: 2026-10).
 */

export type AccidentType = "trafik" | "ev" | "is" | "diger";

export type ChecklistItem = {
  key: string;
  label: string;
  detail?: string;
  /** Kaza tarihinden itibaren önerilen son gün (takvim günü). Yoksa tarihsiz madde. */
  dueDays?: number;
  /** Tarih kesin bir yasal süre değil, öneri ise true */
  approximate?: boolean;
};

export type Guide = {
  type: AccidentType;
  title: string;
  short: string;
  intro: string;
  emergency: string[];
  sections: { heading: string; points: string[] }[];
  checklist: ChecklistItem[];
  related?: { href: string; label: string }[];
};

export const GUIDES: Record<AccidentType, Guide> = {
  trafik: {
    type: "trafik",
    title: "Trafik kazası geçirdim",
    short: "Tutanak, sigorta, değer kaybı ve sağlık",
    intro:
      "Önce can güvenliği, sonra belgeler. Doğru tutulmuş bir tutanak ve birkaç iyi fotoğraf, sonraki bütün süreçleri kolaylaştırır.",
    emergency: [
      "Yaralı varsa 112'yi arayın; yaralıyı zorunlu değilse hareket ettirmeyin.",
      "Dörtlüleri yakın, mümkünse reflektör koyun ve trafikten uzak durun.",
      "Yaralanmalı kazalarda polis veya jandarma tutanak tutar; araçları yerinden oynatmayın.",
    ],
    sections: [
      {
        heading: "Kaza yerinde",
        points: [
          "Araçları, plakaları, hasarları, yolu ve konumu farklı açılardan fotoğraflayın.",
          "Yalnızca maddi hasar varsa taraflar anlaşmalı kaza tespit tutanağı doldurabilir. Tutanak e-Devlet mobil uygulamasındaki 'Kaza Tutanağı' hizmetiyle veya SBM'nin mobil tutanak uygulamasıyla dijital olarak da tutulabilir.",
          "Karşı tarafın ehliyet, ruhsat ve poliçe bilgilerini kaydedin; tanık varsa iletişim bilgisini alın.",
        ],
      },
      {
        heading: "Sonraki günlerde",
        points: [
          "Hasar başvurusunu sigorta şirketine kendiniz yapın. 1 Temmuz 2026'dan itibaren maddi hasar başvurusu değer kaybı talebini de kapsıyor; merkezi sistemden atanan eksper ikisini aynı raporda belirliyor.",
          "Eksperin değer kaybı tespitine, raporun size bildirildiği tarihten itibaren 3 iş günü içinde itiraz edebilirsiniz.",
          "Vekalet karşılığı 'değer kaybınızı biz alalım' diyen aracılara dikkat edin; yeni düzenlemede aracı üzerinden başvuru kabul edilmiyor.",
          "Belirti olmasa bile bir sağlık kontrolü yaptırın; rapor ve epikrizleri saklayın.",
        ],
      },
      {
        heading: "Haklar ve süreler",
        points: [
          "Sigorta ödemeyi reddederse veya tutarı yetersiz bulursanız Sigorta Tahkim Komisyonu'na veya mahkemeye başvurabilirsiniz.",
          "Talep hakkı genel olarak zararı ve sorumluyu öğrendiğiniz tarihten itibaren 2 yıl, her durumda kazadan itibaren 10 yıl içinde zamanaşımına uğrar.",
          "Kişisel durumunuz için bir avukata danışın. Ücretsiz destek için barolarının adli yardım bürolarına başvurabilirsiniz.",
        ],
      },
    ],
    checklist: [
      { key: "foto", label: "Kaza yerini ve hasarları fotoğrafla", dueDays: 0 },
      { key: "tutanak", label: "Kaza tespit tutanağını tut (kâğıt, e-Devlet veya mobil uygulama)", dueDays: 0 },
      { key: "karsi-bilgi", label: "Karşı tarafın ehliyet, ruhsat ve poliçe bilgilerini kaydet", dueDays: 0 },
      { key: "saglik", label: "Sağlık kontrolü yaptır, raporları sakla", dueDays: 1, approximate: true },
      { key: "sigorta", label: "Sigortaya hasar başvurusunu kendin yap (IBAN bilgisini sen ilet)", dueDays: 3, approximate: true, detail: "Poliçenizdeki bildirim süresini kontrol edin." },
      { key: "eksper", label: "Eksper raporunu ve değer kaybı tutarını kontrol et; gerekirse 3 iş günü içinde itiraz et", detail: "Süre, raporun size bildirildiği günden başlar." },
      { key: "belgeler", label: "Fatura, rapor ve yazışmaları tek dosyada topla", dueDays: 14, approximate: true },
      { key: "zamanasimi", label: "Zamanaşımına dikkat: genel olarak öğrenmeden itibaren 2 yıl", dueDays: 730, approximate: true },
    ],
    related: [{ href: "/hesaplayici", label: "İş kazasıysa: ödenek hesaplayıcı" }],
  },

  ev: {
    type: "ev",
    title: "Evde kaza geçirdim",
    short: "Düşme, yanık, zehirlenme, yutma",
    intro:
      "Ev kazaları tüm kazaların yaklaşık dörtte birini oluşturuyor; en çok çocukları ve yaşlıları etkiliyor. Doğru ilk müdahale ve tekrarını önlemek en önemli iki adım.",
    emergency: [
      "Bilinç kaybı, nefes almada güçlük, durmayan kanama veya ciddi yanıkta hemen 112'yi arayın.",
      "Zehirlenme şüphesinde 114 Ulusal Zehir Danışma Merkezi'ni arayın; kusturmaya çalışmayın, ürünün kutusunu yanınızda tutun.",
      "Yanıkta bölgeyi en az 20 dakika ılık akan su altında tutun; buz, yoğurt, diş macunu veya merhem sürmeyin.",
    ],
    sections: [
      {
        heading: "Ne zaman sağlık kuruluşuna gitmeli?",
        points: [
          "Başını çarpan ve kusan, uyuklayan veya davranışı değişen kişiler.",
          "Kabarcıklı veya geniş alanlı yanıklar, yüz, el ve genital bölge yanıkları.",
          "Yabancı cisim yutma, özellikle düğme pil ve mıknatıs yutma şüphesi.",
          "Düşme sonrası yürüyememe, şekil bozukluğu veya şiddetli ağrı (özellikle yaşlılarda kalça).",
        ],
      },
      {
        heading: "Tekrarını önlemek",
        points: [
          "Kazanın nedenini yazın: nerede, ne yapılırken, ne eksikti?",
          "Oda oda kontrol: kaygan zeminler, açıkta ilaç ve temizlik ürünleri, ocak ve sıcak sıvılar, pencere ve balkon emniyeti, gece aydınlatması.",
          "Yaşlılar için tutunma barları, kaydırmaz paspas ve düşme algılayıcı; çocuklar için dolap kilidi ve priz koruyucu düşünülebilir.",
        ],
      },
      {
        heading: "Sigorta",
        points: [
          "Ferdi kaza sigortanız varsa kaza sonucu tedavi masrafları ve sakatlık teminatı için poliçenizdeki bildirim süresine uyun.",
        ],
      },
    ],
    checklist: [
      { key: "acil", label: "Acil işaretleri kontrol et; gerekirse 112 / 114", dueDays: 0 },
      { key: "saglik", label: "Gerekiyorsa sağlık kuruluşuna başvur, raporları sakla", dueDays: 0 },
      { key: "neden", label: "Kazanın nasıl olduğunu not et", dueDays: 1 },
      { key: "kontrol", label: "Evi oda oda güvenlik açısından kontrol et", dueDays: 7, approximate: true },
      { key: "onlem", label: "Eksik önlemleri tamamla (kilit, kaydırmaz, aydınlatma vb.)", dueDays: 14, approximate: true },
      { key: "sigorta", label: "Ferdi kaza sigortan varsa sigortaya bildir", detail: "Poliçenizdeki süreyi kontrol edin." },
    ],
  },

  is: {
    type: "is",
    title: "İş kazası geçirdim",
    short: "Bildirim, ödenek ve haklarınız",
    intro:
      "İş kazası geçirdiyseniz tedavi giderleriniz ve çalışamadığınız günler için SGK'dan ödenek alma hakkınız var. Bunun için kazanın kayda geçmesi çok önemli.",
    emergency: [
      "Yaralanma varsa ilk yardım alın ve gerekirse 112'yi arayın.",
      "Kazayı hemen amirinize veya işverene bildirin.",
      "Hastanede başvurunun bir 'iş kazası' olduğunu mutlaka söyleyin.",
    ],
    sections: [
      {
        heading: "İşverenin yükümlülüğü",
        points: [
          "İşveren kazayı kolluk kuvvetlerine derhal, SGK'ya ise kazadan sonraki 3 iş günü içinde bildirmek zorundadır.",
          "Bildirim geç yapılırsa, o tarihe kadar size ödenecek geçici iş göremezlik ödeneği SGK tarafından işverenden tahsil edilir; işverene idari para cezası da uygulanır.",
          "Bildirimin yapılıp yapılmadığını işvereninize sorabilir veya SGK'dan öğrenebilirsiniz.",
        ],
      },
      {
        heading: "Haklarınız",
        points: [
          "Geçici iş göremezlik ödeneği: istirahatli olduğunuz her gün için, yatarak tedavide günlük kazancınızın yarısı, ayakta tedavide üçte ikisi ödenir. İş kazasında ödenek istirahatin ilk gününden başlar.",
          "Kaza sonucu meslekte kazanma gücünüzün en az %10'unu kaybederseniz sürekli iş göremezlik geliri bağlanabilir.",
          "Tedavi giderleri SGK tarafından karşılanır.",
          "İşverenin kusuru olduğunu düşünüyorsanız maddi ve manevi tazminat konusunda bir avukata danışın; barolarının adli yardım bürolarından ücretsiz destek alabilirsiniz.",
        ],
      },
      {
        heading: "İşe dönüş",
        points: [
          "Doktorunuzla hangi işleri ne zaman yapabileceğinizi konuşun; kademeli dönüş isteyebilirsiniz.",
          "Kaza sonrası uyku sorunu, kaygı veya kazayı tekrar tekrar yaşama gibi belirtiler sık görülür; sürerse bir sağlık profesyoneline başvurun.",
        ],
      },
    ],
    checklist: [
      { key: "ilkyardim", label: "İlk yardım al, gerekirse 112", dueDays: 0 },
      { key: "bildir", label: "Kazayı amirine / işverene bildir", dueDays: 0 },
      { key: "hastane", label: "Hastanede 'iş kazası' olduğunu söyle; rapor ve epikrizi al", dueDays: 0 },
      { key: "tanik", label: "Tanıkların adlarını ve kazanın nasıl olduğunu not et", dueDays: 1 },
      { key: "sgk", label: "İşverenin SGK bildirimini yaptığını teyit et (son gün: 3 iş günü)", dueDays: 5, approximate: true, detail: "Kesin son gün hafta sonu ve resmi tatillere göre değişir." },
      { key: "odenek", label: "Geçici iş göremezlik ödeneğini takip et", dueDays: 30, approximate: true },
      { key: "isedonus", label: "İşe dönüş planını doktorun ve işverenle konuş", dueDays: 14, approximate: true },
    ],
    related: [{ href: "/hesaplayici", label: "Ödenek hesaplayıcı" }],
  },

  diger: {
    type: "diger",
    title: "Başka bir kaza geçirdim",
    short: "Spor, sokak, toplu taşıma ve diğerleri",
    intro:
      "Kaza nerede olursa olsun ilk adımlar benzer: sağlık, kayıt ve sorumlunun belirlenmesi.",
    emergency: [
      "Yaralanma ciddi ise 112'yi arayın.",
      "Kaza bir işletmede, toplu taşımada veya kamusal alanda olduysa yetkililere bildirin ve kayıt altına aldırın.",
    ],
    sections: [
      {
        heading: "Kayıt ve belge",
        points: [
          "Yeri ve nedeni (kırık kaldırım, ıslak zemin, işaretsiz çukur vb.) fotoğraflayın.",
          "Tanıkların iletişim bilgilerini alın; varsa güvenlik kamerası kaydının saklanmasını isteyin.",
          "Sağlık raporlarını ve masraf belgelerini saklayın.",
        ],
      },
      {
        heading: "Sorumluluk ve sigorta",
        points: [
          "Toplu taşımada zorunlu koltuk ferdi kaza sigortası bulunur; taşıyıcı firmaya bildirin.",
          "Kendi ferdi kaza sigortanız varsa poliçedeki süre içinde bildirin.",
          "Kamu kurumunun ihmali veya bir işletmenin kusuru söz konusuysa bir avukata danışın.",
        ],
      },
    ],
    checklist: [
      { key: "saglik", label: "Sağlık kontrolü yaptır, raporları sakla", dueDays: 0 },
      { key: "foto", label: "Kaza yerini ve nedeni fotoğrafla", dueDays: 0 },
      { key: "bildir", label: "İşletmeye / kuruma / taşıyıcıya yazılı bildir", dueDays: 2, approximate: true },
      { key: "kamera", label: "Kamera kaydının saklanmasını iste", dueDays: 2, approximate: true },
      { key: "sigorta", label: "Ferdi kaza sigortan varsa bildir", detail: "Poliçenizdeki süreyi kontrol edin." },
    ],
  },
};

export const ACCIDENT_TYPES = Object.keys(GUIDES) as AccidentType[];

export function isAccidentType(v: string): v is AccidentType {
  return (ACCIDENT_TYPES as string[]).includes(v);
}

/** Kaza tarihine göre maddelerin son günlerini hesaplar. */
export function scheduleChecklist(type: AccidentType, accidentDate: string) {
  const [y, m, d] = accidentDate.split("-").map(Number);
  return GUIDES[type].checklist.map((item) => {
    if (item.dueDays === undefined) return { ...item, due: null as string | null };
    const due = new Date(y, m - 1, d + item.dueDays);
    const iso = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
    return { ...item, due: iso };
  });
}
