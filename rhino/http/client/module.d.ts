//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client {
	type Pairs = { name: string, value: string }[] | { [x: string]: string | string[] }

	interface Request {
		method?: string
		url: any
		headers?: Pairs
		params?: Pairs
		parameters?: Pairs
		authorization?: Authorization
		proxy?: any
		body?: any
		timeout?: any
		on?: any
	}

	interface Response {
		request: Request
		status: {
			code: number
			reason: string
			/**
			 * @deprecated Same as `reason`
			 */
			message: string
		}
		headers: (
			{
				name: string
				value: string
			}[]
			&
			{
				get: any
			}
		)
		body: {
			type: slime.MimeType
			//	TODO	Possibly should be slime.jrunscript.InputStream or slime.jrunscript.io.InputStream
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	type Authorization = string

	interface request {
		(p: Request & { evaluate: JSON }): any
		<T>(p: Request & { evaluate: (Response) => T }): T
		<T>(p: Request & { parse: (Response) => T }): T
		(p: Request): Response
	}

	interface Client {
		request: request,
		Loader: any
	}

	interface Context {
		debug: any
		gae: any
		api: {
			web: any
			java: any
			js: any
			io: any
		}
	}

	type spi = (
		p: {
			method: string
			url: any
			headers: any
			proxy: any
			timeout: any
			body: any
		},
		cookies?: any
	) => {
		status: {
			code: number
			reason: string
		}
		headers: (
			{
				name: string
				value: string
			}[]
		)
		stream: slime.jrunscript.runtime.io.InputStream
	}

	interface Exports {
		Client: new (configuration?: {
			authorization?: any
			spi?: (standard: spi) => spi
			proxy?: any
			TREAT_302_AS_303?: boolean
		}) => Client

		Authentication: {
			Basic: {
				Authorization: (p: { user: string, password: string }) => Authorization
			}
		}

		test: {
			disableHttpsSecurity()
		}

		Body: any
		Loader: any
		Parser: any
	}
}