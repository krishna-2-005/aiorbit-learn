import "server-only";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { conflict } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import type { SignupInput } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both paths take the same time.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Qp6r2cH2vY2G5a6.8m0iBv2QeXGS";

export type PublicUser = { id: string; name: string; email: string };

export async function createUser(input: SignupInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    return await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("An account with this email already exists. Log in instead.");
    }
    throw error;
  }
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return null;
  return { id: user.id, name: user.name, email: user.email };
}
