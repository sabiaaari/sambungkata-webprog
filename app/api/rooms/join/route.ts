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

    // Check if room is in waiting status
    if (room.status !== "waiting") {
      return Response.json({ error: "Maaf, Ruangan ini sudah penuh atau sedang bermain!" }, { status: 400 });
    }

    // Check room capacity
    const playerCount = await prisma.player.count({
      where: { roomId: room.id }
    });

    if (playerCount >= 2) {
      return Response.json({ error: "Maaf, Ruangan ini sudah penuh atau sedang bermain!" }, { status: 400 });
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