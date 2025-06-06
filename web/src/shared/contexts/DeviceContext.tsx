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
      // Verbesserte Mobile-Erkennung mit mehreren Faktoren
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isMediumScreen = window.innerWidth < 1024;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Mobile wenn:
      // 1. Touch-fähig UND (kleiner Bildschirm ODER mobile User Agent)
      // 2. ODER kleiner Bildschirm (unter 768px)
      // 3. ODER definitiv mobile User Agent (auch auf größeren Bildschirmen)
      const isMobile = 
        (hasTouch && (isSmallScreen || isMobileUA)) || 
        isSmallScreen || 
        (isMobileUA && isMediumScreen); // Tablets mit mobilen UA auch als mobile behandeln
      
      setDeviceType(isMobile ? "mobile" : "desktop");
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





