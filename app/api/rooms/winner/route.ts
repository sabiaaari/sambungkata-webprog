import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { roomCode, winnerName, score } = await req.json();

    if (!roomCode || !winnerName) {
      return Response.json({ error: "Missing data" }, { status: 400 });
    }

    const match = await prisma.matchHistory.create({
      data: {
        roomCode,
        winnerName,
        score: score || 0,
      },
    });

    // Optional: Update room status to 'finished'
    await prisma.room.updateMany({
      where: { roomCode },
      data: { status: "finished" },
    });

    return Response.json({ success: true, match });
  } catch (error) {
    console.error("Save Winner Error:", error);
    return Response.json({ error: "Failed to save winner" }, { status: 500 });
  }
}
