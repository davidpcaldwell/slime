//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.browser {
	interface Context {
		api: {
			httpd: {
				Tomcat: new (p: {}) => jsh.httpd.Tomcat
			}
		}
	}

	interface ProxyConfiguration {
		code?: string
		pac?: string
		port?: number
	}

	interface ProxyTools {
		Server: () => {
			url: string
			start: () => void
			stop: () => void
		}
		code: string
		response: slime.servlet.Response
	}

	interface Chrome {
		Instance: new (u: {
			location?: slime.jrunscript.file.Pathname
			directory?: slime.jrunscript.file.Directory
			proxy?: slime.jrunscript.shell.browser.ProxyTools
			hostrules?: string[]
			install?: boolean
		}) => any
	}

	interface Exports {
		inject: any

		chrome: Chrome

		ProxyConfiguration: (o: ProxyConfiguration) => ProxyTools
	}
}