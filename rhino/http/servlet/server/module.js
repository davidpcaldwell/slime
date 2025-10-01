//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.servlet.internal.server.api.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.servlet.internal.server.api.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var scripts = {
			/** @type { slime.servlet.internal.server.loader.Script } */
			loader: $loader.script("loader.js")
		};

		var api = {
			loader: scripts.loader({
				api: {
					web: $context.library.web
				}
			})
		}

		// $exports.Handler.Loader = function(o) {
		// 	return function(request) {
		// 		if (request.method == "GET") {
		// 			var path = (function(path,index) {
		// 				if (path) return path;
		// 				if (index) return index;
		// 				return path;
		// 			})(request.path, o.index)
		// 			var resource = o.loader.get(path);
		// 			if (resource) {
		// 				return $exports.http.Response.resource(resource);
		// 			} else if (resource === null) {
		// 				return null;
		// 			}
		// 		}
		// 	};
		// }

		/**
		 * @template { any } T
		 * @param { { store: slime.runtime.content.Store<T>, map: slime.$api.fp.Mapping<T,Pick<slime.servlet.Response,"headers"|"body">> } } p
		 * @returns { slime.servlet.Handler }
		 */
		var ContentHandler = function(p) {
			//	TODO	index page handling?
			//	TODO	adding trailing slash for requests for index nodes?
			return function(request) {
				if (request.method == "GET") {
					var path = request.path.split("/");
					//	TODO	should below be 400 Bad Request?
					if (path.length == 0) return $api.fp.Maybe.from.nothing();
					return $api.fp.now(
						path,
						p.store.get,
						$api.fp.Maybe.map(p.map),
						$api.fp.Maybe.map(function(mapped) {
							return {
								status: {
									code: 200
								},
								headers: mapped.headers,
								body: mapped.body
							}
						})
					)
				}
				return $api.fp.Maybe.from.nothing()
			};
		};

		api.loader.Handler.content = ContentHandler;

		$export({
			Handler: api.loader.Handler,
			Request: api.loader.Request,
			http: api.loader.http
		});
	}
//@ts-ignore
)($api,$context,$loader,$export);
