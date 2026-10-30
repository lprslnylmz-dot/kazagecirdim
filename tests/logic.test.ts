import { describe, expect, it } from "vitest";
import { addWorkdays, daysUntil, sgkDeadline, toISODate, parseIstanbulLocal } from "../src/lib/workdays";
import { hesaplaOdenek } from "../src/lib/odenek";
import { avgCloseDays, countBy, isValidMonth, monthRange } from "../src/lib/report-stats";
import { scheduleChecklist, GUIDES } from "../src/lib/content";
import { sniffImage, safeUploadPath } from "../src/lib/uploads";

describe("SGK bildirim süresi (3 iş günü)", () => {
  it("SGK örneği: pazartesi kaza → perşembe", () => {
    expect(sgkDeadline("2026-11-02")).toBe("2026-11-05");
  });
  it("SGK örneği: çarşamba kaza → pazartesi", () => {
    expect(sgkDeadline("2026-11-04")).toBe("2026-11-09");
  });
  it("Saat bilgisi olsa da yalnızca tarih kullanılır", () => {
    expect(sgkDeadline("2026-11-04T23:30")).toBe("2026-11-09");
  });
  it("Cumartesi kaza → çarşamba", () => {
    expect(sgkDeadline("2026-11-07")).toBe("2026-11-11");
  });
  it("29 Ekim resmi tatili atlanır", () => {
    // 27 Eki 2026 salı → 28 çar, (29 per tatil), 30 cum, 2 Kas pzt
    expect(sgkDeadline("2026-10-27")).toBe("2026-11-02");
  });
  it("Kurban Bayramı 2026 atlanır", () => {
    // 26 May 2026 salı (arife) → 27-30 bayram, 31 pazar → 1, 2, 3 Haziran
    expect(sgkDeadline("2026-05-26")).toBe("2026-06-03");
  });
  it("addWorkdays tatil listesi parametresiyle çalışır", () => {
    expect(toISODate(addWorkdays(new Date(2026, 10, 2), 1, ["2026-11-03"]))).toBe("2026-11-04");
  });
  it("daysUntil", () => {
    expect(daysUntil("2026-11-05", new Date(2026, 10, 2, 15))).toBe(3);
    expect(daysUntil("2026-11-01", new Date(2026, 10, 2))).toBe(-1);
  });
  it("Türkiye saati yorumlanır", () => {
    expect(parseIstanbulLocal("2026-10-30T15:00").toISOString()).toBe("2026-10-30T12:00:00.000Z");
  });
});

describe("Geçici iş göremezlik ödeneği", () => {
  it("ayakta 2/3, yatarak 1/2", () => {
    const r = hesaplaOdenek({ son3AyKazanc: 90000, son3AyGun: 90, yatarakGun: 2, ayaktaGun: 3 });
    expect(r.gunlukKazanc).toBe(1000);
    expect(r.yatarakGunluk).toBe(500);
    expect(r.ayaktaGunluk).toBe(666.67);
    expect(r.toplam).toBe(3000);
  });
  it("üst sınır uygulanır", () => {
    const r = hesaplaOdenek({ son3AyKazanc: 900000, son3AyGun: 90, yatarakGun: 1, ayaktaGun: 0, gunlukUstSinir: 5000 });
    expect(r.gunlukKazanc).toBe(5000);
  });
  it("geçersiz girdi hata verir", () => {
    expect(() => hesaplaOdenek({ son3AyKazanc: 1, son3AyGun: 0, yatarakGun: 0, ayaktaGun: 0 })).toThrow();
    expect(() => hesaplaOdenek({ son3AyKazanc: -1, son3AyGun: 90, yatarakGun: 0, ayaktaGun: 0 })).toThrow();
  });
});

describe("Aylık rapor hesapları", () => {
  const rows = [
    { kind: "a", category: "X", severity: 1, siteId: 1, status: "kapandi", createdAt: "2026-10-01T00:00:00Z", closedAt: "2026-10-03T00:00:00Z" },
    { kind: "a", category: "X", severity: 2, siteId: 1, status: "kapandi", createdAt: "2026-10-01T00:00:00Z", closedAt: "2026-10-02T00:00:00Z" },
    { kind: "b", category: "Y", severity: 3, siteId: 2, status: "yeni", createdAt: "2026-10-05T00:00:00Z", closedAt: null },
  ];
  it("countBy sıralı döner", () => {
    expect(countBy(rows, (r) => r.category)).toEqual([{ key: "X", count: 2 }, { key: "Y", count: 1 }]);
  });
  it("ortalama kapanma süresi", () => {
    expect(avgCloseDays(rows)).toBe(1.5);
    expect(avgCloseDays([])).toBeNull();
  });
  it("ay aralığı ve doğrulama", () => {
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z" });
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-10")).toBe(true);
  });
});

describe("Kaza sonrası asistanı", () => {
  it("son günler kaza tarihinden hesaplanır", () => {
    const items = scheduleChecklist("trafik", "2026-10-30");
    expect(items.find((i) => i.key === "foto")?.due).toBe("2026-10-30");
    expect(items.find((i) => i.key === "saglik")?.due).toBe("2026-10-31");
    expect(items.find((i) => i.key === "eksper")?.due).toBeNull();
  });
  it("her rehberin benzersiz madde anahtarları var", () => {
    for (const g of Object.values(GUIDES)) {
      const keys = g.checklist.map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("Yükleme güvenliği", () => {
  it("görsel türü baytlardan anlaşılır", () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
  it("dizin dışına çıkan adlar reddedilir", () => {
    expect(safeUploadPath("../../etc/passwd")).toBeNull();
    expect(safeUploadPath("123e4567-e89b-12d3-a456-426614174000.jpg")).not.toBeNull();
  });
});
