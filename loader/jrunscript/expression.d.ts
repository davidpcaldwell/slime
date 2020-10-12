namespace slime.jrunscript.runtime {
	interface Resource extends slime.Resource {
		read: slime.Resource["read"] & {
			binary: () => slime.jrunscript.runtime.io.InputStream
			text: () => slime.jrunscript.runtime.io.Reader
		}
		length?: any
		modified?: any
		string?: any
	}

	interface ResourceArgument extends slime.Resource.Descriptor {
		read?: slime.Resource.Descriptor["read"] & {
			string?: () => string
			binary?: any
			text?: any
		}
		stream?: {
			binary: slime.jrunscript.runtime.io.InputStream
		}
		_loaded?: any
		length?: any
		write?: any
		modified?: any
	}

	interface Exports extends slime.runtime.Exports {
		Loader: any
		Resource: {
			new (p: ResourceArgument): Resource
		}

		io: any
		java: any
		classpath: any
	}
}

namespace Packages {
	namespace inonit.script.runtime.io {
		interface Streams {
			split: any
			readBytes: any
			copy: any
			readLine: any
		}
	}
}