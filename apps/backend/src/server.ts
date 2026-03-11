import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

// Import routers
import roomRouter from "./modules/rooms/rooms.router";
import guestRouter from "./modules/guests/guests.router";
import bookingRouter from "./modules/bookings/bookings.router";

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Hotel Management System API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount business route modules
app.use("/api/rooms", roomRouter);
app.use("/api/guests", guestRouter);
app.use("/api/bookings", bookingRouter);

// Dashboard stats endpoint
app.get("/api/dashboard", async (_req: Request, res: Response) => {
  try {
    // Import prisma here to avoid circular dependency
    const { default: prisma } = await import("./lib/prisma");

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalGuests,
      totalBookings,
      pendingBookings,
      recentBookings,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "AVAILABLE" } }),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.guest.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { guest: true, roomType: true },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      totalGuests,
      totalBookings,
      pendingBookings,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        guestName: b.guest.name,
        roomType: b.roomType.name,
        checkInDate: b.checkInDate.toISOString().split("T")[0],
        checkOutDate: b.checkOutDate.toISOString().split("T")[0],
        status: b.status,
      })),
    });
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;