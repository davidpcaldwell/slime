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

	namespace Resource {
		interface Descriptor extends slime.Resource.Descriptor {
			read?: slime.Resource.Descriptor["read"] & {
				binary?: any
				text?: any
			}
			stream?: {
				binary: slime.jrunscript.runtime.io.InputStream
			}
			_loaded?: {
				path: string
				resource: Packages.inonit.script.engine.Code.Loader.Resource
			}
			length?: number
			modified?: any
			write?: any
		}

	}

	namespace Loader {
		interface Source extends slime.Loader.Source {
			zip: any
			_source: any
			_file: any
			_url: any
			/** @deprecated */
			resources: any
		}
	}

	interface Exports extends slime.runtime.Exports {
		Loader: any

		Resource: {
			new (p: Resource.Descriptor): Resource
		}

		io: slime.jrunscript.runtime.io.Exports
		java: any
		classpath: any
	}
}

interface $api {
	jrunscript: {
		Properties: {
			codec: {
				object: slime.Codec<$api.jrunscript.Properties,Packages.java.util.Properties>
			}
		}
	}
}

namespace $api {
	var jrunscript: $api["jrunscript"]

	namespace jrunscript {
		type Properties = { [x: string]: string }
	}
}

declare namespace Packages {
	//	TODO	convert Packages to interface by moving these into interface and declaring Packages explicitly everywhere it is
	//			used in the code; should write issue and remove this comment

	const java: any

	namespace java {
		namespace io {
			type InputStream = any
		}

		namespace util {
			interface Properties {
				propertyNames(): any
				getProperty(name: string): string
			}
		}
	}

	const javax: any

	namespace inonit.script.runtime.io {
		interface Streams {
			split: any
			readBytes: any
			copy: any
			readLine: any
		}
	}

	namespace inonit.script.engine {
		namespace Code {
			interface Loader {
				getFile(path: string): Loader.Resource
			}

			namespace Loader {
				interface Resource {
					getInputStream(): Packages.java.io.InputStream
					getLength(): {
						longValue(): number
					}
					getSourceName(): Packages.java.lang.String
					getLastModified(): Packages.java.util.Date
				}
			}
		}
	}

	namespace inonit.script.jsh {
		interface Shell {
			setRuntime: any
			getLoader: any
		}

		namespace Rhino {
			interface Interface {
				script: any
				exit: any
				jsh: any
			}
		}
	}
}