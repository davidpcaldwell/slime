//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.mail {
	export interface Context {
		api: {
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			mime: any
			shell: slime.jsh.shell.Exports
		}
	}

	export interface Session {
		send(message: Message): void
		Message(o: Message): {
			resource: slime.jrunscript.runtime.old.Resource
		}
		java: {
			adapt: any
		}
	}

	export interface Recipient {
		name?: string
		address: string
	}

	interface Message {
		from: Recipient
		to: Recipient[]
		subject: string
		multipart: slime.jrunscript.io.mime.Multipart
	}

	export interface Exports {
		Session: {
			(p?: {
				properties?: slime.jrunscript.java.Properties
				credentials?: {
					user: string
					password: string
				}
			}): Session
			properties: {
				GMAIL: slime.jrunscript.java.Properties
			}
		}
	}
}
