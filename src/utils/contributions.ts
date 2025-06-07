import { PLACES } from './places'

export interface Contribution {
  value: number;
  name: string;
  leaderKey: string;
}

export function makeContributions(places: any[], leaderKey: string): Contribution[] {
  return places.map(place => ({
    value: place[leaderKey] || 0,
    name: place.name,
    leaderKey
  }))
} 