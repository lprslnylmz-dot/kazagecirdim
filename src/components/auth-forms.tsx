"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions/auth";

function ErrorBox({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">{state.error}</p>;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const v = state?.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="card space-y-4">
      <ErrorBox state={state} />
      {next && <input type="hidden" name="sonra" value={next} />}
      <div>
        <label htmlFor="email" className="label">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" defaultValue={v.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <button disabled={pending} className="btn-primary w-full">{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
      <p className="text-center text-sm text-muted">
        Hesabınız yok mu? <Link href="/kayit" className="font-medium text-brand underline">Ücretsiz deneyin</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  const v = state?.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="card space-y-4">
      <ErrorBox state={state} />
      <div>
        <label htmlFor="org" className="label">Kurum / firma adı</label>
        <input id="org" name="org" required className="field" defaultValue={v.org} />
      </div>
      <div>
        <label htmlFor="site" className="label">İlk lokasyon</label>
        <input id="site" name="site" required placeholder="Ör. Gebze fabrika" className="field" defaultValue={v.site} />
        <p className="hint">Daha sonra başka lokasyonlar ekleyebilirsiniz.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Adınız</label>
          <input id="name" name="name" autoComplete="name" required className="field" defaultValue={v.name} />
        </div>
        <div>
          <label htmlFor="email" className="label">E-posta</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" defaultValue={v.email} />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="label">Şifre</label>
        <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required className="field" />
        <p className="hint">En az 8 karakter.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="kvkk" required className="mt-1" defaultChecked={v.kvkk === "on"} />
        <span>Kişisel verilerin işlenmesine ilişkin aydınlatma metnini okudum.</span>
      </label>
      <button disabled={pending} className="btn-primary w-full">{pending ? "Hesap oluşturuluyor…" : "Hesap oluştur"}</button>
    </form>
  );
}
