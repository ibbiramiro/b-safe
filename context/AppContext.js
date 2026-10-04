'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

// Sama dengan CHECK constraint incidents_name_check di database
export const INCIDENT_NAME_MAX = 100;

// ── Fallback data when Supabase is not connected ──
const fallbackFloors = [
    { id: 'f1', name: 'Floor 9', floor_number: 9, warden: 'Ahmad S.', count_m: 10, count_dk: 2, count_oc: 0, status: 'clear', updated_at: new Date().toISOString() },
    { id: 'f2', name: 'Floor 8', floor_number: 8, warden: 'Budi H.', count_m: 4, count_dk: 1, count_oc: 0, status: 'reporting', updated_at: new Date().toISOString() },
    { id: 'f3', name: 'Floor 7', floor_number: 7, warden: '', count_m: 0, count_dk: 0, count_oc: 0, status: 'unreported', updated_at: '' },
    { id: 'f4', name: 'Floor 6', floor_number: 6, warden: 'Citra D.', count_m: 0, count_dk: 0, count_oc: 0, status: 'clear', updated_at: new Date().toISOString() },
    { id: 'f5', name: 'Floor 5', floor_number: 5, warden: 'Dewi K.', count_m: 0, count_dk: 0, count_oc: 0, status: 'clear', updated_at: new Date().toISOString() },
];

const fallbackPersonnel = [
    { id: 'p1', name: 'Budi Santoso', role: 'Sweep Warden', phone: '+62 812-3456-7890', status: 'active' },
    { id: 'p2', name: 'Siti Rahma', role: 'Staf Keamanan', phone: '+62 813-9876-5432', status: 'sweeping' },
    { id: 'p3', name: 'Agus Wijaya', role: 'Medis', phone: '+62 811-2233-4455', status: 'assistance_req' },
    { id: 'p4', name: 'Rina Hidayat', role: 'Sweep Warden', phone: '+62 855-6677-8899', status: 'off_duty' },
];

// ── Helper: map DB status to dot color ──
function statusToDotColor(status) {
    switch (status) {
        case 'active': return 'green';
        case 'sweeping': return 'yellow';
        case 'assistance_req': return 'red';
        case 'off_duty': return 'gray';
        default: return 'green';
    }
}

// ── Helper: time ago from date ──
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
}

export function AppProvider({ children }) {
    const [floors, setFloors] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [buildingId, setBuildingId] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Initial data fetch ──
    useEffect(() => {
        async function init() {
            if (!supabase) {
                // Fallback: use local data
                setFloors(fallbackFloors);
                setPersonnel(fallbackPersonnel);
                setLoading(false);
                return;
            }

            try {
                // Get building
                const { data: buildings } = await supabase
                    .from('buildings')
                    .select('id')
                    .limit(1);

                if (buildings && buildings.length > 0) {
                    const bId = buildings[0].id;
                    setBuildingId(bId);
                    setIsOnline(true);

                    // Fetch floors with warden name
                    const { data: floorsData } = await supabase
                        .from('floors')
                        .select('*, warden:personnel(name)')
                        .eq('building_id', bId)
                        .order('floor_number', { ascending: false });

                    if (floorsData) {
                        setFloors(floorsData.map(f => ({
                            ...f,
                            warden: f.warden?.name || '',
                        })));
                    }

                    // Fetch personnel
                    const { data: personnelData } = await supabase
                        .from('personnel')
                        .select('*')
                        .eq('building_id', bId)
                        .order('created_at', { ascending: true });

                    if (personnelData) {
                        setPersonnel(personnelData);
                    }

                    // Fetch incidents
                    const { data: incidentsData } = await supabase
                        .from('incidents')
                        .select('*')
                        .eq('building_id', bId)
                        .order('created_at', { ascending: false });

                    if (incidentsData) {
                        setIncidents(incidentsData.map(inc => ({
                            id: inc.id,
                            name: inc.incident_name || '',
                            date: inc.created_at,
                            totalM: inc.total_m,
                            totalDK: inc.total_dk,
                            totalOC: inc.total_oc,
                        })));
                    }
                } else {
                    // No building in DB, use fallback
                    setFloors(fallbackFloors);
                    setPersonnel(fallbackPersonnel);
                }
            } catch (err) {
                console.error('Supabase init error:', err);
                setFloors(fallbackFloors);
                setPersonnel(fallbackPersonnel);
            }

            setLoading(false);
        }

        init();
    }, []);

    // ── Realtime subscription for floors ──
    useEffect(() => {
        if (!supabase || !buildingId) return;

        const channel = supabase
            .channel('floors-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'floors',
                filter: `building_id=eq.${buildingId}`,
            }, async () => {
                // Re-fetch floors on any change
                const { data } = await supabase
                    .from('floors')
                    .select('*, warden:personnel(name)')
                    .eq('building_id', buildingId)
                    .order('floor_number', { ascending: false });

                if (data) {
                    setFloors(data.map(f => ({
                        ...f,
                        warden: f.warden?.name || '',
                    })));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [buildingId]);

    // ── Floor actions ──
    // Warden direferensikan via ID (bukan nama) agar aman jika ada nama duplikat
    const addFloor = useCallback(async (name, wardenId) => {
        const wardenName = personnel.find(p => p.id === wardenId)?.name || '';

        if (isOnline && supabase) {
            const floorNum = parseInt(name.replace(/\D/g, '')) || (floors.length + 1);

            const { data, error } = await supabase
                .from('floors')
                .insert({
                    building_id: buildingId,
                    name,
                    floor_number: floorNum,
                    warden_id: wardenId || null,
                    count_m: 0,
                    count_dk: 0,
                    count_oc: 0,
                    status: 'clear',
                })
                .select('*, warden:personnel(name)')
                .single();

            if (error) {
                console.error('Failed to add floor:', error);
                return { error };
            }
            setFloors(prev => [...prev, { ...data, warden: data.warden?.name || wardenName }]);
        } else {
            // Fallback local
            setFloors(prev => {
                const id = `f${Date.now()}`;
                return [...prev, { id, name, floor_number: (prev.length + 1), warden_id: wardenId, warden: wardenName, count_m: 0, count_dk: 0, count_oc: 0, status: 'clear', updated_at: new Date().toISOString() }];
            });
        }
        return { error: null };
    }, [isOnline, buildingId, floors.length, personnel]);

    // Edit lantai yang sudah ada: nama lantai + warden yang ditugaskan
    const updateFloor = useCallback(async (id, { name, wardenId }) => {
        const wardenName = personnel.find(p => p.id === wardenId)?.name || '';
        const changes = { name, warden_id: wardenId || null };

        // floor_number dipakai untuk urutan; update hanya jika nama mengandung angka
        const parsedNum = parseInt(name.replace(/\D/g, ''));
        if (!Number.isNaN(parsedNum)) changes.floor_number = parsedNum;

        if (isOnline && supabase) {
            const { data, error } = await supabase
                .from('floors')
                .update(changes)
                .eq('id', id)
                .select('*, warden:personnel(name)')
                .single();

            if (error) {
                console.error('Failed to update floor:', error);
                return { error };
            }
            setFloors(prev => prev.map(f => f.id === id ? { ...data, warden: data.warden?.name || '' } : f));
        } else {
            setFloors(prev => prev.map(f => f.id === id ? { ...f, ...changes, warden: wardenName } : f));
        }
        return { error: null };
    }, [isOnline, personnel]);

    const deleteFloor = useCallback(async (id) => {
        if (isOnline && supabase) {
            const { error } = await supabase.from('floors').delete().eq('id', id);
            if (error) {
                console.error('Failed to delete floor:', error);
                return { error };
            }
        }
        setFloors(prev => prev.filter(f => f.id !== id));
        return { error: null };
    }, [isOnline]);

    const updateFloorCounts = useCallback(async (id, count_m, count_dk, count_oc, status) => {
        const timestamp = new Date().toISOString();
        if (isOnline && supabase) {
            const { error } = await supabase
                .from('floors')
                .update({ count_m, count_dk, count_oc, status, updated_at: timestamp })
                .eq('id', id);
            
            if (!error) {
                setFloors(prev => prev.map(f => f.id === id ? { ...f, count_m, count_dk, count_oc, status, updated_at: timestamp } : f));
            } else {
                console.error("Failed to update floor in supabase:", error);
            }
        } else {
            // Fallback local
            setFloors(prev => prev.map(f => f.id === id ? { ...f, count_m, count_dk, count_oc, status, updated_at: timestamp } : f));
        }
    }, [isOnline]);

    // ── Personnel actions ──
    // Avatar sekarang berbasis inisial nama (lihat components/InitialsAvatar.js),
    // sehingga tidak ada lagi avatar_url yang disimpan.
    const addPersonnel = useCallback(async (name, role, phone) => {
        if (isOnline && supabase) {
            const { data, error } = await supabase
                .from('personnel')
                .insert({
                    building_id: buildingId,
                    name,
                    role,
                    phone,
                    status: 'active',
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to add personnel:', error);
                return { error };
            }
            setPersonnel(prev => [...prev, data]);
        } else {
            // Fallback local
            const id = `p${Date.now()}`;
            setPersonnel(prev => [...prev, { id, name, role, phone, status: 'active' }]);
        }
        return { error: null };
    }, [isOnline, buildingId]);

    const updatePersonnel = useCallback(async (id, { name, role, phone, status }) => {
        const changes = { name, role, phone, status };

        if (isOnline && supabase) {
            const { data, error } = await supabase
                .from('personnel')
                .update(changes)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Failed to update personnel:', error);
                return { error };
            }
            setPersonnel(prev => prev.map(p => p.id === id ? data : p));
        } else {
            setPersonnel(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
        }

        // Sinkronkan nama warden di daftar lantai
        setFloors(prev => prev.map(f => f.warden_id === id ? { ...f, warden: name } : f));
        return { error: null };
    }, [isOnline]);

    const deletePersonnel = useCallback(async (id) => {
        if (isOnline && supabase) {
            const { error } = await supabase.from('personnel').delete().eq('id', id);
            if (error) {
                console.error('Failed to delete personnel:', error);
                return { error };
            }
        }
        setPersonnel(prev => prev.filter(p => p.id !== id));
        // DB: floors.warden_id "on delete set null" -> samakan di state lokal
        setFloors(prev => prev.map(f => f.warden_id === id ? { ...f, warden_id: null, warden: '' } : f));
        return { error: null };
    }, [isOnline]);

    // ── Incident actions ──
    const createIncident = useCallback(async () => {
        const totalM = floors.reduce((sum, f) => sum + (typeof f.count_m === 'number' ? f.count_m : 0), 0);
        const totalDK = floors.reduce((sum, f) => sum + (typeof f.count_dk === 'number' ? f.count_dk : 0), 0);
        const totalOC = floors.reduce((sum, f) => sum + (typeof f.count_oc === 'number' ? f.count_oc : 0), 0);

        const snapshot = {
            id: Date.now().toString(),
            name: '',
            date: new Date().toISOString(),
            totalM,
            totalDK,
            totalOC,
        };

        if (isOnline && supabase) {
            // Insert incident
            const { data: incData } = await supabase
                .from('incidents')
                .insert({
                    building_id: buildingId,
                    total_m: totalM,
                    total_dk: totalDK,
                    total_oc: totalOC,
                    status: 'active',
                })
                .select()
                .single();

            if (incData) {
                snapshot.id = incData.id;
                snapshot.date = incData.created_at;
            }

            // Reset all floors to unreported
            await supabase
                .from('floors')
                .update({ count_m: 0, count_dk: 0, count_oc: 0, status: 'unreported', updated_at: new Date().toISOString() })
                .eq('building_id', buildingId);
        }

        setIncidents(prev => [snapshot, ...prev]);
        setFloors(prev => prev.map(f => ({
            ...f,
            count_m: 0,
            count_dk: 0,
            count_oc: 0,
            status: 'unreported',
            updated_at: new Date().toISOString(),
        })));
    }, [floors, isOnline, buildingId]);

    // Label nama kejadian. String kosong disimpan sebagai NULL (belum diberi nama).
    const updateIncidentName = useCallback(async (id, name) => {
        const trimmed = (name || '').trim().slice(0, INCIDENT_NAME_MAX);
        const incident_name = trimmed || null;

        if (isOnline && supabase) {
            const { error } = await supabase
                .from('incidents')
                .update({ incident_name })
                .eq('id', id);

            if (error) {
                console.error('Failed to update incident name:', error);
                return { error };
            }
        }
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, name: trimmed } : inc));
        return { error: null };
    }, [isOnline]);

    // ── Mapped values for components (backward compatible) ──
    const mappedFloors = floors.map(f => ({
        id: f.id,
        name: f.name,
        floor_number: f.floor_number,
        warden_id: f.warden_id || null,
        warden: f.warden || '',
        m: f.count_m ?? 0,
        dk: f.count_dk ?? 0,
        oc: f.count_oc ?? 0,
        status: f.status || 'clear',
        updated: timeAgo(f.updated_at),
    }));

    const mappedPersonnel = personnel.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        phone: p.phone,
        status: p.status || 'active',
        dotColor: statusToDotColor(p.status),
    }));

    const value = {
        floors: mappedFloors,
        personnel: mappedPersonnel,
        incidents,
        addFloor,
        updateFloor,
        deleteFloor,
        updateFloorCounts,
        addPersonnel,
        updatePersonnel,
        deletePersonnel,
        createIncident,
        updateIncidentName,
        isOnline,
        loading,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within AppProvider');
    return ctx;
}
