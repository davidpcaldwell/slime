//@ts-check
(
	/**
	 *
	 * @param { slime.browser.Exports } inonit
	 */
	function(inonit) {
		var $api = inonit.loader.$api;
		//	TODO	establish new slime loader relative to ../../../..?
		/** @type { slime.web.Exports } */
		var web = inonit.loader.loader.module("../../../../js/web/module.browser.js");

		var code = {
			verify: inonit.loader.loader.factory("../../../../loader/api/verify.js")
		};

		window.addEventListener("load", function() {
			var query = $api.Function.result(
				void(0),
				web.window.url,
				$api.Function.property("query"),
				web.Url.query.parse,
				$api.Function.Array.map(function(control) { return [control.name, control.value]; }),
				$api.Function.Object.fromEntries
			);

			var verify = code.verify();

			var console = (
				/**
				 *
				 * @param { any } delegate
				 * @returns { slime.fifty.test.internal.Console }
				 */
				function(delegate) {
					return {
						start: function(depth, name) {
							delegate.log("START", depth, name);
						},
						end: function(depth, name, result) {
							delegate.log("END", depth, name, result);
						},
						test: function(depth, message) {
							delegate.log("TEST", depth, message);
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
				var fiftyLoader = new inonit.loader.Loader("../../../../loader/api/test/fifty/");

				/** @type { slime.fifty.test.internal.run } */
				var implementation = fiftyLoader.file("test.js", {
					library: {
						verify: verify
					},
					console: console
				});

				var path = (function(file) {
					var elements = file.split("/");
					var parent = elements.slice(0, elements.length-1).join("/") + "/";
					var file = elements[elements.length-1];
					return {
						parent: parent,
						file: file
					}
				})(file);

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

			var result = execute(query.file, "suite");

			debugger;
		});
	}
//@ts-ignore
)(inonit);
