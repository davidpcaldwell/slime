//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client {
	export type Pairs = { name: string, value: string }[] | { [x: string]: string | string[] }

	export interface Request {
		method?: string
		url: slime.web.Url | string
		headers?: Pairs
		params?: Pairs
		parameters?: Pairs
		authorization?: Authorization
		proxy?: any
		body?: request.Body
		timeout?: any
		on?: any
	}

	export namespace request {
		export type Body = body.Stream | body.Binary | body.String

		export namespace body {
			type Type = { type: slime.mime.Type | string }
			export type Stream = Type & { stream: slime.jrunscript.runtime.io.InputStream }
			export type Binary = Type & { read: { binary: () => slime.jrunscript.runtime.io.InputStream } }
			export type String = Type & { string: string }
		}
	}

	export interface Response {
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
			type: slime.mime.Type
			//	TODO	Possibly should be slime.jrunscript.InputStream or slime.jrunscript.io.InputStream
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	type Authorization = string

	export namespace client {
		export interface request {
			(p: Request & { evaluate: JSON }): any
			<T>(p: Request & { evaluate: (Response) => T }): T
			<T>(p: Request & { parse: (Response) => T }): T
			(p: Request): Response
		}
	}

	export interface Client {
		request: client.request,
		Loader: any
	}

	export interface Context {
		debug: any
		gae: any
		api: {
			web: slime.web.Exports
			java: slime.jrunscript.host.Exports
			js: any
			io: slime.jrunscript.io.Exports
		}
	}

	export type spi = (
		p: {
			method: string
			url: any
			headers: any
			proxy: any
			timeout: any
			body: Request["body"]
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

	export interface Exports {
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