'use client';

import { useState } from 'react';
import {
    ArrowLeft,
    Warning,
    CheckCircle,
    Users,
    UsersFour,
    HardHat,
    Minus,
    Plus,
} from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';

export default function FloorDetail({ floorData, onBack }) {
    const { updateFloorCounts } = useAppContext();
    const [mahasiswa, setMahasiswa] = useState(floorData?.m || 0);
    const [staff, setStaff] = useState(floorData?.dk || 0);
    const [outsourcing, setOutsourcing] = useState(floorData?.oc || 0);
    const [isCleared, setIsCleared] = useState(floorData?.status === 'clear');

    const increment = (setter, value) => {
        setter(value + 1);
        setIsCleared(false); // If they modify count, it's no longer 'clear' until they submit
    };
    
    const decrement = (setter, value) => {
        if (value > 0) {
            setter(value - 1);
            setIsCleared(false);
        }
    };

    const pad = (num) => String(num).padStart(2, '0');

    const floorLabel = `LANTAI ${floorData?.floor || '?'}`;
    
    const isReporting = !isCleared && (mahasiswa > 0 || staff > 0 || outsourcing > 0 || floorData?.status === 'reporting');

    const handleClear = () => {
        setIsCleared(true);
        // Save to Supabase via AppContext
        if (floorData?.id) {
            updateFloorCounts(floorData.id, mahasiswa, staff, outsourcing, 'clear');
        }
        
        setTimeout(() => {
            onBack();
        }, 1000); // Go back after 1s showing success
    };

    return (
        <div className="fd-page">
            {/* Header */}
            <header className="fd-header">
                <button className="fd-back-btn" onClick={onBack}>
                    <ArrowLeft size={24} weight="bold" />
                </button>
                <h1 className="fd-header-title">
                    B-Safe | <span>{floorLabel}</span>
                </h1>
                <div className="fd-rec-icon">
                    <span className="fd-rec-dot"></span>
                </div>
            </header>

            {/* Status Badge */}
            <div className="fd-status-badge" style={{ 
                visibility: isReporting ? 'visible' : 'hidden',
                background: isCleared ? '#D1FAE5' : '#FEF3C7',
                color: isCleared ? '#065F46' : '#B45309',
                borderColor: isCleared ? '#34D399' : '#FCD34D'
            }}>
                {isCleared ? (
                    <>
                        <CheckCircle size={16} weight="fill" />
                        <span>CLEAR</span>
                    </>
                ) : (
                    <>
                        <Warning size={16} weight="fill" />
                        <span>REPORTING IN PROGRESS</span>
                    </>
                )}
            </div>

            {/* Counter Cards */}
            <div className="fd-cards">
                {/* Mahasiswa */}
                <div className="fd-card">
                    <div className="fd-card-header">
                        <div>
                            <h3 className="fd-card-title">Jumlah Mahasiswa</h3>
                            <p className="fd-card-subtitle">Students Evacuated</p>
                        </div>
                        <div className="fd-card-icon">
                            <Users size={40} weight="duotone" />
                        </div>
                    </div>
                    <div className="fd-counter">
                        <button
                            className="fd-counter-btn fd-counter-btn--minus"
                            onClick={() => decrement(setMahasiswa, mahasiswa)}
                        >
                            <Minus size={24} weight="bold" />
                        </button>
                        <span className="fd-counter-value">{pad(mahasiswa)}</span>
                        <button
                            className="fd-counter-btn fd-counter-btn--plus"
                            onClick={() => increment(setMahasiswa, mahasiswa)}
                        >
                            <Plus size={24} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Dosen/Karyawan */}
                <div className="fd-card">
                    <div className="fd-card-header">
                        <div>
                            <h3 className="fd-card-title">Jumlah Dosen/Karyawan</h3>
                            <p className="fd-card-subtitle">Staff Evacuated</p>
                        </div>
                        <div className="fd-card-icon">
                            <UsersFour size={40} weight="duotone" />
                        </div>
                    </div>
                    <div className="fd-counter">
                        <button
                            className="fd-counter-btn fd-counter-btn--minus"
                            onClick={() => decrement(setStaff, staff)}
                        >
                            <Minus size={24} weight="bold" />
                        </button>
                        <span className="fd-counter-value">{pad(staff)}</span>
                        <button
                            className="fd-counter-btn fd-counter-btn--plus"
                            onClick={() => increment(setStaff, staff)}
                        >
                            <Plus size={24} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Outsourcing */}
                <div className="fd-card">
                    <div className="fd-card-header">
                        <div>
                            <h3 className="fd-card-title">Outsourcing / Carefast</h3>
                            <p className="fd-card-subtitle">Personnel Evacuated</p>
                        </div>
                        <div className="fd-card-icon">
                            <HardHat size={40} weight="duotone" />
                        </div>
                    </div>
                    <div className="fd-counter">
                        <button
                            className="fd-counter-btn fd-counter-btn--minus"
                            onClick={() => decrement(setOutsourcing, outsourcing)}
                        >
                            <Minus size={24} weight="bold" />
                        </button>
                        <span className="fd-counter-value">{pad(outsourcing)}</span>
                        <button
                            className="fd-counter-btn fd-counter-btn--plus"
                            onClick={() => increment(setOutsourcing, outsourcing)}
                        >
                            <Plus size={24} weight="bold" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear Zone Button */}
            <div className="fd-bottom">
                <button
                    className={`fd-clear-btn ${isCleared ? 'fd-clear-btn--active' : ''}`}
                    onClick={handleClear}
                >
                    <CheckCircle size={28} weight="fill" />
                    <div className="fd-clear-text">
                        <span className="fd-clear-main">ZONA B IS CLEAR</span>
                        <span className="fd-clear-sub">Tandai Area Ini Aman</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
