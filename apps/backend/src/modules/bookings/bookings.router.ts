import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW";
type OrderStatus = "REGISTERED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mapStatusToFrontend = (status: BookingStatus): string => {
  const map: Record<BookingStatus, string> = {
    PENDING: "待确认",
    CONFIRMED: "已确认",
    CHECKED_IN: "已入住",
    CHECKED_OUT: "已退房",
    CANCELLED: "已取消",
    NO_SHOW: "未入住",
  };
  return map[status] || status;
};

const mapStatusFromFrontend = (status: string): BookingStatus => {
  const map: Record<string, BookingStatus> = {
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
      include: {
        guest: true,
        roomType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to frontend format
    const transformed = bookings.map((b) => {
      const checkIn = b.checkInDate.toISOString().split("T")[0];
      const checkOut = b.checkOutDate.toISOString().split("T")[0];
      return {
        id: b.id,
        guestName: b.guest.name,
        guestPhone: b.guest.phone || "",
        roomNumber: "", // Will be filled from Order if checked in
        roomType: b.roomType.name as "标准间" | "豪华间" | "套房" | "总统套房",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: b.adults,
        children: b.children,
        status: mapStatusToFrontend(b.status),
        totalPrice: b.totalPrice,
        specialRequests: b.specialRequests || "",
        createdAt: b.createdAt.toISOString().split("T")[0],
      };
    });

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
      include: {
        guest: true,
        roomType: true,
      },
    });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    console.error("[Bookings] Get one error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST /api/bookings - Create booking
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      guestName,
      guestPhone,
      roomNumber,
      roomType,
      checkInDate,
      checkOutDate,
      adults,
      children,
      status,
      specialRequests,
      totalPrice,
    } = req.body;

    // Find or create guest
    let guest = await prisma.guest.findFirst({
      where: { phone: guestPhone },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          phone: guestPhone,
        },
      });
    }

    // Find room type
    const roomTypeObj = await prisma.roomType.findFirst({
      where: { name: roomType },
    });

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
        status: mapStatusFromFrontend(status || "待确认") as BookingStatus,
        specialRequests,
      },
      include: {
        guest: true,
        roomType: true,
      },
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
    const {
      checkInDate,
      checkOutDate,
      adults,
      children,
      status,
      specialRequests,
      totalPrice,
    } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(checkInDate && { checkInDate: new Date(checkInDate) }),
        ...(checkOutDate && { checkOutDate: new Date(checkOutDate) }),
        ...(adults !== undefined && { adults }),
        ...(children !== undefined && { children }),
        ...(status && { status: mapStatusFromFrontend(status) as BookingStatus }),
        ...(specialRequests !== undefined && { specialRequests }),
        ...(totalPrice !== undefined && { totalPrice }),
      },
      include: {
        guest: true,
        roomType: true,
      },
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
      include: {
        guest: true,
        roomType: true,
      },
    });
    res.json(booking);
  } catch (error) {
    console.error("[Bookings] Cancel error:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// POST /api/bookings/:id/checkin - Check in
router.post("/:id/checkin", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roomNumber } = req.body;

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: { status: "CHECKED_IN" },
    });

    // Find the room
    const room = await prisma.room.findUnique({
      where: { number: roomNumber },
    });

    if (!room) {
      return res.status(400).json({ error: "Room not found" });
    }

    // Update room status
    await prisma.room.update({
      where: { id: room.id },
      data: { status: "OCCUPIED" },
    });

    res.json({ message: "Check-in successful" });
  } catch (error) {
    console.error("[Bookings] Check-in error:", error);
    res.status(500).json({ error: "Failed to check in" });
  }
});

// POST /api/bookings/:id/checkout - Check out
router.post("/:id/checkout", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roomNumber } = req.body;

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: { status: "CHECKED_OUT" },
    });

    // Find and update room status
    const room = await prisma.room.findUnique({
      where: { number: roomNumber },
    });

    if (room) {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "CLEANING" },
      });
    }

    res.json({ message: "Check-out successful" });
  } catch (error) {
    console.error("[Bookings] Check-out error:", error);
    res.status(500).json({ error: "Failed to check out" });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.booking.delete({
      where: { id },
    });
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("[Bookings] Delete error:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// GET /api/bookings/stats/summary - Get booking stats
router.get("/stats/summary", async (_req: Request, res: Response) => {
  try {
    const [total, pending, confirmed, checkedIn, revenue] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "CHECKED_IN" } }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

    res.json({
      total,
      pending,
      confirmed,
      checkedIn,
      revenue: revenue._sum.totalPrice || 0,
    });
  } catch (error) {
    console.error("[Bookings] Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;