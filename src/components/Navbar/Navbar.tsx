"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaChartBar,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [navOpen, setNavOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Fetch auth status once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await res.json();
        if (!cancelled) setIsAuthed(!!j?.user);
      } catch {
        if (!cancelled) setIsAuthed(false);
      } finally {
        if (!cancelled) setLoadingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const links = [
    { href: "/", label: "Dashboard", Icon: FaHome },
    { href: "/reports", label: "Reports", Icon: FaChartBar },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const NavLink = ({ href, label, Icon }: (typeof links)[number]) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={[
          "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "text-emerald-700"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" aria-hidden />
        <span>{label}</span>
        <span
          className={[
            "pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-600 transition-opacity",
            active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      </Link>
    );
  };

  const goSignIn = () => router.push("/login");
  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsAuthed(false);
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-gray-900"
        >
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            GoalFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}

          {/* Auth action */}
          {loadingAuth ? (
            <div className="ml-1 inline-flex items-center rounded-lg px-3 py-2 text-sm text-gray-400">
              …
            </div>
          ) : isAuthed ? (
            <button
              onClick={signOut}
              className="ml-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              onClick={goSignIn}
              className="ml-1 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FaSignInAlt className="h-4 w-4" />
              <span>Sign in</span>
            </button>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setNavOpen((v) => !v)}
          className="inline-flex items-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {navOpen ? (
            <FaTimes className="h-5 w-5" />
          ) : (
            <FaBars className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={[
          "md:hidden border-t bg-white transition-[max-height] duration-200 ease-out overflow-hidden",
          navOpen ? "max-h-80" : "max-h-0",
        ].join(" ")}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}

          {/* Auth action (mobile) */}
          {loadingAuth ? (
            <div className="inline-flex items-center rounded-lg px-3 py-2 text-sm text-gray-400">
              …
            </div>
          ) : isAuthed ? (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              onClick={goSignIn}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FaSignInAlt className="h-4 w-4" />
              <span>Sign in</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
