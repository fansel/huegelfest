import React from 'react';
import styles from './DocumentTemplate.module.css';
import { formatIban } from '../utils/documentUtils';

interface DocumentTemplateProps {
  // Document content placeholders
  publicNotes?: string;
  terms?: string;
  // Bank details
  iban?: string;
  bic?: string;
  bankName?: string;
  accountHolder?: string;
  // Additional props for customization
  className?: string;
}

function DocumentTemplate({ 
  publicNotes = '', 
  terms = '', 
  iban = 'DE89 3701 0050 0123 4567 89',
  bic = 'BYLADEM1001',
  bankName = 'Postbank',
  accountHolder = 'Hügelfest e.V.',
  className = '' 
}: DocumentTemplateProps) {
  return (
    <div className={`${styles.documentTemplate} ${className}`}>
      {/* Main document content would go here */}
      <div className={styles.documentBody}>
        {/* Document content sections can be added here */}
        
        {/* Bank Details Section */}
        <div className={styles.bankDetailsSection}>
          <h3 className={styles.bankDetailsTitle}>Bankverbindung</h3>
          <div className={styles.bankDetailsContent}>
            <div className={styles.bankDetailRow}>
              <span className={styles.bankDetailLabel}>Kontoinhaber:</span>
              <span className={styles.bankDetailValue}>{accountHolder}</span>
            </div>
            <div className={styles.bankDetailRow}>
              <span className={styles.bankDetailLabel}>IBAN:</span>
              <span className={`${styles.bankDetailValue} ${styles.iban}`}>
                {formatIban(iban)}
              </span>
            </div>
            <div className={styles.bankDetailRow}>
              <span className={styles.bankDetailLabel}>BIC:</span>
              <span className={styles.bankDetailValue}>{bic}</span>
            </div>
            <div className={styles.bankDetailRow}>
              <span className={styles.bankDetailLabel}>Bank:</span>
              <span className={styles.bankDetailValue}>{bankName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Section */}
      {terms && (
        <div id="terms" className={styles.documentSection}>
          <h3 className={styles.sectionTitle}>Geschäftsbedingungen</h3>
          <div className={styles.sectionContent} dangerouslySetInnerHTML={{ __html: terms }} />
        </div>
      )}

      {/* Public Notes Section */}
      {publicNotes && (
        <div id="public-notes" className={styles.documentSection}>
          <h3 className={styles.sectionTitle}>Öffentliche Hinweise</h3>
          <div className={styles.sectionContent} dangerouslySetInnerHTML={{ __html: publicNotes }} />
        </div>
      )}
    </div>
  );
}

// Named export for compatibility
export { DocumentTemplate };

// Default export
export default DocumentTemplate;