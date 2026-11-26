import { ExportImages } from 'warframe-public-export-plus'
import { fetchAsyncText } from '../../utils/http'

export async function fetchWorldStateJson(): Promise<string | undefined> {
  return fetchAsyncText('https://api.warframe.com/cdn/worldState.php')
}

export function getPublicExportImageUrl(iconPath: string): string | undefined {
  const hash = ExportImages[iconPath]?.contentHash
  if (hash)
    return `https://content.warframe.com/PublicExport${iconPath}!${hash}`
}
