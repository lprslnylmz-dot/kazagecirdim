import type { Metadata } from "next";
import Link from "next/link";
import { OdenekCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "İş kazası ödenek hesaplayıcı",
  description: "İş kazası sonrası SGK geçici iş göremezlik ödeneğini yaklaşık hesaplayın.",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="h1">İş kazası ödenek hesaplayıcı</h1>
        <p className="mt-3 text-muted">
          İş kazası sonrası istirahatli olduğunuz günler için SGK geçici iş göremezlik ödeneği öder: yatarak
          tedavide günlük kazancınızın yarısı, ayakta tedavide üçte ikisi. İş kazasında ödenek istirahatin ilk
          gününden başlar.
        </p>
      </header>
      <OdenekCalculator />
      <div className="rounded-lg bg-paper p-4 text-sm text-muted">
        <p>
          Bu hesap yaklaşıktır. Günlük kazanç; kazadan önceki 12 ayda prim bildirilen son 3 ayın kazancına göre
          bulunur ve prime esas kazanç üst sınırıyla sınırlıdır. Kesin tutarı SGK belirler.
        </p>
        <p className="mt-2">
          Ödeneğin doğru hesaplanabilmesi için kazanın işverence zamanında bildirilmesi önemlidir.{" "}
          <Link href="/kaza/is" className="font-medium text-brand underline">İş kazası rehberi</Link>
        </p>
      </div>
    </div>
  );
}
