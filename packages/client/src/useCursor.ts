import { useState, useCallback, useEffect, useMemo } from 'react'

import { Text, Range, Path, NodeEntry } from 'slate'

import { toJS, Cursor, Cursors } from '@slate-collaborative/bridge'

import { CollabEditor } from './collab-editor'

const useCursor = (
  e: CollabEditor
): { decorate: (entry: NodeEntry) => Range[]; cursors: Cursor[] } => {
  const [cursorData, setSursorData] = useState<Cursor[]>([])

  useEffect(() => {
    e.onCursor = (data: Cursors) => {
      const ranges: Cursor[] = []

      const cursors = toJS(data)

      for (let cursor in cursors) {
        if (cursor !== e.clientId && cursors[cursor]) {
          ranges.push(cursors[cursor])
        }
      }

      setSursorData(ranges)
    }
  }, [])

  const cursors = useMemo<Cursor[]>(() => cursorData, [cursorData])

  const decorate = useCallback(
    ([node, path]: NodeEntry) => {
      const ranges: Range[] = []

      if (Text.isText(node) && cursors?.length) {
        cursors.forEach(cursor => {
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
