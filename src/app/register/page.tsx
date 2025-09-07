"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !pw.trim() || !cpw.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw !== cpw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pw }),
    });

    if (res.ok) {
      router.replace("/");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-gray-50 md:grid-cols-2">
      {/* Brand panel (hidden on mobile) */}
      <div className="relative hidden items-center justify-center overflow-hidden md:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="relative z-10 max-w-full px-10 text-white">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight"
          >
            <span className="bg-white/10 px-3 py-1 rounded-xl">GoalFlow</span>
          </Link>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">
            Create your account.
            <br />
            To Focus your week.
          </h2>
          <p className="mt-3 text-white/90">
            Organize goals, set due dates, and track progress—all in one place.
          </p>
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -top-16 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Create account
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Start planning with GoalFlow.
            </p>
          </div>

          {/* Optional OAuth placeholder */}
          <button
            type="button"
            onClick={() => alert("Google sign-up not configured yet.")}
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
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm text-gray-700"
              >
                Name
              </label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
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

            {/* Confirm password */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="mb-1 block text-sm text-gray-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="passwordConfirm"
                  type={showCpw ? "text" : "password"}
                  value={cpw}
                  onChange={(e) => setCpw(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-200"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCpw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:bg-gray-100"
                  aria-label={
                    showCpw ? "Hide confirm password" : "Show confirm password"
                  }
                >
                  {showCpw ? (
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
