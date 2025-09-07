import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) return NextResponse.json({ ok: true, user: null });

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email },
    });
  } catch {
    return NextResponse.json({ ok: true, user: null });
  }
}
