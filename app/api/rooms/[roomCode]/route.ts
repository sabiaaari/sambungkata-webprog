import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;

    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: { players: true }
    });

    return Response.json(room);

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed get room" },
      { status: 500 }
    );
  }
}