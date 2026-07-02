import {NumberNoEvalType} from './NumberNoEval.js'
import Mexp from 'math-expression-evaluator'
import {Decimal} from 'decimal.js'

// @ts-ignore "TS2351: ThIs ExPrEsSiOn Is NoT cOnStRuCtAbLe" SUCK MY FUCKING DICK YOU STUPID PIECE OF SHIT TYPE SYSTEM
const mexp = new Mexp()

export class NumberType extends NumberNoEvalType {
  setFormattedValue(value: string) {
    const backupValue = this.valueOf()
    try {
      this.setValue(new Decimal(mexp.eval(value)))
    } catch (e) {
      // todo: show error near input
      this.setValue(backupValue)
    }
  }
}
