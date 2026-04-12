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
			 * @returns { slime.runtime.Engine }
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
			 * @param { { [x: string]: any } } scope
			 * @returns
			 */
			var execute = function(code,scope) {
				/** @type { any } */
				var exported;

				$engine.execute(
					code,
					Object.assign(scope, {
						$export: function(value) {
							exported = value;
						}
					}),
					null
				);

				return exported;
			}

			/**
			 *
			 * @param { string } path
			 * @param { { [x: string]: any } } variables
			 * @returns
			 */
			var load = function(path,variables) {
				return execute(scope.$slime.getRuntimeScript(path), variables);
			};

			return function(scope) {
				return load(path, scope || {});
			};
		};

		var api = (
			function() {
				/** @type { slime.$api.internal.Script } */
				var code = script("$api.js");

				return code({
					$engine: $engine,
					$slime: {
						getRuntimeScript: scope.$slime.getRuntimeScript
					},
					Packages: scope.Packages
				});
			}
		)();

		var $api = api.exports;

		var oldCodeInterfaces = (
			function() {
				/** @type { slime.runtime.internal.old_loaders.Script } */
				var code = script("old-loaders.js");

				var oldLoaders = code({
					$api: $api,
					createScriptScope: api.code.internal.createScriptScope,
					toExportScope: api.code.internal.old.toExportScope,
					methods: api.code.runtime.internal.methods
				});

				return {
					/** @type { slime.runtime.Exports["run"] } */
					run: function(code,scope,target) {
						return api.code.runtime.internal.methods.run.call(target,oldLoaders.Code.from.Resource(code),scope);
					},
					/** @type { slime.runtime.Exports["file"] } */
					file: function(code,context,target) {
						return api.code.runtime.internal.methods.old.file.call(target,oldLoaders.Code.from.Resource(code),context);
					},
					/** @type { slime.runtime.Exports["value"] } */
					value: function(code,scope,target) {
						return api.code.runtime.internal.methods.old.value.call(target,oldLoaders.Code.from.Resource(code),scope);
					},
					Resource: oldLoaders.Resource,
					old: {
						Loader: Object.assign(oldLoaders.constructor, oldLoaders.api, { constructor: null }),
						loader: oldLoaders.api
					}
				}
			}
		)();

		/** @type { slime.runtime.Exports } */
		var rv = $api.fp.now(
			{},
			$api.Object.defineProperty({
				//	The $api object will be provided to all code loaded by $api, but we provide it to embedders so that it can be
				//	used to decorate the runtime in the embedding.

				//	used to allow embeddings to set warnings for deprecate and experimental
				//	TODO	currently used to set deprecation warning in jsh.js
				//	TODO	currently used by jsapi in loader/api/old/jsh via jsh.js
				//	TODO	also used by client.html unit tests
				name: "$api",
				descriptor: {
					value: $api,
					enumerable: true
				}
			}),
			$api.fp.Object.with(oldCodeInterfaces),
			$api.Object.defineProperty({
				name: "namespace",
				descriptor: {
					value: function(string) {
						//	This construct returns the top-level global object, e.g., window in the browser
						var global = function() {
							return this;
						}();

						var scope = global;
						if (string) {
							var tokens = string.split(".");
							for (var i=0; i<tokens.length; i++) {
								if (typeof(scope[tokens[i]]) == "undefined") {
									scope[tokens[i]] = {};
								}
								scope = scope[tokens[i]];
							}
						}
						return scope;
					},
					enumerable: true
				}
			}),
			$api.Object.defineProperty({
				name: "compiler",
				descriptor: {
					value: api.code.runtime.compiler,
					enumerable: true
				}
			}),
			//	TODO	currently only used by jsapi in loader/api/old/jsh via jsh.js
			//	TODO	also used by client.html unit tests
			$api.Object.defineProperty({
				name: "$platform",
				descriptor: {
					value: $api.platform,
					enumerable: true
				}
			}),
			$api.Object.maybeDefineProperty({
				name: "java",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					return {
						value: ($api.platform.java) ? $api.platform.java : void(0)
					};
				})
			})
		);
		return rv;
	}
//@ts-ignore
)(scope)
