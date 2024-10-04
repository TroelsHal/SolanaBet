import { tournaments } from "../data/tournamentsData";
import { UnknownTournamentError } from "../types/errors";


export const findTournamentByCode = (code: string): string => {
  const tournament = Object.keys(tournaments).find(
    (tournament) => tournaments[tournament][0] === code
  );
  if (!tournament) {
    throw new UnknownTournamentError(); 
  }
  return tournament;};


export const findCodeByTournament = (tournamentName: string): string => {
  const shortCode = tournaments[tournamentName]?.[0];
  if (!shortCode) {
    throw new UnknownTournamentError();
  }
  return shortCode;
};
