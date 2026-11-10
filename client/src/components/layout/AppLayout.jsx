import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const AppLayout = () => (
  <div className="app-layout">
    <Navbar />
    <div className="app-body">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
    <MobileNav />
  </div>
);

export default AppLayout;
