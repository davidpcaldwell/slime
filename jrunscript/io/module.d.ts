namespace slime.jrunscript.io {
	interface Context {
		$slime: slime.jrunscript.runtime.Exports
		api: {
			java: slime.jrunscript.host.Exports
		}
		nojavamail: boolean
	}

	interface Exports {
		Streams: slime.jrunscript.runtime.Exports["Streams"]
		Buffer: slime.jrunscript.runtime.Exports["Buffer"]
		Resource: slime.jrunscript.runtime.Exports["Resource"]
		Loader: slime.jrunscript.runtime.Exports["Loader"]
		java: {
			adapt: any
		}
		mime: slime.jrunscript.io.mime.Exports
		archive: any
		grid: any
	}
}