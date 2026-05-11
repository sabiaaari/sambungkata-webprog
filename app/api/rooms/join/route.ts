import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, roomCode } = await req.json();

    const room = await prisma.room.findUnique({
      where: { roomCode }
    });

    if (!room) {
      return Response.json({ error: "Room tidak ditemukan" }, { status: 404 });
    }

    // 🔥 CREATE PLAYER (INI YANG KAMU KURANG)
    const player = await prisma.player.create({
      data: {
        username,
        roomId: room.id
      }
    });

    return Response.json({
      message: "Join success",
      player,
      room
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Join failed" },
      { status: 500 }
    );
  }
}