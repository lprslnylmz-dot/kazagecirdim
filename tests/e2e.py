"""Uçtan uca duman testi: kazazede akışı, QR bildirimi, işveren paneli."""
import os, re, sys, tempfile
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:3100")
SHOTS = os.environ.get("SHOTS_DIR", tempfile.mkdtemp()) + "/"
errors = []

def wait_path(pg, pattern):
    import time
    rx = re.compile(pattern)
    for _ in range(150):
        if rx.search(pg.url): return
        pg.wait_for_timeout(200)
    raise AssertionError(f"URL beklenmedi: {pg.url} ~ {pattern}")


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="tr-TR", timezone_id="Europe/Istanbul")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console {m.type}: {m.text}") if m.type == "error" else None)

    # 1) Ana sayfa
    page.goto(BASE + "/")
    page.screenshot(path=SHOTS + "01-home.png", full_page=True)

    # 2) Asistan: iş kazası listesi oluştur, madde işaretle, not kaydet
    page.goto(BASE + "/asistan?tur=is")
    page.get_by_role("button", name="Listemi oluştur").click()
    wait_path(page, r"/asistan/[\w-]{10,}")
    page.get_by_role("button", name="Tamamlandı olarak işaretle").first.click()
    page.wait_for_selector("text=1 / 7 madde tamamlandı")
    page.fill("#note", "SGK dosya no: test")
    page.get_by_role("button", name="Notu kaydet").click()
    page.wait_for_timeout(800)
    page.reload()
    assert page.input_value("#note") == "SGK dosya no: test", "not kaydedilmedi"
    page.screenshot(path=SHOTS + "02-asistan.png", full_page=True)

    # 3) Hesaplayıcı
    page.goto(BASE + "/hesaplayici")
    page.fill("#yatarak", "2"); page.fill("#ayakta", "3")
    total = page.locator("dd.text-2xl").inner_text()
    assert "3.000" in total, f"hesap yanlış: {total}"

    # 4) Çalışan QR bildirimi (fotoğraflı)
    import base64
    png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    open(SHOTS + "t.png", "wb").write(png)
    mob = ctx.new_page(); mob.set_viewport_size({"width": 390, "height": 844})
    mob.goto(BASE + "/b/demo-fabrika")
    mob.select_option("#category", "Elektrik")
    mob.fill("#description", "E2E testi: pano kapağı açık bırakılmış")
    mob.set_input_files("#photo", SHOTS + "t.png")
    mob.screenshot(path=SHOTS + "03-qr-form.png", full_page=True)
    mob.get_by_role("button", name="Bildirimi gönder").click()
    mob.wait_for_selector("text=Teşekkürler, bildiriminiz alındı")
    # Kötü dosya reddedilmeli
    open(SHOTS + "bad.png", "w").write("<svg onload=alert(1)>")
    mob.goto(BASE + "/b/demo-fabrika")
    mob.select_option("#category", "Elektrik"); mob.fill("#description", "kötü dosya denemesi")
    mob.set_input_files("#photo", SHOTS + "bad.png")
    mob.get_by_role("button", name="Bildirimi gönder").click()
    mob.wait_for_selector("text=Yalnızca JPG, PNG veya WEBP")
    assert mob.input_value("#description") == "kötü dosya denemesi", "açıklama kayboldu"

    # 5) Fotoğraf girişsiz erişilemez
    r = ctx.request.get(BASE + "/api/foto/00000000-0000-0000-0000-000000000000.png")
    assert r.status == 401, f"foto korumasız: {r.status}"

    # 6) Yanlış şifre, sonra giriş
    page.goto(BASE + "/giris")
    page.fill("#email", "demo@kazagecirdim.com"); page.fill("#password", "yanlis")
    page.get_by_role("button", name="Giriş yap").click()
    page.wait_for_selector("text=E-posta veya şifre hatalı")
    assert page.input_value("#email") == "demo@kazagecirdim.com", "e-posta kayboldu"
    page.fill("#password", "demo12345")
    page.get_by_role("button", name="Giriş yap").click()
    wait_path(page, r"/panel$"); page.wait_for_load_state()
    page.screenshot(path=SHOTS + "04-panel.png", full_page=True)
    assert page.locator("text=SGK bildirimi bekleyen kazalar").count() == 1

    # 7) Yeni bildirim panelde ve fotoğraf görünüyor
    page.goto(BASE + "/panel/bildirimler")
    page.locator("tr", has_text="E2E testi").get_by_role("link").click()
    wait_path(page, r"/panel/bildirimler/\d+")
    img = page.locator("img[alt='Bildirim fotoğrafı']")
    assert img.count() == 1
    assert page.evaluate("document.querySelector(\"img[alt='Bildirim fotoğrafı']\").naturalWidth") == 1, "foto yüklenmedi"
    page.fill("#title", "Pano kapağına kilit takılacak"); page.fill("#owner", "Elektrik bakım")
    page.get_by_role("button", name="Ekle").click()
    page.wait_for_selector("text=Pano kapağına kilit takılacak")
    page.select_option("#status", "kapandi"); page.get_by_role("button", name="Kaydet").click()
    page.wait_for_timeout(600); page.reload()
    assert page.locator(".badge", has_text="Kapandı").count() >= 1

    # 8) Yeni kaza dosyası
    page.goto(BASE + "/panel/olaylar/yeni")
    page.fill("#title", "E2E forklift çarpması")
    page.fill("#occurredAt", "2026-10-27T10:00")
    page.get_by_role("button", name=re.compile("Dosyayı aç")).click()
    wait_path(page, r"/panel/olaylar/\d+$")
    assert page.locator("text=2 Kasım 2026").count() >= 1, "SGK son günü yanlış"
    page.get_by_role("button", name="SGK'ya bildirildi olarak işaretle").click()
    page.wait_for_selector(".badge:has-text('SGK bildirildi')")
    page.fill("#wname", "Veli Y."); page.fill("#statement", "Forklift geri manevrada çarptı.")
    page.get_by_role("button", name="İfadeyi ekle").click()
    page.wait_for_selector("text=Forklift geri manevrada çarptı.")
    page.fill("#why1", "Forklift geri giderken yayayı görmedi"); page.fill("#rootCause", "Yaya ve araç yolları ayrılmamış")
    page.select_option("#category", "ortam")
    page.get_by_role("button", name="Analizi kaydet").click()
    page.wait_for_timeout(800)
    assert page.locator("#category").input_value() == "ortam", "kategori görünmüyor"
    page.screenshot(path=SHOTS + "05-olay.png", full_page=True)
    page.get_by_role("link", name="Rapor", exact=True).click()
    wait_path(page, r"/rapor$")
    assert page.locator("text=Yaya ve araç yolları ayrılmamış").count() == 1
    page.screenshot(path=SHOTS + "06-olay-rapor.png", full_page=True)

    # 9) Aylık rapor, QR afiş, yeni lokasyon
    page.goto(BASE + "/panel/rapor"); page.screenshot(path=SHOTS + "07-aylik.png", full_page=True)
    page.goto(BASE + "/panel/lokasyonlar")
    page.fill("#name", "Şantiye 2"); page.get_by_role("button", name="Ekle").click()
    page.wait_for_selector("h2:has-text('Şantiye 2')")
    page.get_by_role("link", name="QR afişi").first.click()
    page.wait_for_selector("svg")
    page.screenshot(path=SHOTS + "08-afis.png", full_page=True)

    # 10) Kayıt akışı + başka kurum verisine erişememe
    ctx2 = b.new_context(locale="tr-TR")
    p2 = ctx2.new_page()
    p2.goto(BASE + "/kayit")
    p2.fill("#org", "Test Lojistik"); p2.fill("#site", "Merkez"); p2.fill("#name", "Can"); p2.fill("#email", "can@test.com")
    p2.fill("#password", "sifre12345"); p2.check("input[name=kvkk]")
    p2.get_by_role("button", name="Hesap oluştur").click()
    wait_path(p2, r"/panel$")
    r2 = p2.goto(BASE + "/panel/olaylar/1")
    assert r2.status == 404, f"kurumlar arası erişim! {r2.status}"
    r3 = p2.goto(BASE + "/panel/bildirimler/1")
    assert r3.status == 404, f"kurumlar arası erişim! {r3.status}"

    b.close()

real = [e for e in errors if "favicon" not in e]
print("HATALAR:", real if real else "yok")
print("E2E OK")
