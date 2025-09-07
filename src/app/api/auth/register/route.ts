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
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { ok: false, error: "All fields required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    // Ensure unique index (safe to call repeatedly)
    await users.createIndex({ email: 1 }, { unique: true });

    const emailLc = String(email).toLowerCase();
    const existing = await users.findOne({ email: emailLc });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const doc = {
      name: name.trim(),
      email: emailLc,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const res = await users.insertOne(doc);

    // Issue JWT
    const token = jwt.sign(
      { userId: res.insertedId.toString(), name: doc.name, email: doc.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const resp = NextResponse.json(
      { ok: true, userId: res.insertedId.toString() },
      { status: 201 }
    );
    resp.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return resp;
  } catch (e: any) {
    // Handle duplicate key error from unique index
    if (e?.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "Email already in use" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
