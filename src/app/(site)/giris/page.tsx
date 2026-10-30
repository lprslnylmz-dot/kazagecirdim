import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sonra?: string }> }) {
  const { sonra } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="h1 mb-6">İşveren paneline giriş</h1>
      <LoginForm next={sonra} />
    </div>
  );
}
