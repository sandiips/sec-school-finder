'use client';

import { ReactNode } from 'react';
import Navigation from '@/components/ui/Navigation';

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
