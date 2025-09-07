import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
type SessionPayload = JwtPayload & {
  userId: string;
  name: string;
  email: string;
};

/**
 * Reads the user from the auth_token cookie. Next 15+: cookies() is async.
 */
export async function getUserFromCookie(): Promise<SessionPayload | null> {
  const store = await cookies(); // ✅ await here
  const token = store.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
