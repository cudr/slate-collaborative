import { useState, useCallback, useEffect, useMemo } from 'react'

import { Text, Range, Path, NodeEntry } from 'slate'

import { toJS, Cursor, Cursors } from '@hiveteams/collab-bridge'

import { AutomergeEditor } from './automerge-editor'
import useMounted from './useMounted'

const useCursor = (
  e: AutomergeEditor
): { decorate: (entry: NodeEntry) => Range[]; cursors: Cursor[] } => {
  const [cursorData, setCursorData] = useState<Cursor[]>([])
  const mountedRef = useMounted()

  useEffect(() => {
    e.onCursor = (data: Cursors) => {
      if (!mountedRef.current) return
      const ranges: Cursor[] = []

      const cursors = toJS(data)

      for (let cursor in cursors) {
        if (cursor !== e.clientId && cursors[cursor]) {
          ranges.push(JSON.parse(cursors[cursor]))
        }
      }

      // only update state if this component is still mounted
      if (mountedRef.current) {
        setCursorData(ranges)
      }
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

            const isFocusNode = Path.equals(focus.path, path)
            const isAnchorNode = Path.equals(anchor.path, path)

            ranges.push({
              ...cursor,
              isCaret: isFocusNode,
              anchor: {
                path,
                offset: isAnchorNode
                  ? anchor.offset
                  : isForward
                  ? 0
                  : node.text.length
              },
              focus: {
                path,
                offset: isFocusNode
                  ? focus.offset
                  : isForward
                  ? node.text.length
                  : 0
              }
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
