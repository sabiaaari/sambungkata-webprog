import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomCode, username, word } = body;

    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: { players: true }
    });

    if (!room) {
      return Response.json({ error: "Room tidak ditemukan" }, { status: 404 });
    }

    if (room.status !== "playing") {
      return Response.json({ error: "Game belum dimulai" }, { status: 400 });
    }

    const players = room.players;
    const currentPlayer = players[room.turnIndex];

    // cek giliran
    if (!currentPlayer || currentPlayer.username !== username) {
      return Response.json({ error: "Bukan giliran kamu" }, { status: 403 });
    }

    // cek dictionary
    const dict = await prisma.dictionary.findUnique({
      where: { word }
    });

    if (!dict) {
      return Response.json({ error: "Kata tidak valid" }, { status: 400 });
    }

    // cek sambung kata
    if (room.currentWord) {
      const lastChar = room.currentWord.slice(-1);
      const firstChar = word[0];

      if (lastChar !== firstChar) {
        return Response.json({ error: "Tidak nyambung" }, { status: 400 });
      }
    }

    // update score player
    await prisma.player.updateMany({
      where: {
        username,
        roomId: room.id
      },
      data: {
        score: { increment: 1 }
      }
    });

    // next turn
    const nextTurn = (room.turnIndex + 1) % players.length;

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        currentWord: word,
        turnIndex: nextTurn
      }
    });

    return Response.json({
      success: true,
      nextPlayer: players[nextTurn]?.username,
      currentWord: word,
      room: updatedRoom
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed play word" },
      { status: 500 }
    );
  }
}