//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.mail {
	interface Context {
		api: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			mime: any
			shell: jsh.shell.Exports
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
		from: Recipient
		to: Recipient[]
		subject: string
		multipart: slime.jrunscript.io.mime.Multipart
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