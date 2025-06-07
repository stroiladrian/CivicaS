export interface User {
  author: string
  username: string
  coordinates: [number, number]
}

export interface Contributor {
  author: string
  username: string
  value: number
}

export enum ELeaderKeys {
  Pins = 'Pins',
  Distance = 'Distance'
}
