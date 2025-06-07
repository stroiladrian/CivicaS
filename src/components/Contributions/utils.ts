import { IPin } from 'src/lib/types'
import styles from './style.module.css'
import { Contributor, User } from './types'
import { getDistance } from 'src/lib/utils'

interface Place {
  author: string | string[];
  username: string | string[];
  coordinates: [number, number];
  value: number;
}

function getSet(arr: User[]) {
  return arr.filter(
    (v, i, a) =>
      a.findIndex((v2) => ['username'].every((k) => v2[k] === v[k])) === i
  )
}

function sortByDistance(a: User, b: User) {
  const d1 = getDistance(a.coordinates)
  const d2 = getDistance(b.coordinates)
  return d2 - d1
}

export function makeContributions(places: Place[], leaderKey: string): User[] {
  const users: User[] = []
  const sortedPlaces = [...places].sort((a, b) => b.value - a.value)

  for (let i = 0; i < sortedPlaces.length; i++) {
    if (Array.isArray(sortedPlaces[i].username)) {
      for (let j = 0; j < sortedPlaces[i].username.length; j++) {
        const author = Array.isArray(sortedPlaces[i].author) 
          ? sortedPlaces[i].author[j] 
          : sortedPlaces[i].author
        const username = sortedPlaces[i].username[j]
        
        users.push({
          author: author,
          username: username,
          coordinates: sortedPlaces[i].coordinates
        })
      }
    } else {
      const author = Array.isArray(sortedPlaces[i].author) 
        ? sortedPlaces[i].author[0] 
        : sortedPlaces[i].author
      const username = sortedPlaces[i].username
      
      users.push({
        author: author,
        username: username,
        coordinates: sortedPlaces[i].coordinates
      })
    }
  }

  return users
}

export function getOrdinals(index: number): string {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th']
  return ordinals[index] || `${index + 1}th`
}

export function getBarStyle(index: number): string {
  const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336']
  return colors[index % colors.length]
}

export function getWidth(index: number, sortedPlaces: Place[]): string {
  const maxValue = Math.max(...sortedPlaces.map(place => place.value))
  const value = sortedPlaces[index].value
  const percentage = (value / maxValue) * 100
  return `${percentage}%`
}

export function getUsername(index: number, sortedPlaces: Place[]): string {
  const place = sortedPlaces[index]
  if (Array.isArray(place.username)) {
    return place.username[0]
  }
  return place.username
}
