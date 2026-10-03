'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileView from './MobileView';

export default function DashboardLayout({ children }) {
    return (
        <>
            {/* Desktop Layout */}
            <div className="desktop-layout">
                <div className="app-container">
                    <Sidebar />
                    <main className="main-content">
                        <Topbar />
                        <div className="dashboard-body">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="mobile-layout">
                <MobileView />
            </div>
        </>
    );
}
