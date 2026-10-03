'use client';

import { useAppContext } from '../context/AppContext';
import { CalendarBlank, Users, IdentificationBadge, HardHat } from '@phosphor-icons/react';

export default function IncidentLogs() {
    const { incidents } = useAppContext();

    return (
        <div className="il-container">
            <div className="il-header">
                <div>
                    <h2 className="il-title">Incident Logs</h2>
                    <p className="il-subtitle">Riwayat insiden dan reset evakuasi</p>
                </div>
            </div>

            {incidents.length === 0 ? (
                <div className="il-empty">
                    <CalendarBlank size={48} weight="thin" className="il-empty-icon" />
                    <h3 className="il-empty-title">Belum Ada Insiden</h3>
                    <p className="il-empty-text">
                        Tekan tombol &quot;CREATE NEW INCIDENT&quot; di sidebar untuk membuat insiden pertama.
                    </p>
                </div>
            ) : (
                <div className="il-table-wrapper">
                    <table className="il-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tanggal & Waktu</th>
                                <th>
                                    <div className="il-th-icon">
                                        <Users size={14} />
                                        <span>Mahasiswa</span>
                                    </div>
                                </th>
                                <th>
                                    <div className="il-th-icon">
                                        <IdentificationBadge size={14} />
                                        <span>Staf</span>
                                    </div>
                                </th>
                                <th>
                                    <div className="il-th-icon">
                                        <HardHat size={14} />
                                        <span>Outsourcing</span>
                                    </div>
                                </th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map((inc, idx) => {
                                const d = new Date(inc.date);
                                const dateStr = d.toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                });
                                const timeStr = d.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });
                                const total = inc.totalM + inc.totalDK + inc.totalOC;

                                return (
                                    <tr key={inc.id}>
                                        <td className="il-num">{incidents.length - idx}</td>
                                        <td>
                                            <div className="il-date-cell">
                                                <span className="il-date">{dateStr}</span>
                                                <span className="il-time">{timeStr}</span>
                                            </div>
                                        </td>
                                        <td><span className="il-val val-m">{inc.totalM}</span></td>
                                        <td><span className="il-val val-dk">{inc.totalDK}</span></td>
                                        <td><span className="il-val val-oc">{inc.totalOC}</span></td>
                                        <td><strong className="il-total">{total}</strong></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
