import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-50 to-white p-8 text-center">
      <h1 className="text-4xl font-bold text-emerald-700">EvergreenOS Selfhost Console</h1>
      <p className="max-w-xl text-lg text-slate-600">
        Manage devices, policies, events, and tenants for your EvergreenOS deployment. Sign in
        to access the administrative dashboard.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-emerald-700"
      >
        Continue to login
      </Link>
    </main>
  );
}
