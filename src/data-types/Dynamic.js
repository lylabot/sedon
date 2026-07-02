import Wire, {ChangeTypeSignal, Propagation} from '../Wire.ts'
import {element} from '../dom.ts'
import {DataType} from './index.ts'

export function DynamicType(props) {
  // vite breaks using `this` here, so we fall back to an object
  /** @typedef {import('Dynamic.d.ts').DynamicType} Dynamic */
  /** @type {{-readonly [K in keyof Dynamic<unknown>]: Dynamic<unknown>[K]}} */
  const _this = this ?? {};
  _this.ref = props.ref
  // /** @type {Wire<ConnectorSignals | ChangeSignal>} */
  _this.wire = new Wire()
  _this.type = null
  // /** @type {import('../NodeElement.js').NodeElement | null} */
  _this.parent = null

  const elementsContainer = element('div', {className: ['dynamic']})
  _this.elements = [elementsContainer]

  _this.setParent = parent => {
    _this.parent = parent
  }
  // todo fix connecting two dynamics
  /**
   * @template Type
   * @param {import('Dynamic.d.ts').DataTypeConstructor<Type>} type
   * @param {Type} value
   * */
  const setTypeSilent = (type, value) => {
    if (_this.type) {
      _this.wire.removeChild(_this.type.wire)
    }
    _this.type = new type({defaultValue: value === undefined ? _this.type?.valueOf() : value})
    _this.wire.addChild(_this.type.wire)
    elementsContainer.innerHTML = ''
    if (_this.type.elements) elementsContainer.append(..._this.type.elements)
  }

  if ('defaultType' in props) setTypeSilent(props.defaultType, props.defaultValue)

  _this.setType = (type, value) => {
    setTypeSilent(type, value)
    _this.wire.dispatch(new ChangeTypeSignal(/** @type {import('Dynamic.d.ts').DynamicType} */ instance))
  }
  _this.wire.on(/** @type {'type'} */ 'type', signal => {
    if (signal.dataType === instance || signal.dataType.ref !== _this.ref) return
    // todo: check if type is "locked"
    setTypeSilent(signal.dataType.type.constructor)
    // todo, make this not icky
    // retrigger to update connector
    const changeSignal = new ChangeTypeSignal(/** @type {import('Dynamic.d.ts').DynamicType} */ instance)
    changeSignal.propagate = Propagation.None
    _this.wire.parent.dispatch(changeSignal)
  })
  _this.setValue = (value) => {
    if (value === null || value === undefined) return
    if (!_this.type) {
      // hold value without type
      _this.type = new DataType({defaultValue: value.value})
      return
    }
    _this.type.setValue(value.value)
  }
  _this.toJSON = () => {
    if (!_this.type) return null
    else return {
      type: _this.type.name,
      value: _this.type.toJSON()
    }
  }
  _this.onMount = () => {
    if (_this.type) {
      _this.wire.dispatch(new ChangeTypeSignal(/** @type {import('Dynamic.d.ts').DynamicType} */ instance))
    }
  }
  const instance = new Proxy(_this, {
    get(target, p, receiver) {
      if (
        p === 'setParent'
        || p === 'setType'
        || p === 'type'
        || p === 'ref'
        || p === 'wire'
        || p === 'parent'
        || p === 'elements'
        || p === 'toJSON'
        || p === 'onMount'
        || p === 'setValue'
      ) return target[p]
      if (!target.type) {
        if (p === 'constructor') return target
      } else {
        if (p in target.type) {
          return target.type[p]
        }
      }
    }
  })

  return instance
}
