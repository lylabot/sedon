import {
  allHooks,
  minorMalformations,
  ObjectEntriesType,
  ObjectFromEntriesType,
  SedonValidationHooks,
  SedonValidationOptions,
  SedonValidationPresets,
  SedonValidationStrategies
} from './types.js'
import {GraphNodeExport} from '../GraphNode.js'

const warnMessage = {
  onMissingPack: (_, pack) =>
    `Pack ${pack.name}${pack.semver ? ` at version ${pack.semver}` : ''} not registered. Make sure to register packs *before* importing data.`,
  onUnknownElement: (_, element) =>
    `Unknown element${(element && typeof element === 'object' && 'type' in element) ? ` of type "${element.type}"` : ''} imported`,
  onUnknownNode: (_, node) => `Node with id \`${node.nodeId}\` (pack id: \`${node.packId}\`) does not appear in any registered pack. Make sure to register packs *before* importing data.`,
  onOutOfBoundsNode: (_, node) =>
    `Node with id \`${node.nodeId}\` is positioned out of canvas' bounds.`,
  onMalformedNode: (_, node, element) =>
    `Node with id \`${node.nodeId}\` is malformed at element index ${node.elementData.indexOf(element)}`,
  onUnknownConnector: (_, connectorId) =>
    `Connector \`${connectorId}\` not found.`,
  onInvalidConnection: (_, connectorIdA, connectorIdB) =>
    `Connection from connector \`${connectorIdA}\` to \`${connectorIdB}\` is invalid (likely an input <-> input or output <-> output connection).`,
  onMultipleConnected: (_, input) =>
    `Multiple connectors connected to input with id \`${input.id}\`.`,
} satisfies SedonValidationHooks
const fixHooks = {
  onMissingPack: (_e, _pack) => {
    // basically just ignore, the fixing happens in onUnknownNode then
  },
  onUnknownElement: (e, element) => {
    const index = e.nodes.indexOf(element as any)
    if (index !== -1) {
      e.nodes.splice(index, 1)
    }
  },
  onUnknownNode: (e, node) => {
    fixHooks.onUnknownElement(e, node)
  },
  onOutOfBoundsNode: (_, node, canvasSize) => {
    node.position.x = Math.max(0, node.position.x)
    node.position.x = Math.min(node.position.x, canvasSize)
    node.position.y = Math.max(0, node.position.y)
    node.position.y = Math.min(node.position.y, canvasSize)
  },
  onMalformedNode: (_e, _node, element, expected) => {
    element.type = expected.type
    if (!('value' in element)) return
    const elementValueIsDynamic = element.value && typeof element.value === 'object' && 'type' in element.value
    const expectedValueIsDynamic = expected.value && typeof expected.value === 'object' && 'type' in expected.value
    if (!elementValueIsDynamic && !expectedValueIsDynamic && !(
      typeof element !== typeof expected ||
      expected.constructor !== expected.constructor
    )) {
      element.value = expected.value
    }
  },
  onUnknownConnector: (e, connectorId) => {
    for (const node of e.nodes) {
      if (node.type !== 'GraphNode') continue
      for (const element of (node as GraphNodeExport).elementData) {
        if (!('connections' in element)) continue
        element.connections = element.connections.filter(connection => connection !== connectorId)
      }
    }
  },
  onInvalidConnection: (e, connectorIdA, connectorIdB) => {
    for (const node of e.nodes) {
      if (node.type !== 'GraphNode') continue
      for (const element of (node as GraphNodeExport).elementData) {
        if (!('connections' in element) || (element.id !== connectorIdA && element.id !== connectorIdB)) continue
        element.connections = element.connections.filter(connection => connection !== connectorIdA && connection !== connectorIdB)
      }
    }
  },
  onMultipleConnected: (e, output) => {
    const originalConnections = output.connections
    output.connections = [originalConnections.shift() as string]
    for (const connection of originalConnections) {
      fixHooks.onInvalidConnection(e, output.id, connection)
    }
  },
} satisfies SedonValidationHooks

function warnHook(message: string) {
  console.warn(message)
  return true
}

function rejectHook(message: string) {
  console.error(message)
  return false
}

export function validationOptionsToHooks(options?: SedonValidationOptions) {
  options ??= {preset: SedonValidationPresets.tolerant}
  let strategies: SedonValidationStrategies
  if ('preset' in options) {
    strategies = (Object.fromEntries as ObjectFromEntriesType)(
      allHooks.map(key => {
        let strategy: SedonValidationStrategies[keyof SedonValidationStrategies] = 'warn'
        if (options.preset === SedonValidationPresets.strict) {
          strategy = 'reject'
        } else if (options.preset === SedonValidationPresets.tolerant) {
          // @ts-ignore idk why .includes() requires searchElement to be in the array, it makes zero sense
          if (!minorMalformations.includes(key)) {
            strategy = 'reject'
          }
        } else if (options.preset === SedonValidationPresets.tolerantFix) {
          // @ts-ignore
          if (!minorMalformations.includes(key)) {
            strategy = 'reject'
          } else {
            strategy = 'fix'
          }
        } else if (options.preset === SedonValidationPresets.warn) {
          strategy = 'warn'
        } else if (options.preset === SedonValidationPresets.fix) {
          strategy = key === 'onMissingPack' ? 'warn' : 'fix'
        }
        return [key, strategy]
      })
    ) as SedonValidationStrategies
  } else {
    strategies = options
  }
  return (Object.fromEntries as ObjectFromEntriesType)(
    Array.from((Object.entries as ObjectEntriesType)(strategies)).map(([key, strategy]) => {
      let callback: SedonValidationHooks[typeof key] = (...args: Parameters<SedonValidationHooks[typeof key]>) =>
        warnHook(warnMessage[key](
          // @ts-ignore TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
          // im done with you FUCK TYPESCRIPT IT WILL RUN ANYWAY JUST TS-IGNORE EVERYWHERE
          ...args
        ))
      if (typeof strategy === 'function') {
        callback = strategy
      } else if (strategy === 'reject') {
        callback = (...args: Parameters<SedonValidationHooks[typeof key]>) =>
          rejectHook(warnMessage[key](
            // @ts-ignore
            ...args
          ))
      } else if (strategy === 'fix') {
        callback = (...args: Parameters<SedonValidationHooks[typeof key]>) => {
          fixHooks[key](
            // @ts-ignore
            ...args
          )
          return true
        }
      }
      return [key, callback]
    })
  ) as SedonValidationHooks
}
