import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await db.user.findMany({ take: 5 });
    return NextResponse.json({ count: users.length, users: users.map(u => ({ email: u.email, type: u.userType })) });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
