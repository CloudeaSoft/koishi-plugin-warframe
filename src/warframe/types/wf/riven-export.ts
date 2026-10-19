export interface RivenExportEntry {
  tag: string
  prefixTag?: string
  suffixTag?: string
  upgradeValues: { value: number, locTag?: string, reverseValueSymbol?: boolean }[]
}

export interface RivenExportDefinition {
  uniqueName: string
  upgradeEntries: RivenExportEntry[]
}

export interface RivenExportWeapon {
  uniqueName: string
  name: string
  productCategory: string
  omegaAttenuation: number
  primeOmegaAttenuation?: number
  slot?: number
}

export interface RivenPublicExport {
  schemaVersion: number
  downloadedAt: string
  sources: Record<string, { url: string, sha256: string, bytes: number }>
  upgrades: RivenExportDefinition[]
  upgradesZh: RivenExportDefinition[]
  weapons: RivenExportWeapon[]
  weaponNamesZh: Record<string, string>
}
