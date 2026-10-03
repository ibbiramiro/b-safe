'use client';

import { useRef, useState } from 'react';
import { FloppyDisk, UserFocus, Trash, PencilSimple, X } from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';
import InitialsAvatar from './InitialsAvatar';
import ConfirmDialog from './ConfirmDialog';

export default function FloorManagement() {
    const { floors, personnel, addFloor, updateFloor, deleteFloor } = useAppContext();

    // Form state (dipakai untuk tambah & edit)
    const [editingFloorId, setEditingFloorId] = useState(null);
    const [floorName, setFloorName] = useState('');
    const [wardenId, setWardenId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const floorNameRef = useRef(null);

    // Delete confirmation
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const isEdit = editingFloorId !== null;
    const selectedWarden = personnel.find(p => p.id === wardenId);

    // Jika input masih berisi nama warden terpilih, tampilkan semua opsi
    // supaya user bisa langsung mengganti warden saat edit.
    const isShowingSelected = selectedWarden && searchQuery === selectedWarden.name;
    const filteredPersonnel = isShowingSelected
        ? personnel
        : personnel.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const resetForm = () => {
        setEditingFloorId(null);
        setFloorName('');
        setWardenId(null);
        setSearchQuery('');
        setShowDropdown(false);
        setFormError('');
    };

    const startEdit = (floor) => {
        // Data fallback lokal belum punya warden_id, cocokkan via nama
        const currentWarden =
            personnel.find(p => p.id === floor.warden_id) ||
            personnel.find(p => p.name === floor.warden);

        setEditingFloorId(floor.id);
        setFloorName(floor.name);
        setWardenId(currentWarden?.id || null);
        setSearchQuery(currentWarden?.name || '');
        setShowDropdown(false);
        setFormError('');

        floorNameRef.current?.focus();
        floorNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleSave = async () => {
        const name = floorName.trim();
        if (!name || !wardenId) {
            setFormError('Isi nama lantai dan pilih warden dari daftar.');
            return;
        }

        setSaving(true);
        const { error } = isEdit
            ? await updateFloor(editingFloorId, { name, wardenId })
            : await addFloor(name, wardenId);
        setSaving(false);

        if (error) {
            setFormError('Gagal menyimpan. Silakan coba lagi.');
            return;
        }
        resetForm();
    };

    const handleSelectPerson = (person) => {
        setWardenId(person.id);
        setSearchQuery(person.name);
        setShowDropdown(false);
        setFormError('');
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        await deleteFloor(pendingDelete.id);
        setDeleting(false);
        // Jika lantai yang sedang diedit dihapus, kosongkan form
        if (pendingDelete.id === editingFloorId) resetForm();
        setPendingDelete(null);
    };

    return (
        <div className="fm-container">
            {/* Assign / Edit Warden Card */}
            <div className={`fm-card fm-card-left ${isEdit ? 'fm-card-editing' : ''}`}>
                <div className="fm-form-header">
                    <h3 className="fm-card-title">{isEdit ? 'Edit Assignment' : 'Assign Warden'}</h3>
                    {isEdit && (
                        <button className="btn-close" onClick={resetForm} aria-label="Batal edit">
                            <X />
                        </button>
                    )}
                </div>

                <div className="fm-form-group">
                    <label htmlFor="fm-floor-name">Floor Name</label>
                    <input
                        id="fm-floor-name"
                        ref={floorNameRef}
                        type="text"
                        placeholder="e.g. Floor 10"
                        className="fm-input"
                        value={floorName}
                        onChange={(e) => setFloorName(e.target.value)}
                    />
                </div>

                <div className="fm-form-group">
                    <label htmlFor="fm-warden">PIC (Sweep Warden)</label>
                    <div className="fm-input-wrapper" style={{ position: 'relative' }}>
                        <UserFocus className="fm-input-icon" />
                        <input
                            id="fm-warden"
                            type="text"
                            placeholder="Search personnel..."
                            className="fm-input has-icon"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setWardenId(null);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setShowDropdown(false)}
                        />
                        {showDropdown && (searchQuery || isEdit) && filteredPersonnel.length > 0 && (
                            <div className="fm-dropdown" role="listbox">
                                {filteredPersonnel.map(p => (
                                    <div
                                        key={p.id}
                                        role="option"
                                        aria-selected={p.id === wardenId}
                                        className={`fm-dropdown-item ${p.id === wardenId ? 'fm-dropdown-item--selected' : ''}`}
                                        // onMouseDown agar terpilih sebelum input kehilangan fokus (onBlur)
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectPerson(p);
                                        }}
                                    >
                                        <InitialsAvatar name={p.name} size={32} />
                                        <span>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {formError && <p className="pr-form-error" role="alert">{formError}</p>}

                <button className="fm-btn-save" onClick={handleSave} disabled={saving}>
                    <FloppyDisk weight="fill" />
                    <span>{saving ? 'Menyimpan...' : isEdit ? 'Update Assignment' : 'Save Assignment'}</span>
                </button>
                {isEdit && (
                    <button className="btn-outline-cancel fm-btn-cancel" onClick={resetForm} disabled={saving}>
                        Batal
                    </button>
                )}
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
                                <tr key={floor.id} className={floor.id === editingFloorId ? 'fm-row-editing' : ''}>
                                    <td><strong>{floor.name}</strong></td>
                                    <td>
                                        <div className="fm-warden">
                                            <InitialsAvatar name={floor.warden} size={36} />
                                            <span className={floor.warden ? '' : 'text-gray'}>
                                                {floor.warden || 'Belum ada warden'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="fm-actions">
                                            <button
                                                className="btn-icon-delete btn-icon-edit"
                                                onClick={() => startEdit(floor)}
                                                title="Edit assignment"
                                                aria-label={`Edit ${floor.name}`}
                                            >
                                                <PencilSimple size={16} />
                                            </button>
                                            <button
                                                className="btn-icon-delete"
                                                onClick={() => setPendingDelete({ id: floor.id, name: floor.name })}
                                                title="Delete floor"
                                                aria-label={`Hapus ${floor.name}`}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
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
