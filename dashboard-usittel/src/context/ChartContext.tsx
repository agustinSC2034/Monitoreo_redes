'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface ChartContextType {
  isAnyChartLoading: boolean;
  setChartLoading: (sensorId: string, loading: boolean) => void;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

export function ChartProvider({ children }: { children: ReactNode }) {
  const [loadingCharts, setLoadingCharts] = useState<Set<string>>(new Set());

  const setChartLoading = (sensorId: string, loading: boolean) => {
    setLoadingCharts(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(sensorId);
      } else {
        newSet.delete(sensorId);
      }
      return newSet;
    });
  };

  const isAnyChartLoading = loadingCharts.size > 0;

  return (
    <ChartContext.Provider value={{ isAnyChartLoading, setChartLoading }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChartContext() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartContext must be used within ChartProvider');
  }
  return context;
}
