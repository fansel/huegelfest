import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimelineManager from '../index';
import { loadTimeline, saveTimeline } from '@/lib/admin';
import { vi } from 'vitest';
import { iconTranslations } from '@/lib/iconTranslations';

// Mock der API-Funktionen
vi.mock('@/lib/admin', () => ({
  loadTimeline: vi.fn(),
  saveTimeline: vi.fn()
}));

// Mock für fetch
global.fetch = vi.fn();

// Mock-Daten mit tatsächlichen Standard-Kategorien
const mockCategories = [
  { _id: '1', value: 'music', label: 'Musik', icon: 'FaMusic', isDefault: true },
  { _id: '2', value: 'food', label: 'Essen & Trinken', icon: 'FaUtensils', isDefault: true },
  { _id: '3', value: 'workshop', label: 'Workshop', icon: 'FaUsers', isDefault: true },
  { _id: '4', value: 'other', label: 'Sonstiges', icon: 'FaQuestion', isDefault: true },
  { _id: '5', value: 'custom', label: 'Eigene Kategorie', icon: 'FaStar', isDefault: false }
];

const mockTimeline = {
  _id: 'timeline1',
  days: [
    {
      _id: 'day1',
      title: 'Tag 1',
      description: 'Beschreibung Tag 1',
      date: new Date('2024-04-29'),
      events: [
        {
          time: '10:00',
          title: 'Workshop Event',
          description: 'Beschreibung Workshop',
          categoryId: '3'
        },
        {
          time: '12:00',
          title: 'Mittagessen',
          description: 'Gemeinsames Essen',
          categoryId: '2'
        },
        {
          time: '14:00',
          title: 'Eigenes Event',
          description: 'Beschreibung Eigenes Event',
          categoryId: '5'
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('TimelineManager', () => {
  let alertMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock window.alert
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Reset aller Mocks
    vi.clearAllMocks();
    
    // Mock-Implementierungen
    (loadTimeline as any).mockResolvedValue(mockTimeline);
    (saveTimeline as any).mockResolvedValue(undefined);
    
    // Mock für fetch
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/categories') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories)
        });
      }
      if (url.startsWith('/api/categories?id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    alertMock.mockRestore();
  });

  it('lädt Timeline und Kategorien beim Start', async () => {
    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });
    
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Workshop Event')).toBeInTheDocument();
    expect(screen.getByText('Mittagessen')).toBeInTheDocument();
    expect(screen.getByText('Eigenes Event')).toBeInTheDocument();
    expect(screen.getAllByText('Musik')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Essen & Trinken')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Workshop')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sonstiges')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Eigene Kategorie')[0]).toBeInTheDocument();
  });

  it('fügt ein neues Event hinzu', async () => {
    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });

    // Finde die Inputs über ihre Labels
    const timeInput = screen.getByText('Zeit').nextElementSibling as HTMLInputElement;
    const titleInput = screen.getByText('Titel').nextElementSibling as HTMLInputElement;
    const descriptionInput = screen.getByText('Beschreibung').nextElementSibling as HTMLTextAreaElement;
    const categoryInput = screen.getByText('Kategorie').nextElementSibling as HTMLSelectElement;

    // Fülle das Event-Formular aus
    fireEvent.change(timeInput, { target: { value: '11:00' } });
    fireEvent.change(titleInput, { target: { value: 'Neues Event' } });
    fireEvent.change(descriptionInput, { target: { value: 'Beschreibung' } });
    fireEvent.change(categoryInput, { target: { value: '1' } });

    // Submite das Formular
    fireEvent.click(screen.getByText('Hinzufügen'));

    await waitFor(() => {
      expect(saveTimeline).toHaveBeenCalled();
    });
  });

  it('bearbeitet ein existierendes Event', async () => {
    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });

    // Klicke auf den Bearbeiten-Button des Events
    const editButton = screen.getByTestId('edit-event-0');
    fireEvent.click(editButton);

    // Finde die Inputs über ihre Labels
    const titleInput = screen.getByText('Titel').nextElementSibling as HTMLInputElement;

    // Ändere die Werte
    fireEvent.change(titleInput, { target: { value: 'Geändertes Event' } });

    // Speichere die Änderungen
    fireEvent.click(screen.getByText('Aktualisieren'));

    await waitFor(() => {
      expect(saveTimeline).toHaveBeenCalled();
    });
  });

  it('löscht ein Event', async () => {
    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });

    // Klicke auf den Löschen-Button des Events
    const deleteButton = screen.getByTestId('delete-event-0');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(saveTimeline).toHaveBeenCalled();
    });
  });

  it('zeigt Fehlermeldungen bei ungültigen Eingaben', async () => {
    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });

    // Finde die Inputs über ihre Labels
    const timeInput = screen.getByText('Zeit').nextElementSibling as HTMLInputElement;
    const descriptionInput = screen.getByText('Beschreibung').nextElementSibling as HTMLTextAreaElement;

    // Versuche ein Event ohne Titel zu speichern
    fireEvent.change(timeInput, { target: { value: '11:00' } });
    fireEvent.change(descriptionInput, { target: { value: 'Beschreibung' } });
    
    // Submite das Formular
    fireEvent.submit(screen.getByRole('form'));

    // Warte auf die Fehlermeldung mit role="alert"
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Bitte füllen Sie alle Felder aus');
    });
  });

  it('handhabt API-Fehler korrekt', async () => {
    // Mock API-Fehler
    (saveTimeline as any).mockRejectedValue(new Error('API Fehler'));

    render(<TimelineManager />);
    
    await waitFor(() => {
      expect(loadTimeline).toHaveBeenCalled();
    });

    // Finde die Inputs über ihre Labels
    const timeInput = screen.getByText('Zeit').nextElementSibling as HTMLInputElement;
    const titleInput = screen.getByText('Titel').nextElementSibling as HTMLInputElement;
    const descriptionInput = screen.getByText('Beschreibung').nextElementSibling as HTMLTextAreaElement;

    // Versuche ein Event zu speichern
    fireEvent.change(timeInput, { target: { value: '11:00' } });
    fireEvent.change(titleInput, { target: { value: 'Neues Event' } });
    fireEvent.change(descriptionInput, { target: { value: 'Beschreibung' } });
    fireEvent.click(screen.getByText('Hinzufügen'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Fehler beim Speichern');
    });
  });

  it('sollte eine benutzerdefinierte Kategorie über die UI löschen und Events in "Sonstiges" verschieben', async () => {
    // Mock für fetch
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/categories') {
        const updatedCategories = [...mockCategories];
        // Entferne die benutzerdefinierte Kategorie nach dem Löschen
        if (url.includes('delete')) {
          updatedCategories.pop();
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedCategories)
        });
      }
      if (url.startsWith('/api/categories?id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(<TimelineManager />);
    
    // Warte auf das Laden der Kategorien
    await waitFor(() => {
      const categoryElement = screen.getByText('Eigene Kategorie', { selector: 'span.text-sm' });
      expect(categoryElement).toBeInTheDocument();
    });

    // Klicke auf den Löschen-Button der benutzerdefinierten Kategorie
    const deleteButton = screen.getByTitle('Kategorie löschen');
    fireEvent.click(deleteButton);

    // Warte auf den Bestätigungsdialog
    await waitFor(() => {
      expect(screen.getByText('Kategorie löschen', { selector: 'h3' })).toBeInTheDocument();
    });

    // Bestätige das Löschen
    const confirmButton = screen.getByTestId('confirm-delete-category');
    fireEvent.click(confirmButton);

    // Warte auf die API-Antwort und das Neuladen der Daten
    await waitFor(() => {
      const categoryElement = screen.queryByText('Eigene Kategorie', { selector: 'span.text-sm' });
      expect(categoryElement).not.toBeInTheDocument();
    });

    // Prüfe, ob das Event jetzt die "Sonstiges"-Kategorie hat
    const eventCategory = screen.getByText('Sonstiges', { selector: 'span.text-sm.font-bold' });
    expect(eventCategory).toBeInTheDocument();
  });

  it('sollte einen Fehler anzeigen, wenn das Löschen fehlschlägt', async () => {
    // Mock API-Fehler
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/categories') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories)
        });
      }
      if (url.startsWith('/api/categories?id=')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Fehler beim Löschen' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(<TimelineManager />);
    
    // Warte auf das Laden der Kategorien
    await waitFor(() => {
      expect(screen.getByText('Eigene Kategorie', { selector: 'span.text-sm' })).toBeInTheDocument();
    });

    // Klicke auf den Löschen-Button
    const deleteButton = screen.getByTitle('Kategorie löschen');
    fireEvent.click(deleteButton);

    // Bestätige das Löschen
    const confirmButton = screen.getByTestId('confirm-delete-category');
    fireEvent.click(confirmButton);

    // Warte auf die Fehlermeldung
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Fehler beim Löschen der Kategorie');
    });
  });
}); 