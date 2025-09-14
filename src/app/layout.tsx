import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar";

export const metadata: Metadata = {
  title: "GoalFlow - Manage Your Weekly Goals",
  description:
    "A simple and effective weekly goal management app built with Next.js, MongoDB, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className=" min-h-screen bg-gray-200 text-gray-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
