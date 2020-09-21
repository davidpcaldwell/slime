interface jsh {
	ui: {
		application: (
			p: jsh.ui.application.Argument,
			events?: $api.Events.Function.Receiver
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
		browser: jsh["ui"]["application"]
	}
}

namespace jsh.ui.application {
	interface ServerConfiguration {
		port?: number
		resources: slime.Loader
		parameters: jsh.httpd.servlet.Parameters
		servlet: jsh.httpd.servlet.descriptor
	}

	interface ServerRunning {
		server: jsh.httpd.Tomcat
	}

	type ServerSpecification = ServerRunning | ServerConfiguration

	interface Events {
		on?: {
			close: () => void
		}
	}

	interface ChromeConfiguration {
		location?: slime.jrunscript.file.Pathname
		directory?: slime.jrunscript.file.Directory
		browser?: boolean
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

	interface BrowserSpecification {
		browser: BrowserConfiguration
	}

	interface Deprecated {
		zoom?: any
		console?: any
	}

	type Argument = ServerSpecification & Events & BrowserSpecification & { path: string } & Deprecated
}
