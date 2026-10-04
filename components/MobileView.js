'use client';

import { useState } from 'react';
import {
    ShieldCheck,
    CheckCircle,
    WarningCircle,
    ArrowsClockwise,
    CaretRight,
} from '@phosphor-icons/react';
import FloorDetail from './FloorDetail';
import InitialsAvatar from './InitialsAvatar';
import { useAppContext } from '../context/AppContext';

const BUILDING_NAME = 'BINUS @Medan - Gedung Utama';

// Konfigurasi tampilan per status lantai
const STATUS_META = {
    clear: { label: 'Aman', Icon: CheckCircle },
    reporting: { label: 'Melapor', Icon: ArrowsClockwise },
    unreported: { label: 'Belum Lapor', Icon: WarningCircle },
};

// "Floor 9" -> "9", "Lantai L" -> "L"
function floorShortLabel(floor) {
    const short = (floor.name || '').replace(/^(floor|lantai)\s*/i, '').trim();
    return short || String(floor.floor_number ?? '?');
}

function FloorTile({ floor, onSelect }) {
    const status = STATUS_META[floor.status] ? floor.status : 'unreported';
    const { label, Icon } = STATUS_META[status];
    const hasReport = status !== 'unreported' || floor.m > 0 || floor.dk > 0 || floor.oc > 0;
    const shortLabel = floorShortLabel(floor);

    return (
        <button
            type="button"
            className={`mv-tile mv-tile--${status}`}
            onClick={() => onSelect(floor)}
            aria-label={`${floor.name}, status ${label}, warden ${floor.warden || 'belum ada'}`}
        >
            <div className="mv-tile-top">
                <div className="mv-tile-floor">
                    <span className="mv-tile-floor-label">Lantai</span>
                    <span className="mv-tile-floor-num">{shortLabel}</span>
                </div>
                <span className={`mv-status mv-status--${status}`}>
                    <Icon weight="fill" aria-hidden="true" />
                    {label}
                </span>
            </div>

            <div className="mv-tile-counts">
                <div className="mv-count">
                    <span className="mv-count-val">{hasReport ? floor.m : '–'}</span>
                    <span className="mv-count-lbl mv-count-lbl--m">M</span>
                </div>
                <div className="mv-count">
                    <span className="mv-count-val">{hasReport ? floor.dk : '–'}</span>
                    <span className="mv-count-lbl mv-count-lbl--dk">DK</span>
                </div>
                <div className="mv-count">
                    <span className="mv-count-val">{hasReport ? floor.oc : '–'}</span>
                    <span className="mv-count-lbl mv-count-lbl--oc">OC</span>
                </div>
            </div>

            <div className="mv-tile-warden">
                <InitialsAvatar name={floor.warden} size={22} />
                <span className={floor.warden ? '' : 'mv-tile-warden--empty'}>
                    {floor.warden || 'Belum ada warden'}
                </span>
                <CaretRight className="mv-tile-caret" aria-hidden="true" />
            </div>
        </button>
    );
}

export default function MobileView() {
    const { floors } = useAppContext();
    const [selectedFloorId, setSelectedFloorId] = useState(null);

    // Ambil data terbaru dari context (bukan snapshot) agar realtime ikut ter-update
    const selectedFloor = floors.find(f => f.id === selectedFloorId);

    if (selectedFloor) {
        return (
            <FloorDetail
                floorData={{ ...selectedFloor, label: floorShortLabel(selectedFloor) }}
                onBack={() => setSelectedFloorId(null)}
            />
        );
    }

    const toNum = (v) => parseInt(v) || 0;
    const totalM = floors.reduce((acc, f) => acc + toNum(f.m), 0);
    const totalDK = floors.reduce((acc, f) => acc + toNum(f.dk), 0);
    const totalOC = floors.reduce((acc, f) => acc + toNum(f.oc), 0);
    const grandTotal = totalM + totalDK + totalOC;

    const countBy = (status) => floors.filter(f => f.status === status).length;
    const clearCount = countBy('clear');
    const reportingCount = countBy('reporting');
    const unreportedCount = floors.length - clearCount - reportingCount;
    const progress = floors.length ? Math.round((clearCount / floors.length) * 100) : 0;

    return (
        <div className="mobile-view">
            {/* Header */}
            <header className="mv-header">
                <div className="mv-brand">
                    <ShieldCheck weight="fill" className="mv-brand-icon" aria-hidden="true" />
                    <div className="mv-brand-text">
                        <span className="mv-logo">B-Safe</span>
                        <span className="mv-logo-sub">Emergency Response</span>
                    </div>
                </div>
                <span className="mv-live" aria-label="Data realtime">
                    <span className="mv-live-dot" aria-hidden="true"></span>
                    LIVE
                </span>
            </header>

            {/* Intro + progress */}
            <section className="mv-intro">
                <p className="mv-eyebrow">{BUILDING_NAME}</p>
                <h1 className="mv-title">Pilih Lantai Evakuasi</h1>

                <div className="mv-progress-card">
                    <div className="mv-progress-head">
                        <span>Progres Sweeping</span>
                        <strong>{clearCount}/{floors.length} lantai aman</strong>
                    </div>
                    <div
                        className="mv-progress-bar"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Persentase lantai aman"
                    >
                        <span style={{ width: `${progress}%` }}></span>
                    </div>
                    <div className="mv-legend">
                        <span><i className="mv-dot mv-dot--clear"></i>Aman {clearCount}</span>
                        <span><i className="mv-dot mv-dot--reporting"></i>Melapor {reportingCount}</span>
                        <span><i className="mv-dot mv-dot--unreported"></i>Belum {unreportedCount}</span>
                    </div>
                </div>
            </section>

            {/* Floor Grid */}
            <section className="mv-grid" aria-label="Daftar lantai">
                {floors.map((floor) => (
                    <FloorTile key={floor.id} floor={floor} onSelect={(f) => setSelectedFloorId(f.id)} />
                ))}
                {floors.length === 0 && (
                    <p className="mv-empty">Belum ada lantai terdaftar.</p>
                )}
            </section>

            {/* Fixed bottom totals */}
            <nav className="mv-totals" aria-label="Total dievakuasi">
                <div className="mv-totals-head">
                    <span>Total Dievakuasi</span>
                    <strong>{grandTotal} orang</strong>
                </div>
                <div className="mv-totals-row">
                    <div className="mv-total">
                        <span className="mv-total-val val-m">{totalM}</span>
                        <span className="mv-total-lbl">Mahasiswa</span>
                    </div>
                    <div className="mv-total">
                        <span className="mv-total-val val-dk">{totalDK}</span>
                        <span className="mv-total-lbl">Staf</span>
                    </div>
                    <div className="mv-total">
                        <span className="mv-total-val val-oc">{totalOC}</span>
                        <span className="mv-total-lbl">Outsourcing</span>
                    </div>
                </div>
            </nav>
        </div>
    );
}
