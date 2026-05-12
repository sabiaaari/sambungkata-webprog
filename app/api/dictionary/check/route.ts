import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word) {
      return Response.json({ error: "Word is required" }, { status: 400 });
    }

    const lowerWord = word.toLowerCase().trim();

    const entry = await prisma.dictionary.findUnique({
      where: { word: lowerWord },
    });

    if (!entry) {
      return Response.json({ valid: false, error: "Kata tidak ditemukan di database" }, { status: 404 });
    }

    return Response.json({ valid: true });
  } catch (error) {
    console.error("Dictionary Check Error:", error);
    return Response.json({ error: "Failed to check dictionary" }, { status: 500 });
  }
}
