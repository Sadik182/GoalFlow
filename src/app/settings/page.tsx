// app/settings/page.tsx
import { getUserFromCookie } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getUserFromCookie(); // ✅ await
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Name:</span> {user.name}
          </div>
          <div>
            <span className="text-gray-500">Email:</span> {user.email}
          </div>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-6">
          <button className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
