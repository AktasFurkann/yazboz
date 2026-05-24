import React, { createContext, useContext } from 'react';
import { useGame, UseGameReturn } from '../hooks/useGame';

const GameContext = createContext<UseGameReturn | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const game = useGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};

export const useGameContext = (): UseGameReturn => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameContext must be used inside GameProvider');
  }
  return ctx;
};
