import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ROOM_CODE_LENGTH = 4;
const MAX_RETRIES = 10;

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CHARSET[randomInt(0, CHARSET.length)];
  }
  return code;
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const roomCode = generateRoomCode();

    const exists = await prisma.room.findUnique({
      where: { roomCode },
      select: { id: true },
    });

    if (!exists) return roomCode;
  }

  throw new Error("Gagal membuat roomCode unik setelah beberapa percobaan");
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json().catch(() => ({}));

    const roomCode = await createUniqueRoomCode();

    const room = await prisma.room.create({
      data: {
        roomCode,
        status: "waiting",
        players: username ? {
          create: {
            username
          }
        } : undefined
      },
      include: {
        players: true
      }
    });

    return Response.json(room);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed create room" },
      { status: 500 }
    );
  }
}
