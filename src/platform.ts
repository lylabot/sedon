export enum Platform {
  WINDOWS = 'windows',
  MAC = 'mac',
  UNKNOWN = 'unknown'
}

export function getPlatform() {
  if (navigator.platform.toLowerCase().includes('win')) return Platform.WINDOWS
  else if (navigator.platform.toLowerCase().includes('mac')) return Platform.MAC
  else return Platform.UNKNOWN
}
