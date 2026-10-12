import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ activeNav, onSelectNav, onExport, children }) {
  return (
    <div className="app-shell">
      <Header onExport={onExport} />
      <div className="app-body">
        <Sidebar activeNav={activeNav} onSelectNav={onSelectNav} />
        <main className="main-viewport">{children}</main>
      </div>
    </div>
  );
}
