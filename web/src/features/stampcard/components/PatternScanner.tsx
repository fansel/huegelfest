"use client";
import React, { useRef, useState } from "react";
import { useStampCard } from "../hooks/useStampCard";

export interface PatternScannerProps {
  onStampCollected?: (stamp: string) => void;
}

// Demo-Pattern: 8 Punkte, z.B. [1,0,1,0,1,0,1,0]
const DEMO_PATTERN = [true, false, true, false, true, false, true, false];
const POINTS_COUNT = 8;

/**
 * PatternScanner: Zeigt einen Kamera-Stream, macht einen Snapshot und erkennt Punkte im Kreis um das Badge.
 * Bei Übereinstimmung mit DEMO_PATTERN wird der Stempel vergeben.
 */
export const PatternScanner: React.FC<PatternScannerProps> = ({ onStampCollected }) => {
  const { addStamp } = useStampCard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kamera starten
  const startCamera = async () => {
    setError(null);
    setSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (e) {
      setError("Kamera konnte nicht gestartet werden.");
    }
  };

  // Kamera stoppen
  const stopCamera = () => {
    setStreaming(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Snapshot & Pattern-Erkennung
  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setSuccess(false);
    try {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas-Kontext fehlt");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Punkt-Erkennung (MVP: Sample an festen Kreispositionen)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;
      const detected: boolean[] = [];
      for (let i = 0; i < POINTS_COUNT; i++) {
        const angle = (2 * Math.PI * i) / POINTS_COUNT - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        // Sample ein kleines Quadrat um die erwartete Position
        const size = 12;
        const imgData = ctx.getImageData(x - size / 2, y - size / 2, size, size);
        // Durchschnittliche Helligkeit berechnen
        let sum = 0;
        for (let j = 0; j < imgData.data.length; j += 4) {
          const r = imgData.data[j];
          const g = imgData.data[j + 1];
          const b = imgData.data[j + 2];
          sum += (r + g + b) / 3;
        }
        const avg = sum / (imgData.data.length / 4);
        // Schwellenwert: Punkt ist "an", wenn dunkel
        detected.push(avg < 100);
      }
      // Vergleich mit DEMO_PATTERN
      const match = detected.every((v, i) => v === DEMO_PATTERN[i]);
      if (match) {
        await addStamp("nachteule");
        setSuccess(true);
        onStampCollected?.("nachteule");
      } else {
        setError("Pattern stimmt nicht überein.");
      }
    } catch (e) {
      setError("Fehler beim Scannen des Patterns.");
    } finally {
      setScanning(false);
      stopCamera();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {!streaming ? (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={startCamera}
        >
          Kamera starten
        </button>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline width={240} height={180} className="rounded border mb-2" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? "Scanne..." : "Snapshot & Pattern prüfen"}
          </button>
          <button
            className="px-2 py-1 mt-1 text-xs text-gray-500 underline"
            onClick={stopCamera}
          >
            Kamera stoppen
          </button>
        </>
      )}
      {success && <span className="text-green-600 animate-bounce">Pattern erkannt! Nachteule-Stempel gesammelt!</span>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}; 