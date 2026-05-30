import { useState, useEffect } from 'react';

export default function AdminHotelBookings() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
      <header className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Global Bookings & Revenue</h1>
        <p className="text-slate-400 font-medium mt-2">Monitor platform-wide bookings, commissions, and payouts.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
         <h2 className="text-2xl font-black text-slate-900">Commission Engine</h2>
         <p className="text-slate-500 font-bold mt-2">Enterprise Module Active. Waiting for enough booking data to generate analytics.</p>
      </div>
    </div>
  );
}
