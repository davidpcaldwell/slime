//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io.mime {
	interface Context {
		/** @deprecated */
		gae: boolean
		nojavamail: boolean
		$slime: jsh.plugin.$slime
		api: {
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	/**
	 * A MIME entity, as defined by {@link http://tools.ietf.org/html/rfc2045#section-2.4|RFC 2045 section 2.4}.
	 */
	interface Entity {
		resource?: slime.jrunscript.runtime.Resource

		type?: slime.mime.Type
		stream?: slime.jrunscript.runtime.io.InputStream
		string?: string
	}

	interface Part extends Entity {
		filename: string
	}

	interface Multipart extends slime.jrunscript.runtime.Resource {
		java?: {
			adapt: () => Packages.java.mail.internet.MimeMultipart
		}
	}

	interface Exports {
		Multipart: (p: {
			subtype: string
			parts: Part[]
		}) => Multipart

		Type: slime.runtime.Exports["mime"]["Type"] & { guess: (p: { name: string }) => slime.MimeType.Object }
	}
}