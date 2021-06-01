//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	interface Global {
		ui: {
			application: (
				p: slime.jsh.ui.application.Argument,
				events?: $api.events.Function.Receiver
			) => {
				port: number,
				server: any,
				browser: any
			}

			askpass: any
			javafx: any
			Chrome: any

			/**
			 * Deprecated; replaced by application
			 */
			browser: slime.jsh.Global["ui"]["application"]
		}
	}
}

namespace slime.jsh.ui.application {
	namespace internal {
		interface Exports {
			Application: slime.jsh.Global["ui"]["application"]
		}
	}

	interface ServerConfiguration {
		/**
		 * See {@link slime.jsh.httpd.Tomcat.Configuration}.
		 */
		port?: number
		resources: slime.Loader
		parameters: slime.jsh.httpd.servlet.Parameters
		servlet: slime.jsh.httpd.servlet.descriptor
	}

	interface ServerRunning {
		server: slime.jsh.httpd.Tomcat
	}

	type ServerSpecification = ServerRunning | ServerConfiguration

	interface ChromeConfiguration {
		location?: slime.jrunscript.file.Pathname
		directory?: slime.jrunscript.file.Directory
		browser?: boolean
		debug?: {
			port?: number
		}
	}

	type BrowserConfiguration = {
		host?: string
		chrome?: ChromeConfiguration

		proxy?: slime.jrunscript.shell.browser.ProxyConfiguration
			| ( (p: { port: number }) => slime.jrunscript.shell.browser.ProxyConfiguration )

		run?: any
		zoom?: any
		console?: any
		create?: any
	} | ((p: any) => void)

	interface ClientSpecification {
		browser: BrowserConfiguration
		/**
		 * The path in the server application to open when opening the application.
		 */
		path?: string
	}

	interface EventsConfiguration {
		close: () => void
	}

	interface EventsSpecification {
		on?: EventsConfiguration
	}

	interface Deprecated {
		/** @deprecated */
		zoom?: any
		/** @deprecated */
		console?: any
	}

	type Argument = ServerSpecification & ClientSpecification & EventsSpecification & Deprecated
}
