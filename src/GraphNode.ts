import {element, sedonClassPrefix} from './dom.js'
import Draggable, {DraggableExport} from './Draggable.js'
import Output, {OutputExport} from './Output.js'
import Input, {InputExport} from './Input.js'
import {NodeElement, NodeElementExport} from './NodeElement.js'
import OrderedKeyed from './OrderedKeyed.js'
import Canvas from './Canvas.js'
import Wire, {ChangeSignal, FlowSignal, ProcessSignal, Propagation, TranslateSignal} from './Wire.js'
import {DataType} from './data-types'
import Connector, {ConnectorSignals} from './Connector.js'
import {GraphNodeConstructor} from './SedonPack.js'
import ConnectedElement from './ConnectedElement'

export interface GraphNodeExport extends DraggableExport {
  type: 'GraphNode' | string
  /** @description id of the node type in the pack */
  nodeId: string
  packId: string
  elementData: Array<NodeElementExport | InputExport<any> | OutputExport<any>>
}

export interface BoundNodeElement<E extends NodeElement> {
  element: E

  /** @description Show only when `predicate` returns true. `predicate` receives the `source` elements value anytime it changes. */
  conditionally<T>(source: BoundNodeElement<NodeElement & { valueOf(): T }>, predicate?: (value: T) => boolean): this
  onChange<T>(predicate: (value: T) => any): this
}

export default abstract class GraphNode extends Draggable {
  public static label: string = 'Node'
  public static id?: string
  /** @description Label for group in add menu */
  public static group?: string
  /** @description Keywords for search (in addition to title) */
  public static keywords?: string[]
  public wire: Wire<ConnectorSignals | TranslateSignal | ChangeSignal>
  readonly elements: OrderedKeyed<string, NodeElement>

  private header: HTMLDivElement
  private headerLabel: HTMLParagraphElement
  private headerToolbar: HTMLDivElement
  private elementsList: HTMLUListElement

  public static push?: boolean // when its outputs (that might depend on inputs) change
  public static pull?: boolean // when any outputs in the preceding tree structure change

  protected constructor() {
    super()

    this.elements ??= new OrderedKeyed()

    this.element.classList.add(`${sedonClassPrefix}node`)
    this.header = element('div', {className: 'name'}, this.element)
    this.headerLabel = element('p', {className: 'label', innerText: GraphNode.label}, this.header)
    this.headerToolbar = element('div', {className: 'toolbar'}, this.header)
    this.elementsList = element('ul', {}, this.element)

    this.wire = new Wire()
    this.pullListeners = []

    const label = Object.getPrototypeOf(this).constructor.label ?? GraphNode.label
    this.headerLabel.innerText = label
    this.element.classList.add(label.toLowerCase().replace(/\s/g, '-'))

    this.wire.on('type', signal => {
      signal = signal.clone()
      signal.propagate = Propagation.Trickle
      for (const element of this.elements) {
        if (element === signal.dataType.parent) continue
        element?.wire.dispatch(signal)
      }
    })
  }

  pullListeners: (() => void)[]

  setInputsPull() {
    this.unsetInputsPull()
    const offs = new Map<Connector<any>, () => void>()
    const addPullConnection = (output: Output<any>, inputConnector: Connector<"input">) => {
      output.parent?.setInputsPull()
      offs.set(
        inputConnector,
        output.wire.on('value', changeSignal => {
          const outputDataType = changeSignal.dataType as DataType<any> // ??? its very clearly declared in the class, there should be no reason to "as"
          if (!outputDataType) console.error('Could not precipitate value') // todo logging with readable trace / location
          inputConnector.parent?.setValue(outputDataType?.valueOf())
        })
      )
    }
    this.elements.forEach(element => {
      if (!(element instanceof Input)) return
      element.connector.connections.forEach(connection => {
        addPullConnection(connection.connectorOut.parent as Output<any>, connection.connectorIn)
      })
    })
    const changeListener = this.wire.on('value', signal => {
      if (signal.dataType.parent instanceof Input) this.callProcess()
    })
    this.pullListeners.push(changeListener)
    const connectListener = this.wire.on('connect', connectSignal => {
      if (connectSignal.target.type !== 'input') return
      const input = connectSignal.target.parent as Input<any>
      if (!input) return console.error('Could not precipitate value')
      if (!input.parent) return console.error('Could not find node')
      addPullConnection(connectSignal.connector.parent as Output<any>, connectSignal.target as Connector<'input'>)
    })
    this.pullListeners.push(connectListener)
    const disconnectListeners = this.wire.on('disconnect', disconnectSignal => {
      if (disconnectSignal.target.type !== 'input') return
      disconnectSignal.connector.parent?.parent?.unsetInputsPull()
      offs.get(disconnectSignal.target)?.()
      offs.delete(disconnectSignal.target)
    })
    this.pullListeners.push(disconnectListeners)
    this.wire.dispatch(new FlowSignal(false, true))
  }

  unsetInputsPull() {
    this.pullListeners.forEach(off => off())
    this.pullListeners = []
    this.wire.dispatch(new FlowSignal(false, false))
  }

  addElement<E extends NodeElement>(key: string, element: E): BoundNodeElement<E> {
    this.elements.push(key, element)
    this.elementsList.append(element.element)
    this.wire.addChild(element.wire)
    element.setParent(this)

    if (this.canvas) {
      if (element instanceof Input || element instanceof Output) {
        element.connector.canvas = this.canvas
      }
    }

    if (Object.getPrototypeOf(this).constructor.pull) {
      this.setInputsPull()
    }

    const boundElement: BoundNodeElement<E> = {
      element,
      conditionally(source, predicate = v => !!v) {
        const update = (value: any) => {
          const showElement = predicate(value)
          if (showElement) element.activate()
          else element.deactivate()
        }
        update((source.element as ConnectedElement<any, any>).type?.valueOf())
        source.element.wire.on('value', value => update(value.dataType.valueOf()))
        return boundElement
      },
      onChange(predicate) {
        element.wire.on('value', value => {
          predicate(value.dataType.valueOf())
        })
        return boundElement
      }
    }
    return boundElement
  }

  async addToolbarElement(icon: SVGElement, onClick: () => void, tooltip?: string) {
    const button = element('button', {
      children: icon,
    }, this.headerToolbar)
    button.addEventListener('click', onClick)
    if (tooltip) {
      element('div', {className: 'tooltip', innerText: tooltip}, button)
    }
  }

  delete() {
    this.elements.forEach(element => element.deactivate())
    super.delete()
  }

  attachToCanvas(canvas: Canvas) {
    super.attachToCanvas(canvas)
    for (const element of this.elements)
      if (element instanceof Input || element instanceof Output) {
        element.connector.canvas = canvas
      }
    canvas.sedon.wire.addChild(this.wire)
    this.elements.forEach(element => element.onMount())
  }

  protected onDrag() {
    for (const element of this.elements) {
      if (element instanceof Input || element instanceof Output) {
        for (const connection of element.connector.connections) {
          connection.redraw()
        }
      }
    }
  }

  callProcess() {
    if (!this.process) return false
    const inputData = this.elements
      .filter(element => element instanceof Input)
      .map(element => element.valueOf())
      .toObject()
    const outputData = this.process(inputData, {})
    // todo validate output
    this.wire.dispatch(new ProcessSignal(inputData, outputData))
    this.elements.forEach((element, key) => {
      if (!(element instanceof Output)) return
      element.setValue(outputData[key as keyof typeof outputData])
    })
    return outputData
  }

  process?(input: Record<string, any>, meta: Object): void | Record<string, any>

  toJSON(): GraphNodeExport {
    return {
      type: 'GraphNode',
      nodeId: Object.getPrototypeOf(this).constructor.id,
      packId: Object.getPrototypeOf(this).constructor._pack.id,
      position: {...this.position},
      elementData: this.elements.toArray().map(element => element.toJSON()),
    }
  }

  static fromJSON(json: GraphNodeExport & { constructor: GraphNodeConstructor }) {
    const graphNode = new (json.constructor)()
    graphNode.setPosition(json.position.x, json.position.y)
    graphNode.elements.forEach((element, _, index) => {
      const elementData = json.elementData[index]
      element.applyJSON(elementData)
    })
    return graphNode
  }
}
