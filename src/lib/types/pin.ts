import { ETheme } from "./theme"

export enum EPinType {
  Place = 'place',
  Event = 'event',
  Memory = 'memory',
  Story = 'story'
}

export interface IPin {
  author: string | string[]
  username: string | string[]
  title?: string
  city: string
  country: string
  coordinates: [number, number]
  date: string
  photo: string
  type?: EPinType
  streetview?: string
  theme?: ETheme
}
