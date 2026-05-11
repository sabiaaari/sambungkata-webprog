import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { roomCode } = await req.json();

    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: { players: true }
    });

    if (!room) {
      return Response.json({ error: "Room tidak ada" }, { status: 404 });
    }

    // 🔥 INI YANG SEBELUMNYA BIKIN ERROR
    if (room.players.length < 2) {
      return Response.json({
        error: "Minimal 2 player",
        debug: room.players
      }, { status: 400 });
    }

    const words = await prisma.dictionary.findMany();
    let initialWord = "MEJA MAKAN"; // Default fallback
    
    if (words.length > 0) {
      const random = words[Math.floor(Math.random() * words.length)];
      initialWord = random.word;
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "playing",
        currentWord: initialWord,
        turnIndex: 0
      }
    });

    return Response.json({
      message: "Game started",
      room: updated
    });

  } catch (error: any) {
    console.error(error);
    return Response.json(
      { error: "Start failed" },
      { status: 500 }
    );
  }
}