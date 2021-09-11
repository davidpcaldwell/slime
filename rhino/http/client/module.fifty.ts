//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client {
	export type Pairs = { name: string, value: string }[] | { [x: string]: string | string[] }

	/** @deprecated Replaced by `object.Request`. */
	export type Request = object.Request;
	/** @deprecated Replaced by `object.Response`. */
	export type Response = object.Response;

	export namespace request {
		export type Body = body.Stream | body.Binary | body.String

		export namespace body {
			type Type = { type: slime.mime.Type | string }
			export type Stream = Type & { stream: slime.jrunscript.runtime.io.InputStream }
			export type Binary = Type & { read: { binary: () => slime.jrunscript.runtime.io.InputStream } }
			export type String = Type & { string: string }
		}
	}

	export interface Header {
		name: string
		value: string
	}

	type Authorization = string

	export namespace object {
		export interface Request {
			method?: string
			url: slime.web.Url | string

			/** @deprecated */
			params?: Pairs
			/** @deprecated */
			parameters?: Pairs

			headers?: Pairs
			authorization?: Authorization
			proxy?: Proxy
			body?: request.Body
			timeout?: Timeouts
			on?: any
		}

		export interface request {
			(p: Request & { evaluate: JSON }): any
			<T>(p: Request & { evaluate: (Response) => T }): T
			<T>(p: Request & { parse: (Response) => T }): T
			(p: Request): Response
		}

		export interface Response {
			request: Request
			/**
			 * See https://datatracker.ietf.org/doc/html/rfc7230#section-3.1.2
			 */
			status: {
				code: number
				reason: string
			}
			headers: Header[]
			body: {
				type: slime.mime.Type
				//	TODO	Possibly should be slime.jrunscript.InputStream or slime.jrunscript.io.InputStream
				stream: slime.jrunscript.runtime.io.InputStream
			}
		}
	}

	export interface Client {
		request: object.request,
		Loader: any
	}

	export interface Context {
		debug: any
		gae: boolean
		api: {
			web: slime.web.Exports
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
		}
	}

	export namespace spi {
		export interface Argument {
			request: {
				method: string
				url: slime.web.Url
				headers: Header[]
				body: request.Body
			}
			proxy: Proxy
			timeout: Timeouts
		}

		export interface Response {
			status: {
				code: number
				reason: string
			}
			headers: Header[]
			stream: slime.jrunscript.runtime.io.InputStream
		}

		export namespace old {
			export interface Request {
				method: string
				url: slime.web.Url
				headers: Header[]
				body: request.Body
				proxy: Proxy
				timeout: Timeouts
			}

			export type implementation = (p: Request) => Response
		}
	}

	export interface Proxy {
		http?: {
			host: any
			port: any
		}
		https?: {
			host: any
			port: any
		}
		socks?: {
			host: any
			port: any
		}
	}

	export interface Timeouts {
		connect: any
		read: any
	}

	export interface Configuration {
		authorization?: any
		spi?: (standard: spi.old.implementation) => spi.old.implementation
		proxy?: Proxy | ((p: Request) => Proxy)
		TREAT_302_AS_303?: boolean
	}

	export interface Exports {
		Client: new (configuration?: Configuration) => Client

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