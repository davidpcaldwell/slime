namespace slime.jrunscript.io {
	interface Context {
		$slime: slime.jrunscript.runtime.Exports
		api: {
			java: slime.jrunscript.host.Exports
		}
		nojavamail: boolean
	}

	interface Exports {
		Streams: any
		Buffer: any
		Resource: any
		Loader: any
		java: any
		mime: any
		archive: any
		grid: any
	}
}