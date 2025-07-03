import React from 'react';
import DocumentTemplate from '@/features/registration/components/DocumentTemplate';

export default function DocumentPreviewPage() {
  const sampleTerms = `
    <h4>1. Allgemeine Geschäftsbedingungen</h4>
    <p>Diese Geschäftsbedingungen gelten für die Teilnahme am Hügelfest. Mit der Anmeldung erkennen Sie diese Bedingungen an.</p>
    
    <h4>2. Anmeldung und Zahlung</h4>
    <p>Die Anmeldung erfolgt online über unsere Website. Die Teilnahmegebühr ist bis spätestens eine Woche vor Veranstaltungsbeginn zu entrichten.</p>
    <ul>
      <li>Überweisung auf das angegebene Konto</li>
      <li>PayPal-Zahlung über unsere Website</li>
      <li>Barzahlung vor Ort (nach Absprache)</li>
    </ul>
    
    <h4>3. Stornierung</h4>
    <p>Eine kostenlose Stornierung ist bis 14 Tage vor Veranstaltungsbeginn möglich.</p>
  `;

  const samplePublicNotes = `
    <p><strong>Wichtige Hinweise für alle Teilnehmer:</strong></p>
    <ul>
      <li>Bitte bringen Sie eigene Verpflegung mit</li>
      <li>Camping ist auf dem Gelände möglich</li>
      <li>Alkohol nur in Maßen und verantwortungsvoll</li>
      <li>Müll bitte getrennt entsorgen</li>
    </ul>
    
    <p>Bei Fragen wenden Sie sich gerne an unser Organisationsteam.</p>
    
    <p><strong>Kontakt:</strong><br>
    E-Mail: info@huegelfest.de<br>
    Telefon: +49 123 456 789</p>
  `;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Document Template Preview
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-[#460b6c] text-white p-4">
            <h2 className="text-xl font-semibold">Standard IBAN Example</h2>
          </div>
          <div className="p-6">
            <DocumentTemplate
              publicNotes={samplePublicNotes}
              terms={sampleTerms}
              iban="DE89 3701 0050 0123 4567 89"
              bic="BYLADEM1001"
              bankName="Postbank"
              accountHolder="Hügelfest e.V."
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-[#ff9900] text-white p-4">
            <h2 className="text-xl font-semibold">Long IBAN Example (Test Case)</h2>
          </div>
          <div className="p-6">
            <DocumentTemplate
              publicNotes={samplePublicNotes}
              terms={sampleTerms}
              iban="DE89370100500123456789012345678901234567"
              bic="BYLADEM1001"
              bankName="Postbank"
              accountHolder="Hügelfest e.V."
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-700 text-white p-4">
            <h2 className="text-xl font-semibold">Minimal Example (No Notes/Terms)</h2>
          </div>
          <div className="p-6">
            <DocumentTemplate
              iban="DE89 3701 0050 0123 4567 89"
              bic="BYLADEM1001"
              bankName="Postbank"
              accountHolder="Hügelfest e.V."
            />
          </div>
        </div>
      </div>
    </div>
  );
}