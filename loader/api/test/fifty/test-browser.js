//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.browser.Runtime } inonit
	 */
	function(inonit) {
		var $api = inonit.loader.$api;
		//	TODO	establish new slime loader relative to ../../../..?
		/** @type { slime.web.Exports } */
		var web = inonit.loader.loader.module("../../../../js/web/module.browser.js");

		var code = {
			verify: inonit.loader.loader.factory("../../../../loader/api/verify.js")
		};

		/** @type { slime.definition.test.promises.Export } */
		var promises = inonit.loader.loader.module("../../../../loader/api/promises.js");

		window.addEventListener("load", function() {
			/** @type { slime.fifty.browser.test.internal.Query } */
			var query = $api.Function.result(
				void(0),
				web.window.url,
				$api.Function.property("query"),
				web.Url.query.parse,
				$api.Function.Array.map(
					/** @returns { [string, string] } */
					function(control) {
						return [control.name, control.value];
					}
				),
				$api.Function.Object.fromEntries,
				function(p) {
					return $api.Object.compose(p, {
						results: p.results,
						design: p.design,
						file: p.file,
						part: p.part
					});
				}
			);

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

			var verify = code.verify();

			var console = (
				/**
				 *
				 * @param { any } delegate
				 * @returns { slime.fifty.test.internal.Console }
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
				var fiftyLoader = new inonit.loader.Loader(inonit.loader.nugget.page.base);

				var code = {
					/** @type { slime.fifty.test.internal.test.Factory } */
					test: fiftyLoader.factory("test.js")
				}

				var implementation = code.test({
					promises: promises,
					library: {
						Verify: verify
					},
					console: console
				});

				var path = (function(file) {
					var elements = file.split("/");
					var parent = elements.slice(0, elements.length-1).join("/") + "/";
					return {
						parent: parent,
						file: elements[elements.length-1]
					}
				})(inonit.loader.nugget.page.relative(file));

				var loader = Object.assign(
					new inonit.loader.Loader(path.parent),
					{
						getRelativePath: function(path) {
							throw new Error("Unimplemented.");
						}
					}
				);

				return implementation(
					loader,
					path.file,
					part
				);
			};

			//	TODO	currently result is just a boolean indicating success/failure. We may want a more sophisticated regime which
			//			communicates events that can be reconstructed

			var result = execute(query.file, query.part);

			if (query.results == "true") {
				var xhr = new XMLHttpRequest();
				xhr.open("POST","result",false);
				var payload = result;
				xhr.send(JSON.stringify(payload));
			}
		});
	}
//@ts-ignore
)(inonit);
