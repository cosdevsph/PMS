import React from 'react';
import type { ClinicBranch } from '@/types/clinic';

export interface DocumentHeaderProps {
  clinic?: ClinicBranch;
  title?: string;
  subtitle?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ clinic, title, subtitle }) => {
  if (!clinic) return null;

  return (
    <div style={{ paddingBottom: '20px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '60%' }}>
          {clinic.logo ? (
            <img src={clinic.logo} alt={clinic.name} style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{clinic.name}</h2>
          )}
          
          <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
            {clinic.address && <div>{clinic.address}</div>}
            {(clinic.city || clinic.province || clinic.postal_code) && (
              <div>
                {[clinic.city, clinic.province, clinic.postal_code].filter(Boolean).join(', ')}
              </div>
            )}
            <div style={{ marginTop: '4px' }}>
              {clinic.phone && <span>Tel: {clinic.phone}</span>}
              {clinic.phone && clinic.email && <span style={{ margin: '0 8px' }}>|</span>}
              {clinic.email && <span>Email: {clinic.email}</span>}
            </div>
            {clinic.website && <div>Web: {clinic.website}</div>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          {title && <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};
