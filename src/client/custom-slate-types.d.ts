// This example is for an Editor with `ReactEditor` and `HistoryEditor`
import { BaseEditor, BaseRange } from 'slate'
import { HistoryEditor } from 'slate-history'

export type CustomEditor = BaseEditor & HistoryEditor

export type CustomElement = {
  type?: string
  children: CustomText[]
}

export type CustomRange = {
  isCaret?: boolean
} & BaseRange

export type FormattedText = { text: string; bold?: boolean }

export type CustomText = FormattedText

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
    Range: CustomRange
  }
}
