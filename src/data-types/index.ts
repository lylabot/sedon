import Wire, {ChangeSignal, ChangeValueSignal} from '../Wire.js'
import {NodeElement} from '../NodeElement.js'
import type {ConnectorSignals} from '../Connector.js'

export interface DataTypeProps<V> {
  defaultValue: V
}

export abstract class DataType<V> {
  public static name = 'Any'
  public name = DataType.name
  protected _value: V
  public wire: Wire<ConnectorSignals | ChangeSignal>
  public parent: NodeElement | null = null
  declare input?: HTMLInputElement | HTMLElement
  declare elements?: HTMLElement[]

  protected constructor(props: DataTypeProps<V>) {
    this._value = props.defaultValue
    this.wire = new Wire()
    this.parent = null
  }

  setParent(parent: NodeElement) {
    this.parent = parent
  }

  valueOf() {
    return this._value
  }

  setValue(value: V) {
    this._value = value
    this.wire.dispatch(new ChangeValueSignal(this))
  }

  toJSON(): any {
    return this.valueOf()
  }

  onMount() {
    return
  }
}
