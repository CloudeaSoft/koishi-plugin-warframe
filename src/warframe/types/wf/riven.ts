import type { RivenAttributeUnit } from '../wfm'
import type { RivenExportWeapon } from './riven-export'

export type RivenWeaponType = 'Rifle' | 'Shotgun' | 'Pistol' | 'Archgun' | 'Melee' | 'Kitgun' | 'Zaw'
export interface RivenCalculationAttribute {
  gameRef?: string
  unit?: RivenAttributeUnit
  i18n?: { 'en'?: { name?: string }, 'zh-hans'?: { name?: string } }
}
export type RivenStatCountType = '31' | '2' | '21' | '3'

export interface RivenStatFixFactor {
  buffFactor: number
  buffCount: number
  curseFactor: number
  curseCount: number
}

export type RivenStatFixFactorMap = Record<RivenStatCountType, RivenStatFixFactor>

export interface RivenStatAnalyzsis {
  name: string
  unit: RivenAttributeUnit
  percent: number
  value: number
  max: number
  min: number
}

export interface RivenStatAnalyzeResult {
  notes?: string[]
  name: string
  disposition: number
  buffs: RivenStatAnalyzsis[]
  curses: RivenStatAnalyzsis[]
}

export interface RivenWeaponDisposition {
  name: {
    en: string
    zh: string
  }
  calc: {
    disposition: number
    name: string
    texture: string
    riventype: string
  }
  weapon: RivenExportWeapon
}

export interface RivenStatResult {
  notes?: string[]
  positive: Record<
    string,
    { name: string, max: number, min: number, unit: RivenAttributeUnit }
  >
  negative:
    | Record<
      string,
      { name: string, max: number, min: number, unit: RivenAttributeUnit }
    >
    | undefined
}
