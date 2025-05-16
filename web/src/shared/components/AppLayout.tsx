import React from 'react';
import PWAContainer from './PWAContainerServer';

interface AppLayoutProps {
  children: React.ReactNode;
  hideMusicNote?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <>
      <PWAContainer />
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
    </>
  );
};

export default AppLayout; 