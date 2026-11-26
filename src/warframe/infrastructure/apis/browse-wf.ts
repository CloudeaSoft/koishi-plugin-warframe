import type { OracleBountyCycle } from '../../types'
import { fetchAsyncData } from '../../utils/http'

export async function fetchOracleBountyCycle(): Promise<OracleBountyCycle | undefined> {
  return fetchAsyncData<OracleBountyCycle>('https://oracle.browse.wf/bounty-cycle')
}

export function getBrowseImageUrl(iconPath: string): string {
  return `https://browse.wf${iconPath}`
}
