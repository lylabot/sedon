import {DataType} from './index.js'
import {element} from '../dom.js'

export interface StringTypeProps {
  defaultValue: string,
  label: string,
}

const defaultProps: StringTypeProps = {
  defaultValue: '',
  label: 'String',
}

export class StringType extends DataType<string> {
  public static name = 'String'
  public name = StringType.name
  input: HTMLInputElement

  constructor(props?: Partial<StringTypeProps>) {
    const completeProps = Object.assign(defaultProps, props)
    super({defaultValue: String(completeProps.defaultValue ?? '')})
    const wrapper = element('div', {className: ['string', 'input-element']})
    this.elements = [wrapper]
    this.input = element('input', {
      className: ['field'],
      value: this.valueOf()
    }, wrapper)
    this.input.addEventListener('input', () => {
      this.setValue(String(this.input.value))
    })
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation()
    })
  }

  setValue(value: string) {
    super.setValue(value)
    this.input.value = value
  }
}
