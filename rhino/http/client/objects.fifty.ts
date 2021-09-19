//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.internal.objects {
	export interface Context {
		Cookies: () => slime.jrunscript.http.client.internal.Cookies
		api: {
			io: slime.jrunscript.io.Exports
			web: slime.web.Exports
		}
		Parameters: slime.jrunscript.http.client.internal.Parameters
		urlConnectionImplementation: slime.jrunscript.http.client.spi.Implementation
		sessionRequest: slime.jrunscript.http.client.internal.sessionRequest
		authorizedRequest: slime.jrunscript.http.client.internal.authorizedRequest
		proxiedRequest: slime.jrunscript.http.client.internal.proxiedRequest
	}

	export type Export = slime.jrunscript.http.client.Exports["Client"]

	export type load = slime.loader.Product<Context,Export>
}