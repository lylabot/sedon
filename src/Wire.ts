import type Connector from './Connector.js'
import type {DataType} from './data-types'
import {DynamicType} from './data-types/Dynamic.js'

export default class Wire<S extends Signal = Signal> {
  listeners: /*{ [T in TypeOfSignal<S>]?: ((value: PickSignal<S, T>) => void)[] } &*/ Record<string, ((value: Signal) => void)[]>
  parent: Wire<S | Signal> | null = null
  children: Wire<S>[]
  private suspended: boolean

  constructor() {
    this.listeners = {}
    this.children = []
    this.suspended = false
  }

  addChild(child: Wire<S>) {
    child.parent = this as Wire
    this.children.push(child)
  }

  removeChild(child: Wire<S>) {
    child.parent = null
    this.children.splice(this.children.indexOf(child), 1)
  }

  suspend() {
    this.suspended = true
  }

  resume() {
    this.suspended = false
  }

  dispatch<T extends TypeOfSignal<S>>(signal: PickSignal<S, T>) {
    if (this.suspended) return
    this.execute(signal)
    if (signal.propagate === Propagation.Bubble) this.parent?.dispatch(signal)
    else if (signal.propagate === Propagation.Trickle) this.children?.forEach(wire => wire.dispatch(signal))
    signal.children?.forEach(signal => {
      // @ts-ignore
      this.execute(signal)
    })
  }

  private execute<T extends TypeOfSignal<S>>(signal: PickSignal<S, T>) {
    this.listeners[signal.type]?.forEach(callback => callback(signal))
  }

  on<T extends TypeOfSignal<S>>(signal: T, callback: (value: PickSignal<S, T>) => void): () => boolean {
    this.listeners[signal] ??= []
    this.listeners[signal].push(callback as (value: Signal) => void)
    return () => {
      const listeners = this.listeners[signal]
      if (!listeners) return false
      const index = listeners?.indexOf(callback as (value: Signal) => void)
      if (index == -1) return false
      delete listeners[index]
      return true
    }
  }
}

type TypeOfSignal<Sig extends Signal> = Sig extends Signal<infer Str> ? Str : never
type PickSignal<Sig extends Signal, Type extends string> = Sig extends Signal<Type> ? Sig : never

export enum Propagation {
  None = 'None',
  Bubble = 'Bubble',
  Trickle = 'Trickle',
}

export abstract class Signal<T extends string = string> {
  propagate: Propagation = Propagation.Bubble
  type: T
  parent?: Signal
  children?: Signal[]

  constructor(type: T, children?: Signal[]) {
    this.type = type
    this.children = children
    children?.forEach(child => child.parent = this)
  }

  clone(): typeof this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }
}

abstract class SedonSignal<T extends string = string> extends Signal<T> {
  constructor(type: T) {
    super(type, [new ChangeSignal()])
  }
}

export class ConnectSignal extends SedonSignal<'connect'> {
  /** @description The connector on whose wire this event was dispatched */
  target: Connector<'input' | 'output'>
  /** @description The foreign connector */
  connector: Connector<'input' | 'output'>

  constructor(target: Connector<'input' | 'output'>, connector: Connector<'input' | 'output'>) {
    super('connect')
    this.target = target
    this.connector = connector
  }
}

export class DisconnectSignal extends SedonSignal<'disconnect'> {
  /** @description The connector on whose wire this event was dispatched */
  target: Connector<'input' | 'output'>
  /** @description The foreign connector */
  connector: Connector<'input' | 'output'>

  constructor(target: Connector<'input' | 'output'>, connector: Connector<'input' | 'output'>) {
    super('disconnect')
    this.target = target
    this.connector = connector
  }
}

export class ProcessSignal<I extends Record<string, any>, O extends Record<string, any> | void> extends SedonSignal<'process'> {
  input: I
  output?: O

  constructor(input: I, output?: O) {
    super('process')
    this.input = input
    this.output = output
  }
}

export class FlowSignal<Push extends boolean, Pull extends boolean> extends SedonSignal<'flow'> {
  propagate = Propagation.Trickle
  push: Push
  pull: Pull

  constructor(push: Push, pull: Pull) {
    super('flow')
    this.push = push
    this.pull = pull
  }
}

export class ChangeValueSignal<D extends DataType<any> = DataType<any>> extends SedonSignal<'value'> {
  dataType: D

  constructor(dataType: D) {
    super('value')
    this.dataType = dataType
  }
}

export class ChangeTypeSignal<D extends DynamicType<any> = DynamicType<any>> extends SedonSignal<'type'> {
  dataType: D

  constructor(dataType: D) {
    super('type')
    this.dataType = dataType
  }
}

export class TranslateSignal extends SedonSignal<'translate'> {
  position: { x: number, y: number }

  constructor(position: { x: number, y: number }) {
    super('translate')
    this.position = position
  }
}

export class ChangeSignal extends Signal<'change'> {
  propagate = Propagation.None

  constructor() {
    super('change')
  }
}
