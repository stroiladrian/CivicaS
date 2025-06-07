import { useState, useMemo } from 'react'
import { ELeaderKeys } from './types'
import { PLACES } from '../../utils/places'
import {
  makeContributions,
  getOrdinals,
  getUsername,
  getBarStyle,
  getWidth,
  Contribution
} from '../../utils/contributions'
import { ETheme } from 'src/lib/types'
import styles from './style.module.css'

interface ContributionsProps {
  theme: ETheme
}

export default function Contributions({ theme }: ContributionsProps) {
  const [leaderKey, setLeaderKey] = useState<ELeaderKeys>(ELeaderKeys.Pins)

  function sortContributions(leaderKey: string): Contribution[] {
    return makeContributions(PLACES, leaderKey).sort((a, b) => {
      return b.value - a.value
    })
  }

  const sortedContributions = sortContributions(leaderKey)
  const maxValue = useMemo(() => Math.max(...sortedContributions.map(c => c.value)), [sortedContributions])

  return (
    <div className={styles.contributions}>
      <h2>Contributions</h2>
      <div className={styles.contributionList}>
        {sortedContributions.map((contribution, index) => (
          <div className={styles.line} key={index}>
            <div className={styles.info}>
              <div className={styles.position}>
                {getOrdinals(index)}
              </div>
              <a
                className={styles.name}
                href={`https://github.com/${getUsername(contribution.name)}`}
                title={`Go to ${contribution.name}'s GitHub`}
              >
                {contribution.name}
                <div className={styles.username}>
                  @{getUsername(contribution.name)}
                </div>
              </a>
              <div className={styles.number}>
                {contribution.value} points
              </div>
            </div>
            <div className={styles.barContainer}>
              <div style={getBarStyle(contribution.value, maxValue)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
