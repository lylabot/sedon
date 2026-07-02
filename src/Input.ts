import {DataType} from './data-types'
import {sedonClassPrefix} from './dom.js'
import {NumberNoEvalType, NumberTypeProps} from './data-types/NumberNoEval.js'
import {NumberType} from './data-types/Number.js'
import {BooleanType, BooleanTypeProps} from './data-types/Boolean.js'
import {StringType, StringTypeProps} from './data-types/String.js'
import {Enum, EnumTypeProps} from './data-types/Enum.js'
import {DataTypeConstructor, DynamicType, DynamicTypeProps} from './data-types/Dynamic.js'
import type Output from './Output.js'
import ConnectedElement, {ConnectedElementExport} from './ConnectedElement.js'

export interface InputExport<T> extends ConnectedElementExport<T> {
  type: 'Input' | string
  value: T
}

export default class Input<T> extends ConnectedElement<T, 'input'> {
  constructor(type: DataType<T>, label: string) {
    super(type, 'input', label,  true)
    this.element.classList.add(`${sedonClassPrefix}input`)

    this.wire.on('connect', signal => {
      this.type.elements?.forEach(element => element.remove())
      if ('setType' in this.type) {
        const foreignType = (signal.connector.parent as Output<unknown>).type
        const foreignTypeConstructor = 'type' in foreignType ? foreignType.type?.constructor : foreignType.constructor
        if (!foreignTypeConstructor) return
        ;(this.type as DynamicType<unknown>).setType(foreignTypeConstructor as DataTypeConstructor<unknown>)
      }
    })
    this.wire.on('disconnect', () => {
      if (type.elements) this.element.append(...type.elements)
    })
  }

  toJSON(): InputExport<T> {
    return Object.assign(super.toJSON(),{
      type: 'Input',
      value: this.type.toJSON(),
    })
  }

  applyJSON(json: InputExport<T>) {
    super.applyJSON(json)
    // todo enforce data type
    this.setValue(json.value as T)
  }

  static NumberNoEval = (label: string, props?: Partial<NumberTypeProps>) => new Input(new NumberNoEvalType(props), label)
  static Number = (label: string, props?: Partial<NumberTypeProps>) => new Input(new NumberType(props), label)
  static Boolean = (label: string, props?: Partial<BooleanTypeProps>) => new Input(new BooleanType(props), label)
  static String = (label: string, props?: Partial<StringTypeProps>) => new Input(new StringType(props), label)
  static Enum = <K extends string, O extends string>(label: string, props: EnumTypeProps<K, O>) => new Input(new Enum<K, O>(props), label)

  static Dynamic = <E extends any>(label: string, props: DynamicTypeProps<E>) => new Input(new DynamicType<E>(props), label)
}
