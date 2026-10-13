'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    WarningCircle,
    ArrowsClockwise,
    Student,
    UsersFour,
    HardHat,
    Minus,
    Plus,
} from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';
import InitialsAvatar from './InitialsAvatar';

const COUNTERS = [
    { key: 'm', title: 'Mahasiswa', subtitle: 'Students evacuated', Icon: Student, tone: 'm' },
    { key: 'dk', title: 'Dosen / Karyawan', subtitle: 'Staff evacuated', Icon: UsersFour, tone: 'dk' },
    { key: 'oc', title: 'Outsourcing / Carefast', subtitle: 'Personnel evacuated', Icon: HardHat, tone: 'oc' },
];

const STATUS_META = {
    clear: { label: 'Aman', Icon: CheckCircle },
    reporting: { label: 'Sedang Melapor', Icon: ArrowsClockwise },
    unreported: { label: 'Belum Lapor', Icon: WarningCircle },
};

export default function FloorDetail({ floorData, onBack }) {
    const { markFloorReporting, updateFloorCounts } = useAppContext();
    const [counts, setCounts] = useState({
        m: floorData?.m || 0,
        dk: floorData?.dk || 0,
        oc: floorData?.oc || 0,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [syncError, setSyncError] = useState('');

    // Satu request reporting per sesi edit. Promise ini juga ditunggu sebelum submit
    // supaya request reporting yang lambat tidak menimpa status final "clear".
    const reportingRequestRef = useRef(null);

    const floorId = floorData?.id;
    const floorLabel = floorData?.label || floorData?.floor_number || '?';

    // Status yang ditampilkan: jika user mengubah angka, dianggap sedang melapor
    const status = saved ? 'clear' : isDirty ? 'reporting' : (floorData?.status || 'unreported');
    const { label: statusLabel, Icon: StatusIcon } = STATUS_META[status] || STATUS_META.unreported;

    const beginReporting = useCallback(() => {
        if (!floorId) {
            return Promise.resolve({ error: new Error('Floor ID tidak tersedia.') });
        }

        if (!reportingRequestRef.current) {
            const request = markFloorReporting(floorId)
                .catch(error => ({ error }));
            reportingRequestRef.current = request;

            // Jika gagal, izinkan efek, klik berikutnya, atau submit untuk mencoba ulang.
            void request.then(({ error }) => {
                if (error && reportingRequestRef.current === request) {
                    reportingRequestRef.current = null;
                }
            });
        }

        return reportingRequestRef.current;
    }, [floorId, markFloorReporting]);

    // Begitu staf membuka halaman perhitungan, bagikan status proses ke dashboard admin.
    useEffect(() => {
        let active = true;

        void beginReporting().then(({ error }) => {
            if (active && error) {
                setSyncError('Status proses belum tersinkron. Periksa koneksi lalu coba lagi.');
            }
        });

        return () => {
            active = false;
        };
    }, [beginReporting]);

    const change = (key, delta) => {
        setCounts(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
        setIsDirty(true);
        setSaved(false);
        setSyncError('');

        // Count masih berupa draft lokal. Pemanggilan ini hanya memastikan status proses
        // tersinkron jika request awal saat halaman dibuka sempat gagal.
        void beginReporting().then(({ error }) => {
            if (error) {
                setSyncError('Status proses belum tersinkron. Periksa koneksi lalu coba lagi.');
            }
        });
    };

    const total = counts.m + counts.dk + counts.oc;
    const pad = (num) => String(num).padStart(2, '0');

    const handleClear = async () => {
        if (!floorData?.id || saving) return;
        setSaving(true);
        setSyncError('');

        // Selalu selesaikan write "reporting" terlebih dahulu untuk mencegah race condition.
        const { error: reportingError } = await beginReporting();
        if (reportingError) {
            setSaving(false);
            setSyncError('Gagal menyinkronkan status proses. Silakan coba simpan kembali.');
            return;
        }

        const { error } = await updateFloorCounts(
            floorData.id,
            counts.m,
            counts.dk,
            counts.oc,
            'clear'
        );
        setSaving(false);

        if (error) {
            setSyncError('Headcount gagal disimpan. Data Anda masih ada, silakan coba lagi.');
            return;
        }

        setSaved(true);
        setIsDirty(false);
        // Kembali ke daftar setelah menampilkan status sukses sebentar
        setTimeout(onBack, 900);
    };

    return (
        <div className="fd-page">
            {/* Header */}
            <header className="fd-header">
                <button className="fd-back-btn" onClick={onBack} aria-label="Kembali ke daftar lantai">
                    <ArrowLeft size={22} weight="bold" />
                </button>
                <div className="fd-header-text">
                    <h1 className="fd-header-title">Lantai {floorLabel}</h1>
                    <div className="fd-header-warden">
                        <InitialsAvatar name={floorData?.warden} size={18} />
                        <span>{floorData?.warden || 'Belum ada warden'}</span>
                    </div>
                </div>
                <span className={`mv-status mv-status--${status}`}>
                    <StatusIcon weight="fill" aria-hidden="true" />
                    {statusLabel}
                </span>
            </header>

            {/* Counter Cards */}
            <main className="fd-cards">
                {COUNTERS.map(({ key, title, subtitle, Icon, tone }) => (
                    <section key={key} className="fd-card" aria-label={title}>
                        <div className="fd-card-header">
                            <div className={`fd-card-icon fd-card-icon--${tone}`}>
                                <Icon size={22} weight="duotone" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="fd-card-title">{title}</h2>
                                <p className="fd-card-subtitle">{subtitle}</p>
                            </div>
                        </div>
                        <div className="fd-counter">
                            <button
                                className="fd-counter-btn fd-counter-btn--minus"
                                onClick={() => change(key, -1)}
                                disabled={counts[key] === 0 || saving}
                                aria-label={`Kurangi ${title}`}
                            >
                                <Minus size={22} weight="bold" />
                            </button>
                            <span className="fd-counter-value" aria-live="polite">{pad(counts[key])}</span>
                            <button
                                className="fd-counter-btn fd-counter-btn--plus"
                                onClick={() => change(key, 1)}
                                disabled={saving}
                                aria-label={`Tambah ${title}`}
                            >
                                <Plus size={22} weight="bold" />
                            </button>
                        </div>
                    </section>
                ))}
            </main>

            {/* Sticky action bar */}
            <div className="fd-bottom">
                <div className="fd-summary">
                    <span>Total di lantai ini</span>
                    <strong>{total} orang</strong>
                </div>
                {syncError && <p className="fd-sync-error" role="alert">{syncError}</p>}
                <button
                    className={`fd-clear-btn ${saved ? 'fd-clear-btn--active' : ''}`}
                    onClick={handleClear}
                    disabled={saving || saved}
                >
                    <CheckCircle size={24} weight="fill" aria-hidden="true" />
                    <div className="fd-clear-text">
                        <span className="fd-clear-main">
                            {saving ? 'Menyimpan...' : saved ? 'Tersimpan' : `Lantai ${floorLabel} Aman`}
                        </span>
                        <span className="fd-clear-sub">
                            {saved ? 'Kembali ke daftar lantai...' : 'Tandai area ini sudah disweep'}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
