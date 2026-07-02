import {kebabCase} from 'change-case'
import XIcon from '@tabler/icons/outline/x.svg'
import {element, sedonClassPrefix} from './dom.js'
import type {Position} from './Scrollable.js'
import type Canvas from './Canvas.js'
import Wire, {
  ChangeSignal,
  ChangeTypeSignal,
  ChangeValueSignal,
  ConnectSignal,
  DisconnectSignal, FlowSignal,
  ProcessSignal
} from './Wire.js'
import ConnectedElement from './ConnectedElement.js'
import {getPlatform, Platform} from './platform'

export interface Connection {
  connectorOut: Connector<'output'>
  connectorIn: Connector<'input'>
  path: SVGPathElement,
  redraw: () => void
}

export type ConnectorSignals =
  ConnectSignal
  | DisconnectSignal
  | ProcessSignal<any, any>
  | ChangeValueSignal
  | ChangeTypeSignal
  | FlowSignal<boolean, boolean>

const pathFromTo = (start: Position, end: Position, canvas: Position) => {
  return `M${-canvas.x + start.x},${-canvas.y + start.y}L${-canvas.x + end.x},${-canvas.y + end.y}`
}

function isOutput(connector: Connector<any>): connector is Connector<'output'> {
  return connector.type === 'output'
}

function isInput(connector: Connector<any>): connector is Connector<'input'> {
  return connector.type === 'input'
}

const arrowHeadUrl = `url(#${sedonClassPrefix}arrow-head)`

export default class Connector<T extends 'input' | 'output'> {
  public element: HTMLSpanElement & { sedonConnector: Connector<T> }
  public type: T
  public parent: ConnectedElement<any, any>
  private dataTypeClassName: string[]
  public connections: Connection[]
  public wire: Wire<ConnectorSignals | ChangeSignal>

  private _canvas: Canvas = null!

  get canvas() {
    return this._canvas
  }

  set canvas(canvas: Canvas) {
    this.detach()
    this._canvas = canvas
    this.attach()
  }

  constructor(type: T, parent: ConnectedElement<any, any>) {
    this.element = element('span', {className: ['endpoint']}) as HTMLSpanElement & { sedonConnector: Connector<T> }
    this.element.sedonConnector = this
    this.parent = parent
    this.dataTypeClassName = []
    this.resetDataType()

    this.type = type
    this.connections = []

    document.addEventListener('mousemove', e => {
      if (e.target === this.element) this.element.classList.add('hovering')
      else this.element.classList.remove('hovering', 'clicking')
    })
    this.element.addEventListener('mousedown', () => this.element.classList.add('clicking'))
    this.element.addEventListener('mouseup', () => this.element.classList.remove('clicking'))

    this.wire = new Wire()
    this.wire.on('flow', signal => {
      this.connections.forEach(connection => {
        if (signal.pull) {
          connection.path.setAttributeNS(null, 'marker-end', arrowHeadUrl)
        } else {
          connection.path.removeAttributeNS(null, 'marker-end')
        }
      })
    })
  }

  resetDataType() {
    if (this.dataTypeClassName.length) this.element.classList.remove(...this.dataTypeClassName)
    if (this.parent.type.name) {
      this.dataTypeClassName = []
      let name = this.parent.type.name
      if (this.parent.type.name.includes('<')) {
        const outer = name.substring(0, name.indexOf('<'))
        name = name.substring(name.indexOf('<') + 1, name.indexOf('>'))
        this.dataTypeClassName.push(sedonClassPrefix + kebabCase(name), sedonClassPrefix + kebabCase(outer))
      } else {
        this.dataTypeClassName.push(sedonClassPrefix + kebabCase(name))
      }
      this.element.classList.add(...this.dataTypeClassName)
    }
  }

  attach() {
    if (!this.canvas) throw new Error('Set canvas before initialising connector')
    this.element.addEventListener('mousedown', this._listeners)
    this.canvas.sedon.rootElement.addEventListener('keydown', e => {
      // todo put the interactionHints in the bag lil bro
      const isCmdPressed = getPlatform() === Platform.MAC ? e.metaKey : e.ctrlKey
      const isAltPressed = e.altKey
      const isShiftPressed = e.shiftKey
      const isCtrlPressed = getPlatform() === Platform.MAC ? e.ctrlKey : false
      if (!isCmdPressed && isAltPressed && !isShiftPressed && !isCtrlPressed) {
        if (e.key === 'Alt') {
          const buttons = this.connections
            // would otherwise create two buttons per connection -> one would remain after clicking (removing connection)
            .filter(connection => connection.connectorIn === this)
            .map(connection => {
              const pathBB = connection.path.getBoundingClientRect()
              const canvasPosition = this.canvas.element.getBoundingClientRect()
              const button = element('button', {
                className: 'connection-delete-button',
                innerHTML: XIcon,
                style: `transform: translate(${
                  ((pathBB.left + pathBB.width / 2) - canvasPosition.x) / this.canvas.scale
                }px, ${
                  ((pathBB.top + pathBB.height / 2) - canvasPosition.y) / this.canvas.scale
                }px);`
              }, this.canvas.element)
              button.addEventListener('click', () => {
                Connector.disconnect(connection.connectorOut, connection.connectorIn)
                button.remove()
              })
              return button
            })
          const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key !== 'Alt') return
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('blur', handleBlur)
            buttons.forEach(button => button.remove())
          }
          const handleBlur = () => {
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('blur', handleBlur)
            buttons.forEach(button => button.remove())
          }
          window.addEventListener('keyup', handleKeyUp)
          window.addEventListener('blur', handleBlur)
        }
      } else return
    })
  }

  detach() {
    if (!this.canvas) return
    this.element.removeEventListener('mousedown', this._listeners)
  }

  private _listeners(e: MouseEvent) {
    const _this = this instanceof Connector
      ? this
      : (this as HTMLSpanElement & { sedonConnector: Connector<T> }).sedonConnector
    if (e.altKey) return
    e.preventDefault()
    e.stopPropagation()
    document.onselectstart = () => false

    const startPosition = _this.getCenterCoordinates()

    // todo: if dragging from input that is already connected, detach connection from input and drag
    const pathElement = element('path', {
      className: 'node-connector',
      'marker-end': _this.parent.parent?.pullListeners.length ?? 0 > 0 ? arrowHeadUrl : undefined
    }, _this.canvas.svgLayer)

    let blockDrag = false, animationFrames: number[] = []

    const drag = (e: MouseEvent) => {
      // "blockDrag" and "animationFrames"-store prevents a drag step to be performed after the path is connected to a node
      if (blockDrag) return
      const frameId = window?.requestAnimationFrame(() => {
        const canvasPosition = {
          x: _this.canvas.element.getBoundingClientRect().x / _this.canvas.scale,
          y: _this.canvas.element.getBoundingClientRect().y / _this.canvas.scale,
        }
        // redraw svg shape
        const cursorPosition = {x: e.clientX / _this.canvas.scale, y: e.clientY / _this.canvas.scale}
        if (_this.type === 'input') {
          pathElement.setAttributeNS(null, 'd', pathFromTo(cursorPosition, startPosition, canvasPosition))
        } else {
          pathElement.setAttributeNS(null, 'd', pathFromTo(startPosition, cursorPosition, canvasPosition))
        }
      })
      animationFrames.push(frameId)
      setTimeout(() => animationFrames.shift(), 20)
    }

    const stop = (e: MouseEvent | FocusEvent) => {
      blockDrag = true
      animationFrames.forEach(frame => window?.cancelAnimationFrame(frame))
      _this.canvas.element.removeEventListener('mousemove', drag)
      _this.canvas.element.removeEventListener('mouseup', stop)
      _this.canvas.element.removeEventListener('mouseleave', stop)

      if (!e.target || !(e.target instanceof HTMLElement)) return pathElement.remove()
      let endConnectorElement
      if (!e.target.classList.contains(sedonClassPrefix + 'endpoint')) {
        let inOutPut: HTMLElement = e.target
        while (inOutPut.parentElement) {
          if (inOutPut.classList.contains(sedonClassPrefix + 'input') || inOutPut.classList.contains(sedonClassPrefix + 'output'))
            break
          inOutPut = inOutPut.parentElement
        }
        if (inOutPut.tagName === 'HTML' || inOutPut.tagName === 'BODY') return pathElement.remove()
        endConnectorElement = inOutPut.querySelector(`.${sedonClassPrefix}endpoint`) as
          HTMLElement & { sedonConnector: Connector<any> }
      } else
        endConnectorElement = e.target as HTMLElement & { sedonConnector: Connector<any> }
      if (!endConnectorElement || !('sedonConnector' in endConnectorElement)) return pathElement.remove()
      const endConnector = endConnectorElement.sedonConnector

      const connectorOut = (isOutput(_this) ? _this : isOutput(endConnector) ? endConnector : null)
      const connectorIn = (isInput(_this) ? _this : isInput(endConnector) ? endConnector : null)

      if (!connectorOut || !connectorIn) return pathElement.remove()

      Connector.connect(connectorOut, connectorIn, pathElement)
    }

    _this.canvas.element.addEventListener('mousemove', drag)
    _this.canvas.element.addEventListener('mouseup', stop)
    _this.canvas.element.addEventListener('mouseleave', stop)
  }

  onMount() {
    return
  }

  static connect(connectorOut: Connector<'output'>, connectorIn: Connector<'input'>, pathElement?: SVGPathElement) {
    if (connectorOut.type !== 'output' || connectorIn.type !== 'input') {
      return false
    }
    pathElement ??= element('path', {
      className: 'node-connector',
      'marker-end': connectorIn.parent.parent?.pullListeners.length ?? 0 > 0 ? arrowHeadUrl : undefined
    }, connectorOut.canvas.svgLayer)
    const connection: Connection = {
      connectorOut,
      connectorIn,
      path: pathElement,
      redraw() {
        const canvasPosition = {
          x: connectorOut.canvas.element.getBoundingClientRect().x / connectorOut.canvas.scale,
          y: connectorOut.canvas.element.getBoundingClientRect().y / connectorOut.canvas.scale,
        }

        pathElement.setAttributeNS(null, 'd',
          pathFromTo(connectorOut.getCenterCoordinates(), connectorIn.getCenterCoordinates(), canvasPosition)
        )
      }
    }
    connection.redraw()
    connectorOut.addConnection(connection)
    connectorIn.addConnection(connection)
    return true
  }

  static disconnect(connectorOut: Connector<'output'>, connectorIn: Connector<'input'>) {
    if (connectorOut.type !== 'output' || connectorIn.type !== 'input') return false
    const connectionFromOut = connectorOut.connections.find(connection =>
      connection.connectorOut === connectorOut && connection.connectorIn === connectorIn
    )
    if (!connectionFromOut) return false
    const connectionFromIn = connectorIn.connections.find(connection =>
      connection.connectorOut === connectorOut && connection.connectorIn === connectorIn
    )
    if (!connectionFromIn) return false
    connectorOut.removeConnection(connectionFromOut)
    connectorIn.removeConnection(connectionFromIn)
    return true
  }

  addConnection(connection: Connection) {
    if (this.type === 'input') {
      const connection = this.connections[0]
      if (connection) {
        Connector.disconnect(connection.connectorOut, connection.connectorIn)
        this.connections.length = 0
      }
    }
    this.connections.push(connection)
    const connector = connection.connectorIn === this ? connection.connectorOut : connection.connectorIn
    this.wire.dispatch(new ConnectSignal(this, connector))
  }

  removeConnection(connection: Connection) {
    const connectionIndex = this.connections.indexOf(connection)
    if (connectionIndex === -1) return false
    const connector = connection.connectorIn === this ? connection.connectorOut : connection.connectorIn
    connection.path.remove()
    this.wire.dispatch(new DisconnectSignal(this, connector))
    this.connections.splice(connectionIndex, 1)
    return true
  }

  getCenterCoordinates() {
    const elementBounding = this.element.getBoundingClientRect()
    return {
      x: (elementBounding.left + elementBounding.width / 2) / this.canvas.scale,
      y: (elementBounding.top + elementBounding.height / 2) / this.canvas.scale,
    }
  }
}
