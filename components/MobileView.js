'use client';

import { useState } from 'react';
import {
    GearSix,
    Warning,
    ArrowCounterClockwise,
    CheckCircle,
} from '@phosphor-icons/react';
import FloorDetail from './FloorDetail';
import { useAppContext } from '../context/AppContext';

function TileIcon({ icon }) {
    if (!icon) return null;

    switch (icon) {
        case 'check':
            return (
                <div className="m-tile-icon m-tile-icon--green">
                    <CheckCircle weight="fill" />
                </div>
            );
        case 'warning':
            return (
                <div className="m-tile-icon m-tile-icon--warning">
                    <Warning weight="fill" />
                </div>
            );
        case 'refresh':
            return (
                <div className="m-tile-icon m-tile-icon--orange">
                    <ArrowCounterClockwise weight="bold" />
                </div>
            );
        default:
            return null;
    }
}

function MobileTile({ data, onClick }) {
    let borderClass = 'm-tile';
    if (data.borderStyle === 'red') borderClass += ' m-tile--border-red';
    else if (data.borderStyle === 'orange') borderClass += ' m-tile--border-orange';
    else if (data.borderStyle === 'green-left') borderClass += ' m-tile--border-green-left';

    const pad = (num) => String(num).padStart(2, '0');

    return (
        <div className={borderClass} onClick={() => onClick(data)}>
            {/* Big faded floor number */}
            <span className="m-tile-floor-num">{data.floor}</span>

            {data.type === 'name-only' ? (
                <span className="m-tile-warden-vertical">{data.warden || 'Tanpa Warden'}</span>
            ) : (
                <div className="m-tile-stats-content">
                    <div className="m-tile-stats">
                        <div className="m-stat-line">
                            <span className="m-stat-val">{pad(data.m)}</span>
                            <span className="m-stat-lbl m-stat-lbl--m">M</span>
                        </div>
                        <div className="m-stat-line">
                            <span className="m-stat-val">{pad(data.dk)}</span>
                            <span className="m-stat-lbl m-stat-lbl--dk">DK</span>
                        </div>
                        <div className="m-stat-line">
                            <span className="m-stat-val">{pad(data.oc)}</span>
                            <span className="m-stat-lbl m-stat-lbl--oc">OC</span>
                        </div>
                    </div>
                    <span className="m-tile-warden-bottom">{data.warden || 'Tanpa Warden'}</span>
                </div>
            )}

            <TileIcon icon={data.icon} />
        </div>
    );
}

export default function MobileView() {
    const { floors } = useAppContext();
    const [selectedFloor, setSelectedFloor] = useState(null);

    // Map Supabase floors to the format MobileTile expects
    const mobileTilesData = floors.map(f => {
        let type = 'name-only';
        let borderStyle = 'default';
        let icon = null;

        if (f.status === 'clear') {
            if (f.m > 0 || f.dk > 0 || f.oc > 0) {
               type = 'stats';
               borderStyle = 'green-left';
               icon = 'check';
            } else {
               type = 'name-only';
               borderStyle = 'default';
            }
        } else if (f.status === 'reporting') {
            type = 'stats';
            borderStyle = 'orange';
            icon = 'refresh';
        } else if (f.status === 'unreported') {
            type = 'name-only';
            borderStyle = 'red';
            icon = 'warning';
        }

        return {
            id: f.id,
            floor: f.floor_number,
            name: f.name,
            warden: f.warden,
            m: f.m,
            dk: f.dk,
            oc: f.oc,
            status: f.status,
            type,
            borderStyle,
            icon
        };
    });

    const totalM = mobileTilesData.reduce((acc, curr) => acc + (parseInt(curr.m) || 0), 0);
    const totalDK = mobileTilesData.reduce((acc, curr) => acc + (parseInt(curr.dk) || 0), 0);
    const totalOC = mobileTilesData.reduce((acc, curr) => acc + (parseInt(curr.oc) || 0), 0);

    if (selectedFloor !== null) {
        return (
            <FloorDetail
                floorData={selectedFloor}
                onBack={() => setSelectedFloor(null)}
            />
        );
    }

    return (
        <div className="mobile-view">
            {/* Header */}
            <header className="m-header">
                <span className="m-logo">B-Safe</span>
                <div className="m-header-icons">
                    <GearSix size={24} />
                    <img
                        src="https://i.pravatar.cc/80?img=47"
                        alt="Profile"
                        className="m-avatar"
                    />
                </div>
            </header>

            {/* Title */}
            <div className="m-title-section">
                <h1 className="m-title">Pilih Lantai Evakuasi</h1>
                <p className="m-subtitle">BINUS @Medan - Gedung Utama</p>
            </div>

            {/* Divider */}
            <hr className="m-divider" />

            {/* Floor Grid */}
            <div className="m-grid">
                {mobileTilesData.map((tile) => (
                    <MobileTile
                        key={tile.id}
                        data={tile}
                        onClick={setSelectedFloor}
                    />
                ))}
            </div>

            {/* Fixed Bottom Navbar for Totals */}
            <div className="m-bottom-nav">
                <div className="m-bottom-stat">
                    <span className="m-bottom-title">MAHASISWA</span>
                    <span className="m-bottom-val val-m">{totalM}</span>
                </div>
                <div className="m-bottom-divider"></div>
                <div className="m-bottom-stat">
                    <span className="m-bottom-title">STAF</span>
                    <span className="m-bottom-val val-dk">{totalDK}</span>
                </div>
                <div className="m-bottom-divider"></div>
                <div className="m-bottom-stat">
                    <span className="m-bottom-title">OUTSOURCING</span>
                    <span className="m-bottom-val val-oc">{totalOC}</span>
                </div>
            </div>
        </div>
    );
}
