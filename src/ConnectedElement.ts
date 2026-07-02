import {DataType} from './data-types'
import Connector from './Connector.js'
import {NodeElement, NodeElementExport} from './NodeElement.js'
import {sedonClassPrefix} from './dom.js'

export interface ConnectedElementExport<T> extends NodeElementExport {
  type: 'ConnectedElement' | string
  value?: T
  connections: string[]
}

export default class ConnectedElement<T, C extends "input" | "output"> extends NodeElement {
  private readonly _connector: Connector<C>
  private readonly _type: DataType<T>

  constructor(type: DataType<T>, connectorType: C, label: string, showInput: boolean = false) {
    super(label)
    this._type = type
    this.type.setParent(this)
    this._connector = new Connector(connectorType, this)
    this.wire.addChild(this.connector.wire)
    this.wire.addChild(this.type.wire)
    // this.element.classList.add(`${sedonClassPrefix}input`)
    this.element.append(this.connector.element)
    if (showInput && type.elements) this.element.append(...type.elements)
    if (showInput && type.elements?.length === 1) this.element.classList.add(`${sedonClassPrefix}single-element`)

    this.wire.on('type', () => {
      this.connector.resetDataType()
    })
  }

  get connector() {
    return this._connector
  }

  get type() {
    return this._type
  }

  valueOf() {
    return this.type.valueOf()
  }

  setValue(value: T) {
    return this.type.setValue(value)
  }

  deactivate() {
    if (!super.deactivate()) return false
    this._connector.connections.forEach(connection => Connector.disconnect(connection.connectorOut, connection.connectorIn))
    return true
  }

  onMount() {
    super.onMount()
    this.type.onMount()
    this.connector.onMount()
  }

  toJSON(): ConnectedElementExport<T> {
    return Object.assign(super.toJSON(), {
      type: 'ConnectedElement',
      connections: this.connector.connections.map(connection => {
        if (connection.connectorIn === this.connector)
          return connection.connectorOut.parent.id
        else
          return connection.connectorIn.parent.id
      })
    })
  }

  applyJSON(json: ConnectedElementExport<T>) {
    super.applyJSON(json)
  }
}
