import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mapStatusToFrontend = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "待确认",
    CONFIRMED: "已确认",
    CHECKED_IN: "已入住",
    CHECKED_OUT: "已退房",
    CANCELLED: "已取消",
    NO_SHOW: "未入住",
  };
  return map[status] || status;
};

const mapStatusFromFrontend = (status: string): string => {
  const map: Record<string, string> = {
    "待确认": "PENDING",
    "已确认": "CONFIRMED",
    "已入住": "CHECKED_IN",
    "已退房": "CHECKED_OUT",
    "已取消": "CANCELLED",
  };
  return map[status] || "PENDING";
};

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/bookings - Get all bookings
router.get("/", async (_req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { guest: true, roomType: true },
      orderBy: { createdAt: "desc" },
    });

    const transformed = bookings.map((b) => ({
      id: b.id,
      guestName: b.guest.name,
      guestPhone: b.guest.phone || "",
      roomNumber: "",
      roomType: b.roomType.name,
      checkInDate: b.checkInDate.toISOString().split("T")[0],
      checkOutDate: b.checkOutDate.toISOString().split("T")[0],
      adults: b.adults,
      children: b.children,
      status: mapStatusToFrontend(b.status),
      totalPrice: b.totalPrice,
      specialRequests: b.specialRequests || "",
      createdAt: b.createdAt.toISOString().split("T")[0],
    }));

    res.json(transformed);
  } catch (error) {
    console.error("[Bookings] Get all error:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/:id - Get single booking
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { guest: true, roomType: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (error) {
    console.error("[Bookings] Get one error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST /api/bookings - Create booking
router.post("/", async (req: Request, res: Response) => {
  try {
    const { guestName, guestPhone, roomType, checkInDate, checkOutDate, adults, children, status, specialRequests, totalPrice } = req.body;

    let guest = await prisma.guest.findFirst({ where: { phone: guestPhone } });
    if (!guest) {
      guest = await prisma.guest.create({ data: { name: guestName, phone: guestPhone } });
    }

    const roomTypeObj = await prisma.roomType.findFirst({ where: { name: roomType } });
    if (!roomTypeObj) {
      return res.status(400).json({ error: "Room type not found" });
    }

    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        roomTypeId: roomTypeObj.id,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        adults: adults || 1,
        children: children || 0,
        totalPrice: totalPrice || 0,
        status: mapStatusFromFrontend(status || "待确认"),
        specialRequests,
      },
      include: { guest: true, roomType: true },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("[Bookings] Create error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// PUT /api/bookings/:id - Update booking
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate, adults, children, status, specialRequests, totalPrice } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(checkInDate && { checkInDate: new Date(checkInDate) }),
        ...(checkOutDate && { checkOutDate: new Date(checkOutDate) }),
        ...(adults !== undefined && { adults }),
        ...(children !== undefined && { children }),
        ...(status && { status: mapStatusFromFrontend(status) }),
        ...(specialRequests !== undefined && { specialRequests }),
        ...(totalPrice !== undefined && { totalPrice }),
      },
      include: { guest: true, roomType: true },
    });
    res.json(booking);
  } catch (error) {
    console.error("[Bookings] Update error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// PUT /api/bookings/:id/cancel - Cancel booking
router.put("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { guest: true, roomType: true },
    });
    res.json(booking);
  } catch (error) {
    console.error("[Bookings] Cancel error:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("[Bookings] Delete error:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;