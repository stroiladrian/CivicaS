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

export function getOrdinals(index: number): string {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
  return ordinals[index] || `${index + 1}th`
}

export function getUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function getBarStyle(value: number, maxValue: number): React.CSSProperties {
  const percentage = (value / maxValue) * 100
  return {
    width: `${percentage}%`,
    backgroundColor: '#4CAF50',
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease-in-out'
  }
}

export function getWidth(value: number, maxValue: number): string {
  const percentage = (value / maxValue) * 100
  return `${percentage}%`
} 