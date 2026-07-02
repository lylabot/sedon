import {DataType} from './index.js'
import {element} from '../dom.js'

export interface EnumTypeProps<Keys extends string, Options extends string> {
  defaultValue: Keys,
  values: Record<Keys, Options> | Array<Options>,
}

declare global {
  interface ObjectConstructor {
    entries<K extends string, V extends string>(o: Record<K, V>): [K, V][];
  }
}

export class Enum<Keys extends string, Options extends string> extends DataType<Keys> {
  public static name = 'Enum'
  public name = Enum.name
  input: HTMLSelectElement
  values: [Keys, Options][]

  constructor(props: EnumTypeProps<Keys, Options>) {
    super({defaultValue: props.defaultValue})
    const wrapper = element('div', {className: ['enum']})
    this.elements = [wrapper]
    const label = element('div', {className: ['flex']}, wrapper)
    this.values = Array.isArray(props.values)
      ? props.values.map(value => [value as unknown as Keys, value])
      : Object.entries(props.values)
    this.input = element('select', {
      className: ['field'],
      children: this.values
        .map(([key, value]) => {
          const option = element('option', {value: key, innerText: value})
          if (props.defaultValue === key) option.selected = true
          return option
        }),
    }, label)
    this.input.addEventListener('input', () => {
      this.setValue(this.input.value as Keys)
    })
    // todo
    // element('span', {innerText: completeProps.label}, label)
  }

  setValue(value: Keys) {
    super.setValue(value)
    this.input.value = value
  }
}
