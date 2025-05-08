import { useState, useEffect, useCallback } from "react";

export type StampType = "nachteule"; // Für Erweiterung: | "rakete" | "pilz" ...

/**
 * Holt und verwaltet die gesammelten Stempel des Users.
 * Nutzt Server Actions für persistente Speicherung.
 */
export function useStampCard() {
  const [collectedStamps, setCollectedStamps] = useState<StampType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lädt die Stempel beim Mount
  useEffect(() => {
    async function fetchStamps() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Server Action aufrufen, die die Stempel für den User zurückgibt
        // Platzhalter: localStorage für Demo
        const data = localStorage.getItem("stampcard");
        setCollectedStamps(data ? (JSON.parse(data) as StampType[]) : []);
      } catch (e) {
        setError("Fehler beim Laden der Stempel.");
      } finally {
        setLoading(false);
      }
    }
    fetchStamps();
  }, []);

  // Fügt einen Stempel hinzu (und speichert ihn)
  const addStamp = useCallback(async (stamp: StampType) => {
    setError(null);
    try {
      if (!collectedStamps.includes(stamp)) {
        const newStamps = [...collectedStamps, stamp];
        setCollectedStamps(newStamps);
        // TODO: Server Action aufrufen, um Stempel zu speichern
        // Platzhalter: localStorage für Demo
        localStorage.setItem("stampcard", JSON.stringify(newStamps));
      }
    } catch (e) {
      setError("Fehler beim Speichern des Stempels.");
    }
  }, [collectedStamps]);

  return { collectedStamps, loading, error, addStamp };
} 