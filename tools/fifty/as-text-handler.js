//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.tools.documentation.internal.asTextHandler.Context } $context
	 * @param { (value: slime.tools.documentation.internal.asTextHandler.Export) => void } $export
	 */
	function($context,$export) {
		/**
		 *
		 * @param { slime.old.loader.Source } delegate
		 * @returns { slime.old.loader.Source }
		 */
		function textLoaderSource(delegate) {
			return {
				get: function(path) {
					var rv = delegate.get(path);
					rv.type = "text/plain";
					return rv;
				}
			}
		}
		$export(
			function(p) {
				/** @type { slime.old.Loader<slime.jrunscript.runtime.internal.CustomSource,slime.jrunscript.runtime.old.Resource> } */
				//@ts-ignore
				var asTextLoader = new $context.httpd.io.Loader(textLoaderSource(p.loader.source));

				/**
				 *
				 * @param { slime.servlet.Request } request
				 */
				function isAsTextRequest(request) {
					if (request.query) {
						var form = request.query.form(Object);
						var as = form.controls.filter(function(control) {
							return control.name == "as";
						})[0];
						if (as && as.value == "text") {
							return true;
						}
					}
					return false;
				}

				var standardHandler = $context.httpd.Handler.Loader(p);
				var asTextHandler = $context.httpd.Handler.Loader({ loader: asTextLoader, index: p.index });

				return function(request) {
					var handleWith = (isAsTextRequest(request)) ? asTextHandler : standardHandler;
					return handleWith(request);
				}
			}
		)
	}
//@ts-ignore
)($context,$export);
