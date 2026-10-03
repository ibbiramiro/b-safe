'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    SquaresFour,
    Buildings,
    AddressBook,
    Notepad,
    SignOut,
    ShieldCheck,
    Warning
} from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';

const navItems = [
    { label: 'Command Center', icon: SquaresFour, href: '/' },
    { label: 'Floor Management', icon: Buildings, href: '/floor-management' },
    { label: 'Personnel Registry', icon: AddressBook, href: '/personnel-registry' },
    { label: 'Incident Logs', icon: Notepad, href: '/incident-logs' },
];

export default function Sidebar() {
    const { createIncident } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();
    const isPersonnel = pathname === '/personnel-registry';
    const [showConfirm, setShowConfirm] = useState(false);

    const handleConfirmBroadcast = () => {
        createIncident();
        setShowConfirm(false);
        router.push('/incident-logs');
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <div className="brand-logo-wrapper">
                            <ShieldCheck weight="fill" className="brand-shield" />
                            <h1 className="logo">B-Safe</h1>
                        </div>
                        <span className="logo-sub">Emergency Response</span>
                    </div>


                    <nav className="sidebar-nav">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href === pathname;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`nav-item ${isActive ? 'active' : ''} ${isPersonnel && isActive ? 'active-red-bar' : ''}`}
                                >
                                    <Icon weight={isActive ? 'fill' : 'regular'} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="sidebar-bottom">

                    {isPersonnel ? (
                        <Link href="/" className="nav-item nav-bottom-item">
                            <SignOut />
                            <span>Logout</span>
                        </Link>
                    ) : (
                        <>
                            <button className="btn-broadcast" onClick={() => setShowConfirm(true)}>
                                <span>CREATE NEW INCIDENT</span>
                            </button>
                        </>
                    )}
                </div>
            </aside>

            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal-card confirm-modal">
                        <div className="modal-body-centered">
                            <div className="modal-icon-wrapper red-icon-wrapper">
                                <Warning weight="bold" />
                            </div>
                            <h3 className="modal-title">Confirm Broadcast?</h3>
                            <p className="modal-subtitle">
                                You are about to broadcast this incident to all wardens and personnel in the building. This action will trigger emergency protocols.
                            </p>
                        </div>
                        <div className="modal-footer-flex">
                            <button className="btn-modal-cancel" onClick={() => setShowConfirm(false)}>Go Back</button>
                            <button className="btn-modal-confirm" onClick={handleConfirmBroadcast}>Confirm & Broadcast</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
