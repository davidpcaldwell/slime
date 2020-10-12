namespace slime.jrunscript.io.mime {
	interface Context {
		/** @deprecated */
		gae: boolean
		nojavamail: boolean
		$slime: jsh.plugin.$slime
		api: {
			java: slime.jrunscript.host.Exports
			io: any
		}
	}

	interface Exports {
		Multipart: any
		Type: any
	}
}