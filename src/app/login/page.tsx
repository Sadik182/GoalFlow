// app/login/page.tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  // Wrap the search-params consumer in Suspense
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.replace(next);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-gray-50">
      {/* Brand / Left panel (hidden on mobile) */}
      <div className="relative hidden md:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="relative z-10 max-w-md px-10 text-white">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight"
          >
            <span className="bg-white/10 px-3 py-1 rounded-xl">GoalFlow</span>
          </Link>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">
            Plan your week. <br /> Ship your goals.
          </h2>
          <p className="mt-3 text-white/90">
            Drag-and-drop goals, set due dates, and get a clean weekly view.
          </p>
          <ul className="mt-6 space-y-2 text-white/90 text-sm">
            <li>• Fast Kanban for weekly focus</li>
            <li>• Due-date nudges & summaries</li>
            <li>• Clean, distraction-free UI</li>
          </ul>
        </div>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -top-16 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Form / Right panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to continue to GoalFlow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => alert("Google sign-in not configured yet.")}
            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaGoogle className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-gray-500">
                or
              </span>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm text-gray-700"
              >
                Email
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:bg-gray-100"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/10 transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-700 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
