import {DataType} from './data-types/index.js'
import {sedonClassPrefix} from './dom.js'
import {NumberNoEvalType, NumberTypeProps} from './data-types/NumberNoEval.js'
import {NumberType} from './data-types/Number.js'
import {BooleanType, BooleanTypeProps} from './data-types/Boolean.js'
import {StringType, StringTypeProps} from './data-types/String.js'
import {DynamicType, DynamicTypeProps} from './data-types/Dynamic.js'
import ConnectedElement, {ConnectedElementExport} from './ConnectedElement.js'

export interface OutputExport<T> extends ConnectedElementExport<T> {
  type: 'Output' | string
}

export default class Output<T> extends ConnectedElement<T, 'output'> {
  private isCalculated: boolean = true

  constructor(type: DataType<T>, label: string, showInput: boolean = false) {
    super(type, 'output', label, showInput)
    this.element.classList.add(`${sedonClassPrefix}output`)
    if (showInput) this.isCalculated = false
  }

  toJSON(): OutputExport<T> {
    const data: OutputExport<T> = Object.assign(super.toJSON(), {
      type: 'Output',
    })
    if (!this.isCalculated) {
      // todo set data type
      data.value = this.type.toJSON()
    }
    return data
  }

  applyJSON(json: OutputExport<T>) {
    super.applyJSON(json)
    if ('value' in json) {
      this.isCalculated = false
      // todo enforce data type
      this.setValue(json.value as T)
    }
  }

  static NumberNoEval = (label: string, props?: Partial<NumberTypeProps>, showInput?: boolean) => new Output(new NumberNoEvalType(props), label, showInput)
  static Number = (label: string, props?: Partial<NumberTypeProps>, showInput?: boolean) => new Output(new NumberType(props), label, showInput)
  static Boolean = (label: string, props?: Partial<BooleanTypeProps>, showInput?: boolean) => new Output(new BooleanType(props), label, showInput)
  static String = (label: string, props?: Partial<StringTypeProps>, showInput?: boolean) => new Output(new StringType(props), label, showInput)

  static Dynamic = <E extends any>(label: string, props: DynamicTypeProps<E>, showInput?: boolean) => new Output(new DynamicType<E>(props), label, showInput)
}
