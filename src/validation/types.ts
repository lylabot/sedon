import type {SedonStateExport} from '../Sedon.js'
import type {GraphNodeExport} from '../GraphNode.js'
import type {NodeElementExport} from '../NodeElement.js'
import {InputExport} from '../Input.js'

export type SedonValidationStrategy<Args extends Array<any>, Fixable extends boolean = false> =
  ((exportData: SedonStateExport, ...args: Args) => any) |
  (Fixable extends true ? 'fix' : never) |
  'warn' | 'reject'

export interface SedonValidationStrategies {
  /** Called when no compatible pack was registered for a pack given in the data */
  onMissingPack: SedonValidationStrategy<[pack: SedonStateExport['packs'][number]]>,
  /** Called when a node type wasn't found for a pack given in the data */
  onUnknownElement: SedonValidationStrategy<[element: unknown], true>,
  onUnknownNode: SedonValidationStrategy<[node: GraphNodeExport], true>,
  onOutOfBoundsNode: SedonValidationStrategy<[node: GraphNodeExport, canvasSize: number], true>,
  onMalformedNode: SedonValidationStrategy<[
    node: GraphNodeExport,
    element: NodeElementExport,
    expected: Pick<NodeElementExport, 'type'> & { value?: any }
  ], true>,
  onUnknownConnector: SedonValidationStrategy<[connectorId: string], true>,
  onInvalidConnection: SedonValidationStrategy<[connectorId: string, connectorId: string], true>,
  /** Called when multiple outputs connect to a single input */
  onMultipleConnected: SedonValidationStrategy<[input: InputExport<any>], true>,
}

export const allHooks = [
  'onMissingPack', 'onUnknownElement',
  'onUnknownNode', 'onOutOfBoundsNode', 'onMalformedNode',
  'onUnknownConnector', 'onInvalidConnection', 'onMultipleConnected',
] satisfies (keyof SedonValidationStrategies)[]
export const minorMalformations = [
  'onUnknownElement', 'onOutOfBoundsNode', 'onMalformedNode', 'onUnknownConnector',
] satisfies (keyof SedonValidationStrategies)[]

export type SedonValidationHooks = {
  [K in keyof SedonValidationStrategies]: Exclude<SedonValidationStrategies[K], string>
}

export enum SedonValidationPresets {
  /** Reject any malformation */
  strict = 'strict',
  /** Reject only severe malformations, output warning for minor ones */
  tolerant = 'tolerant',
  /** Reject only severe malformations, auto-fix minor ones */
  tolerantFix = 'tolerant-fix',
  /** Output warnings for any malformation */
  warn = 'warn',
  /** Auto-fix any fixable malformation; This might lead to unwanted behaviour. Only "missing pack" is not fixable. */
  fix = 'fix',
}

export type SedonValidationOptions = SedonValidationStrategies | {
  preset: SedonValidationPresets
}

export type ObjectFromEntriesType = <K extends PropertyKey, T>(entries: Iterable<readonly [K, T]>) => { [k in K]: T; }
export type ObjectEntriesType = <K extends PropertyKey, T>(obj: { [k in K]: T; }) => Iterable<readonly [K, T]>
