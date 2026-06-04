import { SavedGame } from '../types/game';

export type RootStackParamList = {
  Menu: undefined;
  Game: undefined;
  Result: { savedGame?: SavedGame } | undefined;
  History: undefined;
  Inspect: { savedGame: SavedGame };
};
