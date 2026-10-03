'use client';

import { usePathname } from 'next/navigation';

export default function Topbar() {
    const pathname = usePathname();
    
    let title = 'Floor Selection Dashboard - BINUS @Medan';
    if (pathname === '/floor-management') title = 'Floor Management';
    if (pathname === '/personnel-registry') title = 'Personnel Registry';
    if (pathname === '/incident-logs') title = 'Incident Logs';

    return (
        <header className="topbar">
            <h2 className="topbar-title">{title}</h2>
            <div className="topbar-actions">
                {/* Actions removed as requested previously */}
            </div>
        </header>
    );
}
