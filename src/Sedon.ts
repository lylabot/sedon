import {createTravels, Travels} from 'travels'
import debounce from 'lodash.debounce'
import {element, sedonClassPrefix} from './dom.js'
import Canvas from './Canvas.js'
import AddMenu from './menus/AddMenu.js'
import GraphNode, {GraphNodeExport} from './GraphNode.js'
import CanvasElement, {CanvasElementExport} from './CanvasElement.js'
import Draggable, {DraggableExport} from './Draggable.js'
import {SedonPack, SedonPackOptions} from './SedonPack.js'
import Connector, {ConnectorSignals} from './Connector.js'
import Input, {InputExport} from './Input.js'
import Output, {OutputExport} from './Output.js'
import Wire, {ChangeSignal, TranslateSignal} from './Wire.js'
import {SedonValidationOptions, SedonValidationPresets} from './validation/types.js'
import {validationOptionsToHooks} from './validation/options.js'
import {validateExportData} from './validation/validation.js'
import {getPlatform, Platform} from './platform'
import {InteractionHints, SedonMainHints} from './InteractionHints'
import baseStyles from '../styles/base-styles'
import sedonClassic from '../styles/sedon-classic/sedon-classic'

export interface SedonStateExport {
  version: '1.0'
  nodes: Array<CanvasElementExport | DraggableExport | GraphNodeExport>
  packs: Array<Pick<SedonPackOptions, 'id' | 'name' | 'semver'>>
}

const EXPORT_VERSION = '1.0'

const attachCss = (element: HTMLElement, id: string, css: string) => {
  const styleElement: HTMLStyleElement = element.querySelector(`style#${id}`) ?? document.createElement('style')
  styleElement.id = id
  styleElement.innerHTML = '@scope {' + css + '}'
  element.insertAdjacentElement('beforebegin', styleElement)
}

export default class Sedon {
  public rootElement: HTMLDivElement
  public canvas: Canvas
  public addMenu: AddMenu
  private packs: Record<string, SedonPack>
  public wire: Wire<ConnectorSignals | TranslateSignal | ChangeSignal>
  public on: typeof this.wire.on
  private state: Travels<SedonStateExport['nodes']>
  private interactionHints: InteractionHints

  constructor(rootElement: HTMLDivElement, options?: { style?: 'base-only' | 'classic' }) {
    this.rootElement = rootElement
    this.rootElement.setAttribute('lang', 'en')
    this.rootElement.setAttribute('tabindex', '0')
    this.rootElement.classList.add(sedonClassPrefix + 'container')

    options ??= {}
    options.style ??= 'classic'
    attachCss(this.rootElement, `${sedonClassPrefix}style-base`, baseStyles)
    if (options.style === 'base-only') {
    } else if (options.style === 'classic') {
      attachCss(this.rootElement, `${sedonClassPrefix}style-classic`, sedonClassic)
    }

    // element('div', {className: 'toolbar'}, this.rootElement)
    this.interactionHints = new InteractionHints(SedonMainHints)
    this.rootElement.append(this.interactionHints.element)

    this.canvas = new Canvas(this)
    this.addMenu = new AddMenu(this)
    this.packs = {}
    this.wire = new Wire()
    this.on = this.wire.on.bind(this.wire)

    this.state = createTravels(this.save().nodes)

    this.on('change', debounce(() => {
      this.state.setState(this.save().nodes)
    }, 200, {leading: false, trailing: true}))

    const loadState = (state: SedonStateExport['nodes']) => {
      this.wire.suspend()
      this.clear()
      this.load({
        version: EXPORT_VERSION,
        nodes: state,
        packs: []
      }, {preset: SedonValidationPresets.warn})
      this.wire.resume()
    }

    this.rootElement.addEventListener('keydown', e => {
      const isCmdPressed = getPlatform() === Platform.MAC ? e.metaKey : e.ctrlKey
      const isAltPressed = e.altKey
      const isShiftPressed = e.shiftKey
      const isCtrlPressed = getPlatform() === Platform.MAC ? e.ctrlKey : false
      if (isCmdPressed && !isAltPressed && !isShiftPressed && !isCtrlPressed) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (this.state.canBack()) {
            this.state.back()
            loadState(this.state.getState())
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault()
          if (this.state.canForward()) {
            this.state.forward()
            loadState(this.state.getState())
          }
        } else if (isCmdPressed && !isAltPressed && isShiftPressed && !isCtrlPressed) {
          if (e.key.toLowerCase() === 'z') {
            e.preventDefault()
            if (this.state.canForward()) {
              this.state.forward()
              loadState(this.state.getState())
            }
          }
        } else return
      }
    })
  }

  clear() {
    for (let i = this.canvas.attached.length - 1; i >= 0; i--) {
      this.canvas.attached[i].delete()
    }
  }

  clearHistory() {
    this.state = createTravels(this.save().nodes)
  }

  registerPack(pack: SedonPack) {
    const packSection = this.addMenu.addSection(pack.name)
    this.packs[pack.id] = pack
    const defaultGroupName = Symbol.for('default')
    const groups: Record<string | typeof defaultGroupName, (typeof pack.nodes extends Map<any, infer T> ? T : never)[]> = {
      [defaultGroupName]: []
    }
    pack.nodes.forEach(node => {
      const group = node.group ?? defaultGroupName
      groups[group] ??= []
      groups[group].push(node)
    })
    groups[defaultGroupName].forEach(node => {
      this.addMenu.addNodeType(node, packSection)
    })
    Object.keys(groups).sort().forEach(groupName => {
      if (pack.groupsAsSubmenus) {
        const groupSection = this.addMenu.addSection(groupName, packSection)
        groups[groupName].forEach(node => {
          this.addMenu.addNodeType(node, groupSection)
        })
      } else {
        this.addMenu.createListSeparator(groupName, packSection)
        groups[groupName].forEach(node => {
          this.addMenu.addNodeType(node, packSection)
        })
      }
    })
  }

  save(): SedonStateExport {
    const nodes = this.canvas.attached.map(node => node.toJSON())
    const packIds = new Set<string>()
    for (const node of nodes) {
      if (!('packId' in node)) continue
      packIds.add((node as GraphNodeExport).packId)
    }
    return {
      version: EXPORT_VERSION,
      nodes, packs: Array.from(packIds.values().map(packId => {
        const {name, id, semver} = this.packs[packId]
        const data: SedonStateExport['packs'][number] = {name, id}
        if (semver) data.semver = semver
        return data
      }))
    }
  }

  validate(exportData: SedonStateExport, options?: SedonValidationOptions) {
    const hooks = validationOptionsToHooks(options)
    return validateExportData(exportData, hooks, this.packs, this.canvas.size)
  }

  load(exportData: SedonStateExport, validate?: SedonValidationOptions | false) {
    if (validate !== false && !this.validate(exportData, validate)) throw new Error('Provided `exportData` is malformed or invalid')

    const connectors = new Map<string, Connector<any>>()

    for (const element of exportData.nodes) {
      if (element.type === 'CanvasElement') {
        this.canvas.attach(CanvasElement.fromJSON(element as CanvasElementExport))
      } else if (element.type === 'Draggable') {
        this.canvas.attach(Draggable.fromJSON(element as DraggableExport))
      } else if (element.type === 'GraphNode') {
        const nodeData = element as GraphNodeExport
        const constructor = this.packs[nodeData.packId].nodes.get(nodeData.nodeId)
        if (!constructor) continue
        const node = GraphNode.fromJSON(Object.assign({constructor}, nodeData))
        node.attachToCanvas(this.canvas)
        node.elements.forEach(element => {
          if (element instanceof Input || element instanceof Output) {
            connectors.set(element.id, element.connector)
          }
        })
        for (const nodeElement of nodeData.elementData) {
          if (nodeElement.type !== 'Input' && nodeElement.type !== 'Output') continue
          const inOutPut = nodeElement as InputExport<any> | OutputExport<any>
          const connectorA = connectors.get(inOutPut.id)
          if (!connectorA) continue
          inOutPut.connections.forEach(connection => {
            const connectorB = connectors.get(connection)
            if (connectorB) {
              const connectorIn = connectorA.type === 'input' ? connectorA : connectorB
              const connectorOut = connectorA.type === 'output' ? connectorA : connectorB
              Connector.connect(connectorOut, connectorIn)
            }
          })
        }
      }
    }
  }
}
