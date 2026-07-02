import semverValid from 'semver/functions/valid.js'
import semverSatisfies from 'semver/functions/satisfies.js'
import type Sedon from '../Sedon.js'
import type {SedonStateExport} from '../Sedon.js'
import {SedonValidationHooks} from './types.js'
import {GraphNodeConstructorWithPack, SedonPackOptions} from '../SedonPack.js'
import {ConnectedElementExport} from '../ConnectedElement.js'
import {GraphNodeExport} from '../GraphNode.js'
import {InputExport} from '../Input.js'

export function validateExportData(exportData: SedonStateExport, hooks: SedonValidationHooks, packs: Sedon['packs'], canvasSize: number) {
  for (const providedPack of exportData.packs) {
    if (!(providedPack.id in packs)) {
      if (!hooks.onMissingPack(exportData, providedPack)) return false
    } else if (
      providedPack.semver && semverValid(providedPack.semver) &&
      !(
        semverValid(packs[providedPack.id].semver) &&
        semverSatisfies(packs[providedPack.id].semver as Exclude<SedonPackOptions['semver'], undefined>, `^${providedPack.semver}`)
      )
    ) {
      if (!hooks.onMissingPack(exportData, providedPack)) return false
    }
  }
  const connectors: Record<string, ConnectedElementExport<any>> = {}
  for (const providedElement of exportData.nodes) {
    if (providedElement.type === 'CanvasElement' || providedElement.type === 'Draggable') {
      // todo
    } else if (providedElement.type === 'GraphNode') {
      const providedNode = providedElement as GraphNodeExport
      if (
        !(providedNode.packId in packs) ||
        !packs[providedNode.packId].nodes.has(providedNode.nodeId)
      ) {
        if (!hooks.onUnknownNode(exportData, providedNode)) return false
      } else if (
        providedNode.position.x < 0 || providedNode.position.x > canvasSize ||
        providedNode.position.y < 0 || providedNode.position.y > canvasSize
      ) {
        if (!hooks.onOutOfBoundsNode(exportData, providedNode, canvasSize)) return false
      } else {
        const NodeConstructor = packs[providedNode.packId].nodes.get(providedNode.nodeId) as GraphNodeConstructorWithPack
        const nodeInstance = new NodeConstructor()
        for (let i = 0; i < providedNode.elementData.length; i++) {
          const providedNodeElement = providedNode.elementData[i]
          const nodeInstanceElement = nodeInstance.elements[i]?.toJSON()
          if (nodeInstanceElement?.type !== providedNodeElement.type) {
            if (!hooks.onMalformedNode(exportData, providedNode, providedNodeElement, nodeInstanceElement)) return false
          }
          if (providedNodeElement.type === 'Input') {
            const providedElementValue = (providedNodeElement as InputExport<any>).value
            const instanceElementValue = (nodeInstanceElement as InputExport<any>).value
            if (!(providedElementValue && typeof providedElementValue === 'object' && 'type' in providedElementValue) /* is not Dynamic */) {
              if (providedElementValue && instanceElementValue && !(
                // todo: does this work with custom datatypes
                typeof instanceElementValue !== typeof instanceElementValue ||
                instanceElementValue.constructor !== instanceElementValue.constructor
                )) {
                if (!hooks.onMalformedNode(exportData, providedNode, providedNodeElement, nodeInstanceElement)) return false
              }
            }
          }
          if ('connections' in providedNodeElement)
            connectors[providedNodeElement.id] = providedNodeElement
        }
      }
    } else {
      if (!hooks.onUnknownElement(exportData, providedElement)) return false
    }
  }
  // todo also reject loops here
  const connections: Record<string, string> = {}
  for (const connectorId in connectors) {
    const connector = connectors[connectorId]
    for (const connection of connector.connections) {
      if (!(connection in connectors)) {
        if (!hooks.onUnknownConnector(exportData, connection)) return false
      } else if (connector.type === connectors[connection].type) {
        if (!hooks.onInvalidConnection(exportData, connector.id, connection)) return false
      } else if (connector.type === 'Input' && connector.id in connections && connections[connector.id] !== connection) {
        if (!hooks.onMultipleConnected(exportData, connector as InputExport<any>)) return false
      } else if (connectors[connection].type === 'Input' && connection in connections && connections[connection] !== connector.id) {
        if (!hooks.onMultipleConnected(exportData, connectors[connection] as InputExport<any>)) return false
      }
      connections[connector.id] = connection
      connections[connection] = connector.id
    }
  }
  return true
}
