//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.runtime.Scope } scope
	 * @returns { slime.runtime.Exports }
	 */
	function(scope) {
		/**
		 * A local wrapper for the scope-provided `$engine` value which fills in intermediate chaining properties and provides a
		 * default script executor.
		 */
		var $engine = (
			/**
			 *
			 * @param { slime.runtime.Scope["$engine"] } $engine
			 * @returns { slime.$api.Engine }
			 */
			function($engine) {
				return {
					debugger: ($engine && $engine.debugger) ? $engine.debugger : void(0),
					execute: ($engine && $engine.execute)
						? $engine.execute
						: function(script,scope,target) {
							var code = script.js;
							var scopeVariables = Object.keys(scope).map(function(key) {
								return {
									name: key,
									value: scope[key]
								};
							});
							var scopeNames = scopeVariables.map(function(variable) { return variable.name; });
							var scopeValues = scopeVariables.map(function(variable) { return variable.value; });
							Function.apply(
								null,
								scopeNames.concat([code])
							).apply(
								target,
								scopeValues
							);
						}
					,
					MetaObject: ($engine && $engine.MetaObject) ? $engine.MetaObject : void(0)
				}
			}
		)(scope.$engine);

		//	Polyfills selected ECMAScript globals used by the platform
		$engine.execute(
			scope.$slime.getRuntimeScript("polyfill.js"),
			{},
			null
		);

		/**
		 *
		 * @template { any } C
		 * @template { any } E
		 *
		 * @param { string } path
		 * @returns { slime.runtime.loader.Scoped<C, E> }
		 */
		var script = function(path) {
			/**
			 *
			 * @param { { name: string, js: string } } code
			 * @param { { [x: string]: any } } context
			 * @returns
			 */
			var execute = function(code,context) {
				/** @type { any } */
				var exports = {};

				$engine.execute(
					code,
					{
						$context: context,
						$exports: exports,
						$export: function(value) {
							exports = value;
						}
					},
					null
				);

				return exports;
			}

			/**
			 *
			 * @param { string } path
			 * @param { { [x: string]: any } } context
			 * @returns
			 */
			var load = function(path,context) {
				return execute(scope.$slime.getRuntimeScript(path), context);
			};

			return function(context) {
				return load(path, context || {});
			};
		};

		var $api = (
			function() {
				/** @type { slime.$api.internal.Script } */
				var code = script("$api.js");

				return code({
					engine: $engine,
					script: script,
					Packages: scope.Packages
				});
			}
		)();

		/** @type { slime.runtime.Exports } */
		var rv = $api;
		return rv;
	}
//@ts-ignore
)(scope)
