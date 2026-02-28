import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HotelDashboard from "./components/HotelDashboard";
import RoomManagement from "./components/RoomManagement";
import BookingManagement from "./components/BookingManagement";
import GuestManagement from "./components/GuestManagement";
import Reports from "./components/Reports";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HotelDashboard />} />
        <Route path="/rooms" element={<RoomManagement />} />
        <Route path="/bookings" element={<BookingManagement />} />
        <Route path="/guests" element={<GuestManagement />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
