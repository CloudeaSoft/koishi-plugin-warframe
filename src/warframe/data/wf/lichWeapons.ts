import { rivenPublicExport } from '../../assets'

// Fixed vendor inventories from the Wiki reset tables and TennoStats' Coda schedule.
export const tenetWeapons = ['Tenet Ferrox', 'Tenet Grigori', 'Tenet Livia', 'Tenet Exec', 'Tenet Agendus']
export const codaWeapons = {
  A: ['Coda Hema', 'Coda Sporothrix', 'Coda Catabolyst', 'Coda Pox', 'Dual Coda Torxica', 'Coda Mire', 'Coda Motovore'],
  B: ['Coda Bassocyst', 'Coda Bubonico', 'Coda Synapse', 'Coda Tysis', 'Coda Caustacyst', 'Coda Hirudo', 'Coda Pathocyst'],
}

const vendorNames = new Set([...tenetWeapons, ...codaWeapons.A, ...codaWeapons.B])
export const lichWeaponNamesZh = new Map(rivenPublicExport.weapons
  .filter(weapon => vendorNames.has(weapon.name))
  .map(weapon => [weapon.name, rivenPublicExport.weaponNamesZh[weapon.uniqueName] ?? weapon.name]))
