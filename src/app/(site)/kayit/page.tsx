import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Ücretsiz deneyin" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="h1">30 gün ücretsiz deneyin</h1>
      <p className="mb-6 mt-2 text-muted">Kredi kartı gerekmez. Pilot süresinin sonunda devam edip etmeyeceğinize siz karar verirsiniz.</p>
      <RegisterForm />
    </div>
  );
}
