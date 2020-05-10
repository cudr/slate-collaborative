import { Editor } from 'slate'
import { AutomergeEditor } from './automerge-editor'

import withAutomerge, { AutomergeOptions } from './withAutomerge'
import withSocketIO, {
  WithSocketIOEditor,
  SocketIOPluginOptions
} from './withSocketIO'

/**
 * The `withIOCollaboration` plugin contains collaboration with SocketIO.
 */

const withIOCollaboration = <T extends Editor>(
  editor: T,
  options: AutomergeOptions & SocketIOPluginOptions
): T & WithSocketIOEditor & AutomergeEditor =>
  withSocketIO(withAutomerge(editor, options), options)

export default withIOCollaboration
