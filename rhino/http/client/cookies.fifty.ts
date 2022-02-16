//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.internal {
	export interface Cookies {
		/**
		 * Sets the appropriate cookies on this object for response headers received when requesting the given URL.
		 *
		 * @param url - the URL requested
		 * @param headers - the response headers received
		 */
		set(url: string, headers: Header[])

		/**
		 *
		 * @param url - the URL to be requested
		 * @param headers - the headers to be sent with it, which will be modified to include any appropriate `Cookie:` headers.
		 */
		get(url: string, headers: Header[])
	}
}

namespace slime.jrunscript.http.client.internal.cookies {
	export interface Export {
		inonit: () => slime.jrunscript.http.client.internal.Cookies
		java: () => slime.jrunscript.http.client.internal.Cookies
	}

	export type Script = slime.loader.Script<void,Export>
}
