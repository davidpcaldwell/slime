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
	 * @param { slime.loader.Export<slime.runtime.internal.scripts.Exports> } $export
	 */
	function($slime,$platform,$engine,$api,$export) {
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
		 * @param { string } string
		 */
		function mimeTypeIs(string) {
			/**
			 *
			 * @param { slime.mime.Type } type
			 */
			function rv(type) {
				return (type.media + "/" + type.subtype) == string;
			}
			return rv;
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["run"] }
		 */
		function run(script,scope) {
			var name = script.name;
			var type = script.type();
			var string = script.read();

			var typeIs = (
				function(scriptType) {
					/** @type { (string: string) => boolean } */
					return function(type) {
						return scriptType && mimeTypeIs(type)(scriptType);
					}
				}
			)(type);

			var js;
			if ($slime.typescript && typeIs("application/x.typescript")) {
				js = {
					name: name,
					code: $slime.typescript.compile(string)
				};
			} else if (typeIs("application/vnd.coffeescript")) {
				js = {
					name: name,
					code: $coffee.compile(string)
				};
			} else if (typeIs("application/javascript") || typeIs("application/x-javascript")) {
				js = {
					name: name,
					code: string
				}
			}
			if (!js) {
				throw new TypeError("Resource " + name + " is not JavaScript; type = " + type);
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

		/** @type { slime.$api.fp.Mapping<slime.Resource,slime.runtime.loader.Code> } */
		var adaptResource = function(object) {
			/** @type { slime.Resource & { js: { name: string, code: string } } } */
			var resource = Object.assign(object, { js: void(0) });
			var type = (resource.type) ? resource.type : $api.mime.Type.codec.declaration.decode("application/javascript");
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
			return {
				name: resource.name,
				type: function() { return type; },
				read: function() { return string; }
			}
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["old"]["run"] }
		 */
		function old_run(object,scope) {
			if (!object || typeof(object) != "object") {
				throw new TypeError("'object' must be an object, not " + object);
			}
			if (typeof(object.read) != "function") throw new Error("Not resource: no read() function");

			run.call(
				this,
				adaptResource(object),
				scope
			);
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["old"]["file"] }
		 */
		function file(code,$context) {
			var inner = createScriptScope($context);
			run.call(this,adaptResource(code),inner);
			return inner.$exports;
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["old"]["value"] }
		 */
		function value(code,scope) {
			var rv;
			if (!scope) scope = {};
			scope.$set = function(v) {
				rv = v;
			};
			run.call(this,adaptResource(code),scope);
			return rv;
		}

		$export({
			Code: {
				from: {
					Resource: adaptResource
				}
			},
			methods: {
				old: {
					run: old_run,
					file: file,
					value: value
				},
				run: run
			},
			toExportScope: toExportScope,
			createScriptScope: createScriptScope
		});
	}
//@ts-ignore
)($slime,$platform,$engine,$api,$export);
