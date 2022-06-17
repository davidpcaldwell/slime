//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		ui: {
			application: (
				p: slime.jsh.ui.application.Argument,
				events?: $api.events.Function.Receiver
			) => {
				port: number
				server: any
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
	export namespace internal {
		export interface Exports {
			Application: slime.jsh.Global["ui"]["application"]
		}
	}

	export interface ServerConfiguration {
		/**
		 * See {@link slime.jsh.httpd.tomcat.Configuration}.
		 */
		port?: number

		https?: slime.jsh.httpd.tomcat.Configuration["https"]

		resources: slime.Loader
		parameters?: slime.jsh.httpd.servlet.Parameters
		servlet: slime.jsh.httpd.servlet.descriptor
	}

	export interface ServerRunning {
		server: slime.jsh.httpd.Tomcat
	}

	export type ServerSpecification = ServerRunning | ServerConfiguration

	export interface ChromeConfiguration {
		location?: slime.jrunscript.file.Pathname
		directory?: slime.jrunscript.file.Directory
		browser?: boolean
		debug?: {
			port?: number
		}

		/**
		 * A Chrome feature allowing host resolution rules to be specified. See [this list](http://imfly.github.io/electron-docs-gitbook/en/api/chrome-command-line-switches.html)
		 * of Chrome command-line switches for one explanation of how these values work.
		 *
		 * The rules are represented as an array in this API (on the command line, they are delimited by `,`).
		 */
		hostrules?: string[]
	}

	export interface BrowserSpecification {
		proxy?: slime.jrunscript.shell.browser.ProxyConfiguration
			| ( (p: { port: number }) => slime.jrunscript.shell.browser.ProxyConfiguration )

		/**
		 * If `proxy` is not specified, this value provides a simple way of mapping all requests for the given host to the HTTP
		 * port of the application's server, and routing all other requests to their hosts.
		 */
		host?: string

		chrome?: ChromeConfiguration

		run?: any
		zoom?: any
		console?: any
		create?: any
	}

	/**
	 * @deprecated Use {@link slime.jsh.ui.application.BrowserSpecification}.
	 */
	export type BrowserFunction = (p: any) => void

	export type BrowserConfiguration = BrowserSpecification | BrowserFunction

	export interface ClientSpecification {
		browser: BrowserConfiguration

		url?: string

		/**
		 * The path in the server application to open when opening the application.
		 */
		path?: string
	}

	export interface EventsConfiguration {
		close: () => void
	}

	export interface EventsSpecification {
		on?: EventsConfiguration
	}

	export interface Deprecated {
		/** @deprecated */
		zoom?: any
		/** @deprecated */
		console?: any
	}

	export type Argument = ServerSpecification & ClientSpecification & EventsSpecification & Deprecated
}
