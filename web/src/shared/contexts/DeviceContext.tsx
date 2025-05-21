"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type DeviceType = "mobile" | "desktop";
type DisplayMode = "standalone" | "browser";

interface DeviceContextProps {
  deviceType: DeviceType;
  displayMode: DisplayMode;
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined);

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) throw new Error("useDeviceContext must be used within DeviceProvider");
  return context;
};

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("browser");

  useEffect(() => {
    const updateDeviceType = () => {
      setDeviceType(window.innerWidth < 768 ? "mobile" : "desktop");
    };

    updateDeviceType(); // initial check
    window.addEventListener("resize", updateDeviceType); // listen to resizes

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setDisplayMode(standalone ? "standalone" : "browser");

    return () => {
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  return (
    <DeviceContext.Provider value={{ deviceType, displayMode }}>
      {children}
    </DeviceContext.Provider>
  );
};





