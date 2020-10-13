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

	/**
	 * A MIME entity, as defined by {@link http://tools.ietf.org/html/rfc2045#section-2.4|RFC 2045 section 2.4}.
	 */
	interface Entity {
		type: MimeType
		stream?: slime.jrunscript.runtime.io.InputStream
		string?: string
	}

	interface Part extends Entity {
		filename: string
	}

	interface Exports {
		Multipart: (p: {
			subtype: string
			parts: Part[]
		}) => {}

		Type: any
	}
}