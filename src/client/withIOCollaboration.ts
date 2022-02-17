import { Editor } from 'slate'

import withAutomerge from './withAutomerge'
import {
  AutomergeEditor,
  AutomergeOptions,
  SocketIOPluginOptions,
  WithSocketIOEditor
} from './interfaces'
import withSocketIO from './withSocketIO'

/**
 * The `withIOCollaboration` plugin contains collaboration with SocketIO.
 */

const withIOCollaboration = <T extends Editor>(
  editor: T,
  options: AutomergeOptions & SocketIOPluginOptions
): T & WithSocketIOEditor & AutomergeEditor =>
  withSocketIO(withAutomerge(editor, options), options)

export default withIOCollaboration
