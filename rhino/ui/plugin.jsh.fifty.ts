//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		ui: {
			javafx: slime.jrunscript.ui.Exports["javafx"] & {
				WebView: any
			}

			application: (
				p: slime.jsh.ui.application.Argument,
				events?: $api.event.Function.Receiver
			) => {
				port: number
				server: any
				browser: any
			}

			askpass: slime.jsh.ui.askpass.Exports

			desktop: {
				clipboard: {
					copy: {
						string: slime.$api.fp.world.Action<string,void>
					}
				}
			}

			/**
			 * @deprecated replaced by `application`
			 */
			browser: slime.jsh.Global["ui"]["application"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.clipboard = function() {
				$api.fp.world.now.action(
					jsh.ui.desktop.clipboard.copy.string,
					"foo"
				);
				jsh.shell.console("Hopefully copied 'foo' to clipboard.");
			}
		}
	//@ts-ignore
	)(fifty);
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

		resources: slime.old.Loader
		parameters?: slime.jsh.httpd.servlet.Parameters
		servlet: slime.jsh.httpd.servlet.descriptor
	}

	export interface ServerRunning {
		server: Pick<slime.jsh.httpd.Tomcat,"start" | "stop" | "port">
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
