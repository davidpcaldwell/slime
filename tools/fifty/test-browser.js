//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * This script is loaded in the global scope via an HTML script tag, and thus `window` is treated as a scope variable
	 * rather than a context variable, as is `inonit`.
	 *
	 * @param { Window & { console: typeof globalThis["console"] } } window
	 * @param { slime.browser.Runtime } inonit
	 */
	function(window,inonit) {
		var $api = inonit.loader.$api;
		//	TODO	establish new slime loader relative to ../..?

		var code = {
			/** @type { slime.definition.verify.Script } */
			verify: inonit.loader.loader.script("../../loader/api/verify.js"),
			/** @type { slime.definition.test.promises.Script } */
			promises: inonit.loader.loader.script("../../tools/fifty/promises.js")
		};

		var verify = code.verify();

		var promises = code.promises();

		/**
		 * @param { slime.fifty.test.internal.browser.Query } query
		 * @returns
		 */
		var onload = function(query) {

			/**
			 *
			 * @param { HTMLElement } element
			 * @returns { element is HTMLTemplateElement }
			 */
			var isTemplate = function(element) {
				return Boolean(element["content"]);
			};

			/**
			 *
			 * @param { Node } element
			 * @returns { element is HTMLDivElement }
			 */
			var isDiv = function(element) {
				return element instanceof HTMLDivElement;
			};

			/**
			 *
			 * @param { string } id
			 * @returns { HTMLTemplateElement }
			 */
			var getTemplate = function(id) {
				var rv = document.getElementById(id);
				if (isTemplate(rv)) return rv;
			}

			var cloneTemplate = function(id) {
				/**
				 * @returns { HTMLDivElement }
				 */
				function rv() {
					var rv = getTemplate(id).content.firstElementChild.cloneNode(true);
					return isDiv(rv) ? rv : void(0);
				}
				return rv;
			};

			var getHtmlClass = function(result) {
				return (result) ? "success" : "failure"
			};

			var addHtmlClass = function(element,className) {
				element.className = (element.className) ? element.className + " " + className : className;
			}

			var scopes = {
				start: function(scope, name) {
					scope.children[0].innerHTML = name;
				},
				test: function(scope, message, result) {
					var test = templates.test();
					test.children[0].innerHTML = "";
					test.children[0].appendChild(document.createTextNode(message));
					addHtmlClass(test, getHtmlClass(result));
					scope.children[1].appendChild(test);
				},
				end: function(scope, name, result) {
					scope.children[2].innerHTML = "";
					scope.children[2].appendChild(document.createTextNode(name));
					addHtmlClass(scope, getHtmlClass(result));
				}
			}

			var templates = {
				scope: cloneTemplate("scope"),
				test: cloneTemplate("test")
			};

			if (query.design) {
				var top = templates.scope();
				document.body.appendChild(top);
				scopes.start(top, "foo");
				scopes.test(top, "foo is foo", true);
				scopes.end(top, "bar", true);
				return;
			}

			var console = (
				/**
				 *
				 * @param { any } delegate
				 * @returns { slime.fifty.test.internal.Listener }
				 */
				function(delegate) {
					var depth = function(scope) {
						return (scope) ? scope.depth() + 1 : 0;
					};

					/** @type { HTMLElement } */
					var target;

					return {
						start: function(scope, name) {
							if (!target) {
								target = templates.scope();
								document.body.appendChild(target);
							} else {
								var parent = target;
								target = templates.scope();
								parent.children[1].appendChild(target);
							}
							scopes.start(target, name);
							delegate.log("START", depth(scope), name);
						},
						end: function(scope, name, result) {
							scopes.end(target, name, result);
							target = target.parentElement.parentElement;
							delegate.log("END", depth(scope), name, result);
						},
						test: function(scope, message, result) {
							scopes.test(target, message, result);
							delegate.log("TEST", depth(scope), message);
						}
					}
				}
			)(window.console);

			/**
			 *
			 * @param { string } file
			 * @param { string } part
			 */
			var execute = function(file,part) {
				var fiftyLoader = new inonit.loader.Loader(inonit.loader.Base.page.url);

				var code = {
					/** @type { slime.fifty.test.internal.test.Script } */
					test: fiftyLoader.script("test.js")
				}

				var implementation = code.test({
					library: {
						Verify: verify
					},
					promises: promises,
					console: console,
					window: {
						global: window
					}
				});

				var path = (function(file) {
					var elements = file.split("/");
					var parent = elements.slice(0, elements.length-1).join("/") + "/";
					return {
						parent: parent,
						file: elements[elements.length-1]
					}
				})(inonit.loader.Base.page.relative(file));

				var loader = Object.assign(
					new inonit.loader.Loader(path.parent),
					{
					}
				);

				return implementation.run({
					loader: loader,
					scopes: {},
					path: path.file,
					part: part
				});
			};

			//	TODO	currently result is just a boolean indicating success/failure. We may want a more sophisticated regime which
			//			communicates events that can be reconstructed

			var result = (function() {
				try {
					return execute(query.file, query.part);
				} catch (e) {
					window.alert(e);
					return Promise.resolve(false);
				}
			})();

			result.then(function(result) {
				if (query.results == "true") {
					var xhr = new XMLHttpRequest();
					xhr.open("POST","result",false);
					var payload = result;
					xhr.send(JSON.stringify(payload));
				} else {
					window.console.log("result = ", result);
				}
			});
		};

		window.addEventListener("load", function() {
			/** @type { slime.loader.Script<{ window: Window },slime.web.Exports> } */
			var script = inonit.loader.loader.script("../../js/web/module.browser.js");
			// /** @type { slime.web.Exports } */
			// var web = inonit.loader.loader.module("../../js/web/module.browser.js", {
			// 	window: window
			// });
			script.thread({
				window: window
			}).then(
				function(web) {
					//	TODO	web module probably has easier way to parse query string
					/** @type { slime.fifty.test.internal.browser.Query } */
					var query = $api.fp.result(
						void(0),
						web.window.url,
						$api.fp.property("query"),
						web.Url.query.parse,
						$api.fp.Array.map(
							/** @returns { [string, string] } */
							function(control) {
								return [control.name, control.value];
							}
						),
						Object.fromEntries,
						function(p) {
							/** @type { (value: string) => "true" | "false" } */
							var toTrueFalse = function(value) {
								if (value == "true" || value == "false") return value;
							}
							/** @type { (value: string) => number } */
							var toNumber = function(value) {
								return (typeof(value) == "string") ? Number(value) : void(0);
							}
							return $api.Object.compose(p, {
								results: toTrueFalse(p.results),
								design: p.design,
								file: p.file,
								part: p.part,
								delay: toNumber(p.delay)
							});
						}
					);

					//	The need for this delay seems to stem from .ts files attempting to load .js files; wondering whether it has to do
					//	with the preflight requests for .ts files being slow because of the need to run the TypeScript compiler. May want
					//	to try handling the OPTIONS request without running tsc. The resulting error
					//	"NetworkError: Failed to execute 'send' on 'XMLHttpRequest'" seems to commonly be caused by CORS issues, although
					//	it also occurs in Chrome DevTools when attempting to execute synchronous XHRs from the console.
					window.setTimeout(function() {
						onload(query);
					}, query.delay || 0);
				}
			);
		});
	}
//@ts-ignore
)(window,inonit);
