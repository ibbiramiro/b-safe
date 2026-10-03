'use client';

import { GraduationCap, IdentificationBadge, HardHat } from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';

export default function SummaryRow() {
    const { floors } = useAppContext();

    const totalM = floors.reduce((sum, f) => sum + (typeof f.m === 'number' ? f.m : 0), 0);
    const totalDK = floors.reduce((sum, f) => sum + (typeof f.dk === 'number' ? f.dk : 0), 0);
    const totalOC = floors.reduce((sum, f) => sum + (typeof f.oc === 'number' ? f.oc : 0), 0);

    const summaryData = [
        { label: 'TOTAL MAHASISWA', value: totalM, sublabel: 'Students', icon: GraduationCap },
        { label: 'TOTAL STAF', value: totalDK, sublabel: 'Faculty', icon: IdentificationBadge },
        { label: 'TOTAL OUTSOURCING', value: totalOC, sublabel: 'Contract', icon: HardHat },
    ];

    return (
        <div className="summary-row">
            {summaryData.map((item) => {
                const Icon = item.icon;
                return (
                    <div key={item.label} className="summary-card">
                        <div className="summary-text">
                            <span className="summary-label">{item.label}</span>
                            <span className="summary-value">{item.value}</span>
                            <span className="summary-sublabel">
                                <span className="dot dot-green"></span>
                                {item.sublabel}
                            </span>
                        </div>
                        <div className="summary-icon">
                            <Icon />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
