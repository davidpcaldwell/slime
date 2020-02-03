namespace slime {
	namespace jrunscript {
		namespace file {
			interface Pathname {
				directory: Directory,
				parent: Pathname,
				createDirectory: (p: { exists: (d: Directory) => boolean, recursive?: boolean } ) => Directory,
				write: (any,any?) => any,
				file: File
			}

			interface Node {
				pathname: Pathname,
				remove: () => void,
				parent: Directory,
				move: any
			}

			interface File extends Node {
				read: (any) => any
			}

			interface Directory extends Node {
				getRelativePath: (string) => Pathname,
				getFile: (string) => File,
				getSubdirectory: (string) => Directory,
				createTemporary: (p: any) => Node
			}
		}
	}
}