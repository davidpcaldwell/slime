//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.scripts.Scope["$slime"] } $slime
	 * @param { slime.runtime.internal.scripts.Scope["$platform"] } $platform
	 * @param { slime.runtime.internal.scripts.Scope["$engine"] } $engine
	 * @param { slime.runtime.internal.scripts.Scope["$api"] } $api
	 * @param { slime.runtime.internal.scripts.Scope["mime"] } mime
	 * @param { slime.runtime.internal.scripts.Scope["mimeTypeIs"] } mimeTypeIs
	 * @param { slime.loader.Export<slime.runtime.internal.scripts.Exports> } $export
	 */
	function($slime,$platform,$engine,$api,mime,mimeTypeIs,$export) {
		/**
		 * @type { slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"] }
		 */
		var toExportScope = function(scope) {
			var rv = Object.assign(scope, { $exports: void(0), $export: void(0) });
			var $exports = {};
			var $export = function(v) {
				$exports = v;
			};
			Object.defineProperty(scope, "$exports", {
				get: function() {
					return $exports;
				},
				enumerable: true
			});
			Object.defineProperty(scope, "$export", {
				get: function() {
					return $export;
				},
				enumerable: true
			});
			return rv;
		};

		/** @type { slime.runtime.internal.scripts.Exports["createScriptScope"] } */
		var createScriptScope = function($context) {
			var toT = function(any) { return any; };

			return toExportScope({
				$context: ($context) ? $context : toT({})
			});
		};

		/** @type { slime.runtime.$slime.CoffeeScript } */
		var $coffee = (function() {
			//	TODO	rename to getCoffeescript to make consistent with camel case.
			if (!$slime.getCoffeeScript) return null;
			var coffeeScript = $slime.getCoffeeScript();
			if (!coffeeScript) return null;
			if (coffeeScript.code) {
				var target = {};
				$engine.execute({ name: "coffee-script.js", js: String(coffeeScript.code) }, {}, target);
				return target.CoffeeScript;
			} else if (coffeeScript.object) {
				return coffeeScript.object;
			}
		})();

		//	resource.type: optional, but if it is not a recognized type, this method will error
		//	resource.name: optional, but used to determine default type if type is absent, and used for resource.js.name
		//	resource.string: optional, but used to determine code
		//	resource.js { name, code }: forcibly set based on other properties
		//	TODO	re-work resource.js

		/**
		 *
		 * @param { { name: string, type: slime.mime.Object, string: string } } script
		 * @param { { [name: string]: any } } scope
		 */
		function newrun(script,scope) {
			var typeIs = function(string) {
				return script.type && mimeTypeIs(string)(script.type);
			}

			var js;
			if ($slime.typescript && typeIs("application/x.typescript")) {
				js = {
					name: script.name,
					code: $slime.typescript.compile(script.string)
				};
			} else if (typeIs("application/vnd.coffeescript")) {
				js = {
					name: script.name,
					code: $coffee.compile(script.string)
				};
			} else if (typeIs("application/javascript") || typeIs("application/x-javascript")) {
				js = {
					name: script.name,
					code: script.string
				}
			}
			if (!js) {
				throw new TypeError("Resource " + script.name + " is not JavaScript; type = " + script.type);
			}
			var target = this;
			var global = (function() { return this; })();
			//	TODO	why is this present?
			if (scope === global) {
				scope = {};
			}
			if (scope === void(0)) {
				scope = {};
			}
			scope.$platform = $platform;
			scope.$api = $api;
			$engine.execute(
				{
					name: js.name,
					js: js.code
				},
				scope,
				target
			);
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["run"] }
		 */
		function run(object,scope) {
			if (!object || typeof(object) != "object") {
				throw new TypeError("'object' must be an object, not " + object);
			}
			if (typeof(object.read) != "function") throw new Error("Not resource: no read() function");
			/** @type { slime.Resource & { js: { name: string, code: string } } } */
			var resource = Object.assign(object, { js: void(0) });
			var type = (resource.type) ? mime.Type(resource.type.media, resource.type.subtype, resource.type.parameters) : mime.Type.parse("application/javascript");
			var string = (function() {
				if (resource.read) {
					var rv = resource.read(String);
					if (typeof(rv) == "undefined") throw new Error("resource.read(String) returned undefined");
					if (typeof(rv) == "string") return rv;
					throw new Error("Not string: " + typeof(rv) + " " + rv + " using " + resource.read);
				}
			})();
			if (typeof(string) != "string") {
				throw new TypeError("Resource: " + resource.name + " is not convertible to string, it is " + typeof(string) + ", so cannot be executed. resource.read = " + resource.read);
			}

			newrun({
				name: resource.name,
				type: type,
				string: string
			}, scope);
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["file"] }
		 */
		function file(code,$context) {
			var inner = createScriptScope($context);
			run.call(this,code,inner);
			return inner.$exports;
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["value"] }
		 */
		function value(code,scope) {
			var rv;
			if (!scope) scope = {};
			scope.$set = function(v) {
				rv = v;
			};
			run.call(this,code,scope);
			return rv;
		}

		$export({
			methods: {
				run: run,
				file: file,
				value: value
			},
			toExportScope: toExportScope,
			createScriptScope: createScriptScope
		});
	}
//@ts-ignore
)($slime,$platform,$engine,$api,mime,mimeTypeIs,$export);
