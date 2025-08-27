"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={
          "px-3 py-2 rounded-md text-sm font-medium transition " +
          (active
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-gray-100">
      <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="font-semibold text-lg tracking-tight">
          GoalFlow
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/reports" label="Reports" />
          <NavLink href="/settings" label="Settings" />
        </nav>
      </div>
    </header>
  );
}
