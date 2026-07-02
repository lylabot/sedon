import {DataType} from './index.js'
import {element} from '../dom.js'

export interface BooleanTypeProps {
  defaultValue: boolean,
  label: string,
}

const defaultProps: BooleanTypeProps = {
  defaultValue: false,
  label: 'Boolean',
}

export class BooleanType extends DataType<boolean> {
  public static name = 'Boolean'
  public name = BooleanType.name
  input: HTMLInputElement

  constructor(props?: Partial<BooleanTypeProps>) {
    const completeProps = Object.assign(defaultProps, props)
    super({defaultValue: window.Boolean(completeProps.defaultValue)})
    const wrapper = element('div', {className: ['boolean']})
    this.elements = [wrapper]
    const label = element('label', {className: ['flex']}, wrapper)
    this.input = element('input', {
      className: ['field'],
      type: 'checkbox',
      value: this.valueOf()
    }, label)
    // todo
    element('span', {innerText: completeProps.label}, label)
    this.input.addEventListener('input', () => {
      this.setValue(this.input.checked)
    })
  }

  setValue(value: boolean) {
    super.setValue(value)
    this.input.checked = value
  }
}
