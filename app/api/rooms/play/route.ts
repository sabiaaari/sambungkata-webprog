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

    // Validasi: Harus 1 kata
    if (lowerWord.includes(' ')) {
       return Response.json({ error: "Hanya boleh 1 kata" }, { status: 400 });
    }

    // cek dictionary
    const dict = await prisma.dictionary.findUnique({
      where: { word: lowerWord }
    });

    if (!dict) {
      return Response.json({ error: `Kata "${word}" tidak ada di database` }, { status: 400 });
    }

    // cek duplikasi
    if (room.usedWords.includes(lowerWord)) {
      return Response.json({ error: `Kata "${word.toUpperCase()}" sudah pernah digunakan` }, { status: 400 });
    }

    // cek sambung kata (Last Letter Logic)
    if (room.currentWord) {
      const lastChar = room.currentWord.toLowerCase().trim().slice(-1);
      const firstChar = lowerWord.charAt(0);

      if (firstChar !== lastChar) {
        return Response.json({ error: `Kata harus berawalan huruf "${lastChar.toUpperCase()}"` }, { status: 400 });
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
        currentWord: lowerWord,
        usedWords: {
          push: lowerWord
        },
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