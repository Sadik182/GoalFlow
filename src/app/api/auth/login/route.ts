import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "auth_token";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");
    const emailLc = String(email).toLowerCase();

    const user = await users.findOne({ email: emailLc });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user._id.toString(), name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const resp = NextResponse.json({ ok: true });
    resp.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return resp;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
