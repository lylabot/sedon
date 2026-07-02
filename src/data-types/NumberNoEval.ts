import {DataType} from './index.js'
import {element} from '../dom.js'
import {Decimal} from 'decimal.js'

export interface NumberTypeProps {
  defaultValue: number,
  range: [number | null, number | null],
  unit: string // todo, maybe even just a formatting func
  decimalPlaces: 'auto' | number // todo
}

const defaultProps: NumberTypeProps = {
  defaultValue: .5,
  range: [null, null],
  unit: '',
  decimalPlaces: 'auto',
}

export class NumberNoEvalType extends DataType<Decimal> {
  public static name = 'Number'
  public name = NumberNoEvalType.name
  input: HTMLSpanElement
  range: [number | null, number | null]
  progress: HTMLProgressElement | null = null
  decimalPlaces: 'auto' | number

  constructor(props?: Partial<NumberTypeProps>) {
    const completeProps = Object.assign(cloneNumberTypeProps(defaultProps), props)
    completeProps.defaultValue ??= defaultProps.defaultValue
    completeProps.defaultValue = Number(completeProps.defaultValue)
    if (isNaN(completeProps.defaultValue)) completeProps.defaultValue = defaultProps.defaultValue
    super({defaultValue: new Decimal(completeProps.defaultValue)})
    this.decimalPlaces = completeProps.decimalPlaces
    this.range = completeProps.range
    const wrapper = element('div', {className: ['number', 'input-element', 'flex']})
    this.elements = [wrapper]

    const subtractButton: HTMLButtonElement = element('button', {
      className: ['button', 'clear', 'muted'],
      innerText: '-'
    }, wrapper)
    this.input = element('span', {
      className: ['field', 'clear'],
      contenteditable: true,
      inputmode: 'decimal',
      innerText: this.valueOf()
    }, wrapper)
    const addButton: HTMLButtonElement = element('button', {
      className: ['button', 'clear', 'muted'],
      innerText: '+'
    }, wrapper)
    if (this.range.every(value => typeof value === 'number'))
      this.progress = element('progress', {
        className: ['overlay', 'range-progress'],
        min: this.range[0],
        max: this.range[1],
        value: this.valueOf(),
      }, wrapper)

    this.setValue(this.valueOf())
    this.input.addEventListener('keydown', e => {
      e.stopPropagation()
      e.code === 'Enter' && this.input.blur()
    })
    this.input.addEventListener('blur', () => this.setFormattedValue(this.input.innerText))
    let initPos: { x: number, y: number } = null!,
      pressed = false,
      delta: { x: number, y: number } = null!,
      initialValue: Decimal
    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      initPos = {x: e.x, y: e.y}
      delta = {x: e.x - initPos.x, y: e.y - initPos.y}
      pressed = true
      initialValue = this.valueOf()
    })
    document.body.addEventListener('mousemove', (e) => {
      if (!pressed) return
      delta = {x: e.x - initPos.x, y: e.y - initPos.y}
      const lengthComponent = (delta.x ** 2 * Math.sign(delta.x)) + (delta.y ** 2 * Math.sign(delta.y) * -1)
      const length = Math.sqrt(Math.abs(lengthComponent)) * Math.sign(lengthComponent)
      this.incrementByMagnitude(length / 2, initialValue)
    })
    document.body.addEventListener('mouseup', (e) => {
      pressed = false
      if (e.target !== this.input) return
      const length = delta.x ** 2 + delta.y ** 2
      if (length < 10) this.input.focus()
    })
    document.body.addEventListener('mouseleave', () => pressed = false)

    subtractButton.addEventListener('click', () => this.incrementByMagnitude(-1))
    addButton.addEventListener('click', () => this.incrementByMagnitude(1))
  }

  incrementByMagnitude(length: number, initialValue?: Decimal) {
    initialValue ??= this.valueOf()
    let orderOfStep = this.decimalPlaces !== 'auto'
      ? -1 * this.decimalPlaces
      : orderOfMagnitude(initialValue).sub(1)
    const magnitude = Decimal.pow(10, orderOfStep)
    this.setValue(magnitude.mul(Math.round(length)).add(initialValue))
  }

  setValue(value: Decimal | number) {
    if (typeof value === 'number') value = Decimal(value)
    if (typeof this.range[0] === 'number') value = Decimal.max(this.range[0], value)
    if (typeof this.range[1] === 'number') value = Decimal.min(value, this.range[1])
    this.input.innerText = value.toString()
    if (this.progress) this.progress.value = value.toNumber()
    super.setValue(value)
  }

  setFormattedValue(value: string) {
    this.setValue(new Decimal(value))
  }

  toJSON() {
    return this.valueOf().toNumber()
  }
}

function orderOfMagnitude(number: Decimal) {
  if (number.isZero()) return number
  return number.abs().ln().div(Math.LN10).floor()
}

function cloneNumberTypeProps(props: NumberTypeProps): NumberTypeProps {
  const cloned = {...props}
  if (props.range) cloned.range = [...props.range]
  return cloned
}
