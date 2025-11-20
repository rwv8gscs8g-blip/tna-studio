import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name =
    typeof body?.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : undefined;
  const password =
    typeof body?.password === "string" && body.password.length >= 8
      ? body.password
      : undefined;

  if (!name && !password) {
    return NextResponse.json(
      { error: "Envie ao menos um campo para atualizar." },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data,
  });

  return NextResponse.json({ ok: true });
}

