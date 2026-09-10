import { auth } from "@/app/(auth)/auth";
import { getReservationById, updateReservation } from "@/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reservation = await getReservationById({ id });

    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(reservation);
  } catch (error) {
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reservation = await getReservationById({ id });

    if (!reservation) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (reservation.hasCompletedPayment) {
      return Response.json({ error: "Reservation is already paid" }, { status: 409 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { magicWord } = body;

    if (!magicWord || typeof magicWord !== "string" || magicWord.toLowerCase() !== "vercel") {
      return Response.json({ error: "Invalid magic word!" }, { status: 400 });
    }

    const updatedReservation = await updateReservation({
      id,
      hasCompletedPayment: true,
    });
    return Response.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation:", error);
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
