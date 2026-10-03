'use client';

import { useState } from 'react';
import {
    Plus, MagnifyingGlass, Funnel, Phone, PencilSimple, X,
    User, IdentificationCard, FloppyDisk, Trash, Pulse
} from '@phosphor-icons/react';
import { useAppContext } from '../context/AppContext';
import InitialsAvatar from './InitialsAvatar';
import ConfirmDialog from './ConfirmDialog';
import { getWhatsAppLink, isValidPhone, PERSONNEL_STATUSES } from '../lib/personnel';

const EMPTY_FORM = { name: '', role: '', phone: '', status: 'active' };

export default function PersonnelRegistry() {
    const { personnel, addPersonnel, updatePersonnel, deletePersonnel } = useAppContext();

    // Form state: null = list view, otherwise { mode: 'add' | 'edit', id? }
    const [formState, setFormState] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    // Delete confirmation
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [listError, setListError] = useState('');

    const isEdit = formState?.mode === 'edit';

    const openAddForm = () => {
        setForm(EMPTY_FORM);
        setFormError('');
        setFormState({ mode: 'add' });
    };

    const openEditForm = (p) => {
        setForm({ name: p.name, role: p.role, phone: p.phone || '', status: p.status });
        setFormError('');
        setFormState({ mode: 'edit', id: p.id });
    };

    const closeForm = () => {
        setFormState(null);
        setForm(EMPTY_FORM);
        setFormError('');
    };

    const updateField = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSave = async () => {
        const name = form.name.trim();
        const role = form.role.trim();
        const phone = form.phone.trim();

        if (!name || !role || !phone) {
            setFormError('Semua field wajib diisi.');
            return;
        }
        if (!isValidPhone(phone)) {
            setFormError('Nomor telepon tidak valid. Contoh: 0812 3456 7890 atau +62 812 3456 7890.');
            return;
        }

        setSaving(true);
        const { error } = isEdit
            ? await updatePersonnel(formState.id, { name, role, phone, status: form.status })
            : await addPersonnel(name, role, phone);
        setSaving(false);

        if (error) {
            setFormError('Gagal menyimpan data. Silakan coba lagi.');
            return;
        }
        closeForm();
    };

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        const { error } = await deletePersonnel(pendingDelete.id);
        setDeleting(false);
        setListError(error ? `Gagal menghapus ${pendingDelete.name}. Silakan coba lagi.` : '');
        setPendingDelete(null);
    };

    const q = searchQuery.toLowerCase();
    const filteredPersonnel = personnel.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        (p.phone || '').includes(searchQuery)
    );

    if (formState) {
        return (
            <div className="pr-form-wrapper">
                <div className="pr-modal-card">
                    <div className="pr-modal-header">
                        <div>
                            <h3 className="pr-modal-title">{isEdit ? 'Edit Personnel' : 'Add Personnel'}</h3>
                            <p className="pr-modal-subtitle">
                                {isEdit
                                    ? 'Perbarui data personel di B-Safe tracking system.'
                                    : 'Register a new staff member to the B-Safe tracking system.'}
                            </p>
                        </div>
                        <button className="btn-close" onClick={closeForm} aria-label="Tutup">
                            <X />
                        </button>
                    </div>

                    <div className="pr-modal-body">
                        {isEdit && (
                            <div className="pr-form-preview">
                                <InitialsAvatar name={form.name} size={48} />
                                <span>Avatar dibuat otomatis dari inisial nama.</span>
                            </div>
                        )}

                        <div className="fm-form-group">
                            <label htmlFor="pr-name">Full Name (Nama Lengkap) <span className="text-red">*</span></label>
                            <div className="fm-input-wrapper">
                                <User className="fm-input-icon" />
                                <input
                                    id="pr-name"
                                    type="text"
                                    placeholder="e.g. Budi Santoso"
                                    className="fm-input has-icon"
                                    value={form.name}
                                    onChange={updateField('name')}
                                />
                            </div>
                        </div>

                        <div className="fm-form-group">
                            <label htmlFor="pr-role">Role/Job Title (Jabatan) <span className="text-red">*</span></label>
                            <div className="fm-input-wrapper">
                                <IdentificationCard className="fm-input-icon" />
                                <input
                                    id="pr-role"
                                    type="text"
                                    placeholder="e.g. Floor Warden"
                                    className="fm-input has-icon"
                                    value={form.role}
                                    onChange={updateField('role')}
                                />
                            </div>
                        </div>

                        <div className="fm-form-group">
                            <label htmlFor="pr-phone">Phone Number / WhatsApp (Nomor Telepon) <span className="text-red">*</span></label>
                            <div className="fm-input-wrapper">
                                <Phone className="fm-input-icon" />
                                <input
                                    id="pr-phone"
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="+62 812 3456 7890"
                                    className="fm-input has-icon"
                                    value={form.phone}
                                    onChange={updateField('phone')}
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="fm-form-group">
                                <label htmlFor="pr-status">Status</label>
                                <div className="fm-input-wrapper pr-select-wrapper">
                                    <Pulse className="fm-input-icon" />
                                    <select
                                        id="pr-status"
                                        className="fm-input has-icon pr-select"
                                        value={form.status}
                                        onChange={updateField('status')}
                                    >
                                        {PERSONNEL_STATUSES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {formError && <p className="pr-form-error" role="alert">{formError}</p>}
                    </div>

                    <div className="pr-modal-footer">
                        <button className="btn-outline-cancel" onClick={closeForm} disabled={saving}>Batal</button>
                        <button className="btn-save-dark" onClick={handleSave} disabled={saving}>
                            <FloppyDisk weight="fill" />
                            <span>{saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Personel'}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pr-container">
            <div className="pr-header">
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Daftar Sweep Warden</h3>
                </div>
                <button className="btn-dark" onClick={openAddForm}>
                    <Plus weight="bold" />
                    <span>New Personnel</span>
                </button>
            </div>

            <div className="pr-search-bar">
                <div className="pr-search-input">
                    <MagnifyingGlass className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, floor, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="btn-outline">
                    <Funnel />
                    <span>Filter</span>
                </button>
            </div>

            {listError && <p className="pr-form-error" role="alert" style={{ marginBottom: 16 }}>{listError}</p>}

            <div className="pr-table-wrapper">
                <table className="pr-table">
                    <thead>
                        <tr>
                            <th>Personnel</th>
                            <th>Role</th>
                            <th>Location & Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPersonnel.map((p) => {
                            const isOffDuty = p.dotColor === 'gray';
                            const isRed = p.dotColor === 'red';
                            const waLink = getWhatsAppLink(p.phone);

                            let pillClass = 'pill-green';
                            let pillText = 'Active';
                            if (p.dotColor === 'yellow') { pillClass = 'pill-yellow'; pillText = 'Sweeping'; }
                            if (p.dotColor === 'red') { pillClass = 'pill-red'; pillText = 'Assistance Req.'; }
                            if (p.dotColor === 'gray') { pillClass = 'pill-gray'; pillText = 'Off Duty'; }

                            const phoneBtnClass = `btn-icon ${isRed ? 'icon-red' : ''} ${isOffDuty ? 'icon-disabled' : ''}`;

                            return (
                                <tr key={p.id} className={isOffDuty ? 'pr-row-disabled' : ''}>
                                    <td>
                                        <div className="pr-user">
                                            <div className="pr-avatar-wrapper">
                                                <InitialsAvatar name={p.name} size={40} muted={isOffDuty} />
                                                <span className={`status-dot dot-${p.dotColor}`}></span>
                                            </div>
                                            <div className="pr-user-info">
                                                <span className={`pr-name ${isRed ? 'text-red' : ''} ${isOffDuty ? 'text-gray' : ''}`}>
                                                    {p.name}
                                                </span>
                                                <span className={`pr-phone ${isRed ? 'text-red' : ''} ${isOffDuty ? 'text-gray' : ''}`}>
                                                    {p.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={isOffDuty ? 'text-gray' : ''}>{p.role}</td>
                                    <td>
                                        <span className={`pr-status-pill ${pillClass}`}>{pillText}</span>
                                    </td>
                                    <td>
                                        <div className="pr-actions">
                                            {waLink ? (
                                                <a
                                                    href={waLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={phoneBtnClass}
                                                    title={`Chat WhatsApp ${p.name}`}
                                                    aria-label={`Chat WhatsApp ${p.name}`}
                                                >
                                                    <Phone weight={isRed ? 'fill' : 'regular'} />
                                                </a>
                                            ) : (
                                                <button
                                                    className="btn-icon icon-disabled"
                                                    disabled
                                                    title="Nomor telepon tidak valid"
                                                    aria-label="Nomor telepon tidak valid"
                                                >
                                                    <Phone />
                                                </button>
                                            )}
                                            <button
                                                className="btn-icon"
                                                onClick={() => openEditForm(p)}
                                                title="Edit"
                                                aria-label={`Edit ${p.name}`}
                                            >
                                                <PencilSimple />
                                            </button>
                                            <button
                                                className="btn-icon btn-icon-danger"
                                                onClick={() => setPendingDelete({ id: p.id, name: p.name })}
                                                title="Delete"
                                                aria-label={`Hapus ${p.name}`}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredPersonnel.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>
                                    {searchQuery ? 'Tidak ada hasil ditemukan' : 'Belum ada personel terdaftar'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Hapus Personel?"
                message={
                    pendingDelete
                        ? `Anda yakin ingin menghapus "${pendingDelete.name}"? Lantai yang ditugaskan ke personel ini akan menjadi tanpa warden. Tindakan ini tidak dapat dibatalkan.`
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
