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

		//	resource.type: optional, but if it is not a recognized type, this method will error
		//	resource.name: optional, but used to determine default type if type is absent, and used for resource.js.name
		//	resource.string: optional, but used to determine code
		//	resource.js { name, code }: forcibly set based on other properties
		//	TODO	re-work resource.js

		/**
		 *
		 * @type { slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.mime.Type>> }
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
		 *
		 * @param { { accept: slime.$api.fp.Predicate<slime.runtime.loader.Code>, compile: slime.$api.fp.Mapping<string,string> }} p
		 * @returns { slime.runtime.internal.engine.Transpiler }
		 */
		var getTranspiler = function(p) {
			if (p.compile) {
				return function(script) {
					if (p.accept(script)) {
						return $api.fp.Maybe.from.some({
							name: script.name,
							js: p.compile(script.read())
						});
					} else {
						return $api.fp.Maybe.from.nothing();
					}
				}
			} else {
				return function(script) {
					return $api.fp.Maybe.from.nothing();
				}
			}
		};

		/** @type { slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.runtime.loader.Code>> } */
		var isMimeType = function(string) {
			return function(script) {
				return mimeTypeIs(string)(script.type());
			}
		}

		/**
		 *
		 * @param { slime.runtime.$slime.Deployment } $slime
		 * @returns { slime.runtime.internal.engine.Transpiler }
		 */
		var getTypescriptTranspiler = function($slime) {
			return getTranspiler({
				accept: isMimeType("application/x.typescript"),
				compile: ($slime.typescript) ? function(code) { return $slime.typescript.compile(code); } : void(0)
			});
		};

		/**
		 *
		 * @param { slime.runtime.$slime.Deployment } $slime
		 * @returns { slime.runtime.internal.engine.Transpiler }
		 */
		var getCoffescriptTranspiler = function($slime) {
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

			return getTranspiler({
				accept: isMimeType("application/vnd.coffeescript"),
				compile: ($coffee) ? $coffee.compile : void(0)
			});
		}

		/**
		 *
		 * @returns { slime.runtime.internal.engine.Transpiler }
		 */
		var getJavascriptProvider = function() {
			return getTranspiler({
				accept: $api.fp.Predicate.or(
					isMimeType("application/javascript"),
					isMimeType("application/x-javascript")
				),
				compile: $api.fp.identity
			});
		};

		var getEngineCode = (
			function() {
				var typescript = getTypescriptTranspiler($slime);
				var coffeescript = getCoffescriptTranspiler($slime);
				var javascript = getJavascriptProvider();

				return $api.fp.switch([ typescript, coffeescript, javascript ]);
			}
		)();

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["run"] }
		 */
		function run(script,scope) {
			if (!script || typeof(script) != "object") {
				throw new TypeError("'object' must be an object, not " + script);
			}
			if (typeof(script.read) != "function") throw new Error("Not resource: no read() function");

			var code = getEngineCode(script);

			if (!code.present) {
				throw new TypeError("Resource " + script.name + " cannot be converted to JavaScript; type = " + script.type());
			}

			var target = this;

			//	TODO	why is this present? I guess so we can't accidentally load scripts into the global scope, even if we say
			//			we want to do that?
			var global = (function() { return this; })();
			if (scope === global) {
				scope = {};
			}

			if (scope === void(0)) {
				scope = {};
			}

			scope.$platform = $platform;
			scope.$api = $api;

			$engine.execute(
				code.value,
				scope,
				target
			);
		}

		/**
		 * @type { slime.runtime.internal.scripts.Exports["methods"]["old"]["file"] }
		 */
		function file(code,$context) {
			var inner = createScriptScope($context);
			run.call(this,code,inner);
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
			run.call(this,code,scope);
			return rv;
		}

		$export({
			methods: {
				old: {
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
