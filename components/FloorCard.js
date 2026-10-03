'use client';

import { Check, Warning, GearSix, User } from '@phosphor-icons/react';

function StatusIcon({ status }) {
    switch (status) {
        case 'clear':
            return (
                <div className="status-icon green">
                    <Check weight="bold" />
                </div>
            );
        case 'reporting':
            return (
                <div className="status-icon teal">
                    <GearSix />
                </div>
            );
        case 'unreported':
            return (
                <div className="status-icon red">
                    <Warning weight="bold" />
                </div>
            );
        default:
            return null;
    }
}

export default function FloorCard({ data }) {
    const isUnknown = data.m === '?';

    return (
        <div className={`floor-card status-${data.status}`}>
            <div className="card-header-row">
                <span className="floor-name">{data.label}</span>
                <StatusIcon status={data.status} />
            </div>

            {data.alertLabel ? (
                <div className={`alert-label ${data.status === 'unreported' ? 'red' : 'orange'}`}>
                    <Warning weight="fill" />
                    {data.alertLabel}
                </div>
            ) : (
                <div className="warden-name">
                    <User />
                    {data.warden}
                </div>
            )}

            <div className="stat-grid">
                <div className="stat-cell">
                    <div className="stat-cell-label">M</div>
                    <div className={`stat-cell-value ${isUnknown ? 'unknown' : ''}`}>{data.m}</div>
                </div>
                <div className="stat-cell">
                    <div className="stat-cell-label">DK</div>
                    <div className={`stat-cell-value ${isUnknown ? 'unknown' : ''}`}>{data.dk}</div>
                </div>
                <div className="stat-cell">
                    <div className="stat-cell-label">OC</div>
                    <div className={`stat-cell-value ${isUnknown ? 'unknown' : ''}`}>{data.oc}</div>
                </div>
            </div>

            {data.footerAlert ? (
                <div className="card-footer-alert">
                    <span className="dot-red"></span>
                    {data.footerAlert}
                </div>
            ) : (
                <div className="card-footer-text">{data.updated}</div>
            )}
        </div>
    );
}
