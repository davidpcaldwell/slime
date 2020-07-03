namespace slime.jrunscript.runtime {
	interface Resource extends slime.runtime.Resource {
		read: slime.Resource["read"] & {
			binary: () => slime.jrunscript.runtime.io.InputStream
			text: () => slime.jrunscript.runtime.io.Reader
		}
	}

	interface ResourceArgument extends slime.runtime.ResourceArgument {
	}

	interface Exports extends slime.runtime.Exports {
		$api: any
		Loader: any
		Resource: new (p: ResourceArgument) => Resource

		mime: any

		io: any
		java: any
		classpath: any
	}
}