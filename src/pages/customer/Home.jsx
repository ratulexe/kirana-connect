import { Store } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <Store className="h-10 w-10 text-neutral-700" aria-hidden="true" />
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
        Kirana Connect
      </h1>
      <p className="text-base text-neutral-600">Project setup complete.</p>
    </main>
  );
}
