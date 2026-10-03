'use client';

import { useState } from 'react';
import { FloppyDisk, UserFocus, Trash } from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';
import InitialsAvatar from './InitialsAvatar';
import ConfirmDialog from './ConfirmDialog';

export default function FloorManagement() {
    const { floors, personnel, addFloor, deleteFloor } = useAppContext();
    const [floorName, setFloorName] = useState('');
    const [wardenName, setWardenName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Delete confirmation
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filteredPersonnel = personnel.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = () => {
        if (!floorName.trim() || !wardenName.trim()) return;
        addFloor(floorName.trim(), wardenName.trim());
        setFloorName('');
        setWardenName('');
        setSearchQuery('');
    };

    const handleSelectPerson = (name) => {
        setWardenName(name);
        setSearchQuery(name);
        setShowDropdown(false);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        await deleteFloor(pendingDelete.id);
        setDeleting(false);
        setPendingDelete(null);
    };

    return (
        <div className="fm-container">
            {/* Assign Warden Card */}
            <div className="fm-card fm-card-left">
                <h3 className="fm-card-title">Assign Warden</h3>

                <div className="fm-form-group">
                    <label>Floor Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Floor 10"
                        className="fm-input"
                        value={floorName}
                        onChange={(e) => setFloorName(e.target.value)}
                    />
                </div>

                <div className="fm-form-group">
                    <label>PIC (Sweep Warden)</label>
                    <div className="fm-input-wrapper" style={{ position: 'relative' }}>
                        <UserFocus className="fm-input-icon" />
                        <input
                            type="text"
                            placeholder="Search personnel..."
                            className="fm-input has-icon"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setWardenName('');
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                        />
                        {showDropdown && searchQuery && filteredPersonnel.length > 0 && (
                            <div className="fm-dropdown">
                                {filteredPersonnel.map(p => (
                                    <div
                                        key={p.id}
                                        className="fm-dropdown-item"
                                        onClick={() => handleSelectPerson(p.name)}
                                    >
                                        <InitialsAvatar name={p.name} size={32} />
                                        <span>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button className="fm-btn-save" onClick={handleSave}>
                    <FloppyDisk weight="fill" />
                    <span>Save Assignment</span>
                </button>
            </div>

            {/* Registered Floors Card */}
            <div className="fm-card fm-card-right">
                <div className="fm-card-header">
                    <h3 className="fm-card-title">Registered Floors</h3>
                    <span className="fm-badge">Total: {floors.length}</span>
                </div>

                <div className="fm-table-wrapper">
                    <table className="fm-table">
                        <thead>
                            <tr>
                                <th>FLOOR</th>
                                <th>ASSIGNED WARDEN</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {floors.map((floor) => (
                                <tr key={floor.id}>
                                    <td><strong>{floor.name}</strong></td>
                                    <td>
                                        <div className="fm-warden">
                                            <InitialsAvatar name={floor.warden} size={36} />
                                            <span>{floor.warden || '—'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon-delete"
                                            onClick={() => setPendingDelete({ id: floor.id, name: floor.name })}
                                            title="Delete floor"
                                            aria-label={`Hapus ${floor.name}`}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {floors.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>
                                        Belum ada lantai terdaftar
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Hapus Lantai?"
                message={
                    pendingDelete
                        ? `Anda yakin ingin menghapus "${pendingDelete.name}"? Semua laporan terkait lantai ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`
                        : ''
                }
                confirmLabel="Ya, Hapus"
                loading={deleting}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
