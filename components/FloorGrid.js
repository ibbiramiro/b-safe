'use client';

import FloorCard from './FloorCard';
import { useAppContext } from '../context/AppContext';

export default function FloorGrid() {
    const { floors } = useAppContext();

    return (
        <div className="floor-grid">
            {floors.map((floor) => (
                <FloorCard key={floor.id} data={{
                    ...floor,
                    label: floor.name,
                    alertLabel: floor.status === 'unreported' && !floor.warden ? 'Unresponsive' : null,
                    footerAlert: floor.status === 'unreported' && !floor.warden ? 'Requires Warden Check' : null,
                    updated: floor.updated ? `Updated: ${floor.updated}` : '',
                }} />
            ))}
        </div>
    );
}
