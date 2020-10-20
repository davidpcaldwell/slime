namespace slime.jrunscript.mail {
	interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			mime: any
		}
	}

	interface Recipient {
		name: string
		address: string
	}

	interface Message {
		to: Recipient[]
	}

	interface Exports {
		Session: any
		Message: (p: {
			to: Recipient[]
		}) => Message
	}
}