import React from 'react';
import { SystemBranding } from '@/config/branding';

export interface DocumentFooterProps {
  preparedBy?: string;
  generatedDate?: string;
}

export const DocumentFooter: React.FC<DocumentFooterProps> = ({ preparedBy, generatedDate }) => {
  return (
    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {preparedBy && <div style={{ marginBottom: '4px' }}>Prepared by: <span style={{ color: '#4b5563' }}>{preparedBy}</span></div>}
          {generatedDate && <div>Generated: <span style={{ color: '#4b5563' }}>{generatedDate}</span></div>}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          {SystemBranding.poweredBy}
        </div>
      </div>
    </div>
  );
};
