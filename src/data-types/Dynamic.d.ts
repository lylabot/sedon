import {DataType} from './index.js'

interface DynamicTypeBaseProps {
  ref: string,
}

type DataTypeConstructor<Type> = { new(props: Record<string, any>): DataType<Type> }

interface DynamicTypeWithDefaultProps<Types> extends DynamicTypeBaseProps {
  defaultType: DataTypeConstructor<Types>,
  defaultValue?: Types,
}

export type DynamicTypeProps<Types> = DynamicTypeBaseProps | DynamicTypeWithDefaultProps<Types>

export interface DynamicTypeExport {
  type: string,
  value: any
}

export declare class DynamicType<Types> extends DataType<Types> {
  public readonly ref: string
  public readonly type: DataType<Types> | null

  constructor(props: DynamicTypeProps<Types>): DynamicType<Types>

  /** @description If value is not provided, will try to assign value of current type */
  setType<Type extends Types>(type: DataTypeConstructor<Types>, value?: Type)

  toJSON(): DynamicTypeExport | null
}
