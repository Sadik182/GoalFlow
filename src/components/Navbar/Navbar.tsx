"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars, FaTimes, FaHome, FaChartBar, FaCog } from "react-icons/fa";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Dashboard", Icon: FaHome },
    { href: "/reports", label: "Reports", Icon: FaChartBar },
    { href: "/settings", label: "Settings", Icon: FaCog },
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
        {/* Active underline */}
        <span
          className={[
            "pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-600 transition-opacity",
            active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
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
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {open ? (
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
          open ? "max-h-64" : "max-h-0",
        ].join(" ")}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </nav>
      </div>
    </header>
  );
}
