"use client";

import { useMemo, useState } from "react";
import { hesaplaOdenek } from "@/lib/odenek";

const tl = (n: number) => n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

function NumField(props: { id: string; label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={props.id} className="label">{props.label}</label>
      <input id={props.id} inputMode="decimal" className="field" value={props.value}
        onChange={(e) => props.onChange(e.target.value)} />
      {props.hint && <p className="hint">{props.hint}</p>}
    </div>
  );
}

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export function OdenekCalculator() {
  const [kazanc, setKazanc] = useState("90000");
  const [gun, setGun] = useState("90");
  const [yatarak, setYatarak] = useState("0");
  const [ayakta, setAyakta] = useState("10");

  const sonuc = useMemo(() => {
    try {
      return hesaplaOdenek({
        son3AyKazanc: num(kazanc), son3AyGun: num(gun), yatarakGun: num(yatarak), ayaktaGun: num(ayakta),
      });
    } catch {
      return null;
    }
  }, [kazanc, gun, yatarak, ayakta]);

  return (
    <div className="card grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <NumField id="kazanc" label="Son 3 ayın brüt kazanç toplamı (TL)" hint="Bordronuzdaki prime esas kazanç" value={kazanc} onChange={setKazanc} />
        <NumField id="gun" label="Son 3 ayda prim ödenen gün" hint="Tam çalıştıysanız 90" value={gun} onChange={setGun} />
        <NumField id="yatarak" label="Yatarak tedavi / istirahat günü" value={yatarak} onChange={setYatarak} />
        <NumField id="ayakta" label="Ayakta tedavi / istirahat günü" value={ayakta} onChange={setAyakta} />
      </div>
      <div className="rounded-xl bg-brand-soft p-5" aria-live="polite">
        {sonuc ? (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Günlük kazanç</dt><dd className="font-medium">{tl(sonuc.gunlukKazanc)}</dd></div>
            <div className="flex justify-between"><dt>Yatarak (günlük)</dt><dd>{tl(sonuc.yatarakGunluk)}</dd></div>
            <div className="flex justify-between"><dt>Ayakta (günlük)</dt><dd>{tl(sonuc.ayaktaGunluk)}</dd></div>
            <hr className="border-brand/20" />
            <div className="flex items-baseline justify-between">
              <dt className="font-semibold">Tahmini toplam ödenek</dt>
              <dd className="text-2xl font-bold text-brand">{tl(sonuc.toplam)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-alert">Lütfen geçerli, pozitif sayılar girin.</p>
        )}
      </div>
    </div>
  );
}
