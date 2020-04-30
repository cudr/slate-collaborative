import { useState, useCallback, useEffect, useMemo } from 'react'

import { Text, Range, Path } from 'slate'

import { toJS } from '@slate-collaborative/bridge'

import { CollabEditor } from './collab-editor'

const useCursor = (e: CollabEditor): { decorate: any; cursors: any } => {
  const [cursorData, setSursorData] = useState<any>(null)

  useEffect(() => {
    e.onCursor = (data: any) => {
      const ranges = []

      const cursorData = toJS(data)

      for (let cursor in cursorData) {
        if (cursor !== e.clientId && cursorData[cursor]) {
          ranges.push(cursorData[cursor])
        }
      }

      setSursorData(ranges)
    }
  }, [])

  const cursors = useMemo(() => cursorData, [cursorData])

  const decorate = useCallback(
    ([node, path]) => {
      const ranges: Range[] = []

      if (Text.isText(node) && cursors?.length) {
        cursors.forEach((cursor: Range) => {
          if (Range.includes(cursor, path)) {
            const { focus, anchor, isForward } = cursor

            ranges.push({
              ...cursor,
              isCaret: isForward
                ? Path.equals(focus.path, path)
                : Path.equals(anchor.path, path),
              anchor: Path.isBefore(anchor.path, path)
                ? { ...anchor, offset: 0 }
                : anchor,
              focus: Path.isAfter(focus.path, path)
                ? { ...focus, offset: node.text.length }
                : focus
            })
          }
        })
      }

      return ranges
    },
    [cursors]
  )

  return {
    cursors,
    decorate
  }
}

export default useCursor
