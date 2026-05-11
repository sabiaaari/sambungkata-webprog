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

    // normalisasi kata
    const lowerWord = word.toLowerCase().trim();

    // cek dictionary
    const dict = await prisma.dictionary.findUnique({
      where: { word: lowerWord }
    });

    if (!dict) {
      return Response.json({ error: `Kata "${word}" tidak ada di database` }, { status: 400 });
    }

    // cek sambung kata (Word Chain Logic)
    if (room.currentWord) {
      const currentWords = room.currentWord.toLowerCase().split(' ');
      const inputWords = lowerWord.split(' ');

      // Validasi: Harus 2 kata (sesuai logic frontend)
      if (inputWords.length < 2) {
         return Response.json({ error: "Minimal 2 kata" }, { status: 400 });
      }

      // Kata pertama input harus sama dengan kata terakhir (kata kedua) currentWord
      if (inputWords[0] !== currentWords[currentWords.length - 1]) {
        return Response.json({ error: `Kata pertama harus "${currentWords[currentWords.length - 1].toUpperCase()}"` }, { status: 400 });
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