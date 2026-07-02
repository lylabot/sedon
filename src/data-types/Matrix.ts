import {DataType} from './index.js'

export interface MatrixTypeProps<D extends number, V> {
  dimensions: D,
  type: DataType<V>,
  defaultValue?: RecursiveArray<V, D>
}

type RecursiveArray<T, N extends number, Acc extends any[] = []> = Acc['length'] extends N ? T : RecursiveArray<T[], N, [...Acc, any]>

export class MatrixType<D extends number, V> extends DataType<RecursiveArray<V, D>> {
  public static name = 'Matrix'
  public underlying: DataType<V>
  public name = MatrixType.name

  constructor(props: MatrixTypeProps<D, V>) {
    super({defaultValue: props.defaultValue ?? [] as RecursiveArray<V, D>})
    this.underlying = props.type
    if (this.underlying) {
      this.name = `${this.name}<${this.underlying.name}>`
      this.wire.addChild(this.underlying.wire)
    }
    // this.underlying.setParent(this)
  }
}
