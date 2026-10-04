'use client';

import { useState } from 'react';
import { useAppContext, INCIDENT_NAME_MAX } from '../context/AppContext';
import {
    CalendarBlank, Users, IdentificationBadge, HardHat,
    PencilSimple, Check, X, Tag
} from '@phosphor-icons/react';

export default function IncidentLogs() {
    const { incidents, updateIncidentName } = useAppContext();

    // Inline edit state untuk nama kejadian
    const [editingId, setEditingId] = useState(null);
    const [draftName, setDraftName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = (inc) => {
        setEditingId(inc.id);
        setDraftName(inc.name || '');
        setError('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraftName('');
        setError('');
    };

    const saveEdit = async () => {
        if (!editingId || saving) return;
        setSaving(true);
        const { error: err } = await updateIncidentName(editingId, draftName);
        setSaving(false);

        if (err) {
            setError('Gagal menyimpan nama kejadian. Silakan coba lagi.');
            return;
        }
        cancelEdit();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    return (
        <div className="il-container">
            <div className="il-header">
                <div>
                    <h2 className="il-title">Incident Logs</h2>
                    <p className="il-subtitle">Riwayat insiden dan reset evakuasi</p>
                </div>
            </div>

            {error && <p className="pr-form-error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

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
                                <th>
                                    <div className="il-th-icon">
                                        <Tag size={14} />
                                        <span>Nama Kejadian</span>
                                    </div>
                                </th>
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
                                const number = incidents.length - idx;
                                const isEditing = editingId === inc.id;

                                return (
                                    <tr key={inc.id} className={isEditing ? 'fm-row-editing' : ''}>
                                        <td className="il-num">{number}</td>
                                        <td className="il-name-cell">
                                            {isEditing ? (
                                                <div className="il-name-edit">
                                                    <input
                                                        type="text"
                                                        className="fm-input il-name-input"
                                                        value={draftName}
                                                        maxLength={INCIDENT_NAME_MAX}
                                                        placeholder="e.g. Simulasi Kebakaran Q4"
                                                        aria-label={`Nama kejadian insiden #${number}`}
                                                        onChange={(e) => setDraftName(e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        disabled={saving}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="btn-icon-delete btn-icon-edit"
                                                        onClick={saveEdit}
                                                        disabled={saving}
                                                        title="Simpan"
                                                        aria-label="Simpan nama kejadian"
                                                    >
                                                        <Check size={16} weight="bold" />
                                                    </button>
                                                    <button
                                                        className="btn-icon-delete"
                                                        onClick={cancelEdit}
                                                        disabled={saving}
                                                        title="Batal"
                                                        aria-label="Batal edit nama kejadian"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="il-name-view">
                                                    <span className={inc.name ? 'il-name' : 'il-name il-name--empty'}>
                                                        {inc.name || 'Belum diberi nama'}
                                                    </span>
                                                    <button
                                                        className="btn-icon-delete btn-icon-edit"
                                                        onClick={() => startEdit(inc)}
                                                        disabled={Boolean(editingId)}
                                                        title="Edit nama kejadian"
                                                        aria-label={`Edit nama kejadian insiden #${number}`}
                                                    >
                                                        <PencilSimple size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
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
