type NotImplemented = typeof Symbol.unscopables | 'entries' | 'keys' | 'pop' | 'concat' | 'join' | 'reverse'
  | 'shift' | 'slice' | 'sort' | 'splice' | 'unshift' | 'indexOf' | 'lastIndexOf' | 'every' | 'some' | 'map' | 'filter'
  | 'reduce' | 'reduceRight' | 'find' | 'findIndex' | 'fill' | 'copyWithin' | 'includes' | 'flatMap' | 'flat' | 'at'
  | 'findLast' | 'findLastIndex' | 'toReversed' | 'toSorted' | 'toSpliced' | 'with'

export default class OrderedKeyed<Key extends string = string, Value extends any = any>
  implements Omit<Map<Key, Value>, 'forEach' | 'entries' | 'keys' | typeof Symbol.iterator | typeof Symbol.toStringTag>,
    Omit<Array<Value>, typeof Symbol.iterator | 'forEach' | 'push' | NotImplemented> {
  private readonly data: Map<Key, Value>;
  private positions: Array<Key>;

  constructor(...initialValues: (Key | Value)[]) {
    this.data = new Map()
    this.positions = []

    if (initialValues) for (let i = 0; i < initialValues.length; i += 2) {
      const key = initialValues[i], value = initialValues[i + 1]
      if (typeof key !== 'string') throw new TypeError(`Key at index ${i} is not a string. \`initialValues\` must alternate between key and value`)
      this.data.set(key as Key, value as Value)
      this.positions.push(key as Key)
    }

    return new Proxy(this, {
      get(target, key) {
        if (typeof key === 'string') {
          const index = parseInt(key)
          if (isNaN(index)) { // @ts-ignore
            return target[key]
          } else return target.data.get(target.positions[index])
        } else { // @ts-ignore
          return target[key]
        }
      },
      set(target, indexString, value) {
        if (typeof indexString === 'string') {
          const index = parseInt(indexString)
          if (isNaN(index)) return false
          else {
            const key = target.positions[index]
            target.data.set(key, value)
            return true
          }
        } else return false
      }
    })
  }

  [x: number]: Value;

  * [Symbol.iterator]() {
    for (const key of this.positions) yield this.get(key)
  };

  get [Symbol.toStringTag]() {
    return `OrderedKeyed(${this.length})`
  }

  get size() {
    return this.data.size
  }

  clear() {
    this.data.clear()
    this.positions = []
  }

  delete(key: Key) {
    const index = this.positions.indexOf(key)
    this.positions.splice(index, 1)
    return this.data.delete(key)
  }

  get(key: Key) {
    return this.data.get(key)
  }

  has(key: Key) {
    return this.data.has(key)
  }

  set(key: Key, value: Value) {
    if (!this.positions.includes(key)) {
      this.positions.push(key)
    }
    return this.data.set(key, value)
  }

  values() {
    return this.data.values()
  }

  get length() {
    return this.positions.length
  }

  toMap() {
    return new Map(this.data)
  }

  toObject() {
    return Object.fromEntries(Array.from(this.toMap().entries()).map(([key, value]) => [key.toString(), value]))
  }

  toArray() {
    return this.positions.filter(key => this.has(key)).map(key => this.get(key)) as Value[]
  }

  /*entries() {
    return this.positions.entries()
  }

  keys() {
    return this.positions.keys()
  }*/

  forEach(callbackfn: (value: Value, key: Key, index: number) => void) {
    for (let i = 0; i < this.positions.length; i++) {
      const key = this.positions[i]
      callbackfn(this.get(key) as Value, key, i)
    }
  }

  push(key: Key, item: Value) {
    if (this.has(key)) return false
    return this.set(key, item)
  }

  filter<Selected extends Value>(predicate: (value: Value, key: Key, index: number) => value is Selected): OrderedKeyed<Key, Selected> {
    const filtered = new OrderedKeyed<Key, Selected>()
    this.forEach((value, key, index) => {
      if (predicate(value, key, index)) filtered.push(key, value)
    })
    return filtered
  }

  map<Unknown>(callbackfn: (value: Value, key: Key, index: number) => Unknown): OrderedKeyed<Key, Unknown> {
    const mapped = new OrderedKeyed<Key, Unknown>()
    this.forEach((value, key, index) => {
      mapped.push(key, callbackfn(value, key, index))
    })
    return mapped
  }
}
