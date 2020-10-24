namespace slime.jrunscript.mail {
	interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			mime: any
		}
	}

	interface Session {
		send(message: Message): void
		Message(o: Message): {
			resource: slime.jrunscript.runtime.Resource
		}
		java: {
			adapt: any
		}
	}

	interface Recipient {
		name?: string
		address: string
	}

	interface Message {
		to: Recipient[]
		subject: string
		content: slime.jrunscript.runtime.io.InputStream
	}

	interface Exports {
		Session: {
			(p?: {
				properties?: $api.jrunscript.Properties
				credentials?: {
					user: string
					password: string
				}
			}): Session
			properties: {
				GMAIL: $api.jrunscript.Properties
			}
		}
	}
}