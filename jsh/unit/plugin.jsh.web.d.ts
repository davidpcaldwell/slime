namespace jsh.unit {
	interface mock {
		Web: mock.Web.constructor
	}
}

namespace jsh.unit.mock {
	type handler = slime.servlet.handler & { stop?: () => void }

	namespace Web {
		interface hg {
			/** an object that describes the Mercurial configuration needed for Mercurial to use this mock internet. */
			config: object
		}

		interface https {
			port: number
			client: slime.jrunscript.http.client.Client
		}

		interface argument {
			trace: boolean
		}

		namespace constructor {
			type Function = new (o?: jsh.unit.mock.Web.argument) => jsh.unit.mock.Web
		}

		type constructor = constructor.Function & {
			bitbucket: (o: {}) => handler
			github: (o: {}) => handler
		}
	}

	interface Web {
		/** adds a handler that can supply parts of the mock internet */
		add: (handler: jsh.unit.mock.handler) => void

		/** described on definition page */
		client: slime.jrunscript.http.client.Client

		/** described on definition page */
		jrunscript: Function

		/** the environment to use when launching a process that proxies through this mock internet; sets http_proxy variable */
		environment: object

		hg: hg

		start: () => void

		stop: () => void

		https: https
	}
}