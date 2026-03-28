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
		 * @returns { slime.runtime.loader.Module<C, E> }
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

		/** @type {{ Loader: slime.runtime.internal.loader.Script, oldLoaders: slime.runtime.internal.old_loaders.Script }} */
		var code = {
			Loader: script("Loader.js"),
			oldLoaders: script("old-loaders.js")
		};

		var Loader = code.Loader({
			Executor: api.code.internal.Executor,
			methods: api.code.runtime.internal.methods,
			$api: $api,
			createScriptScope: api.code.internal.createScriptScope
		});

		/**
		 * @param { slime.resource.Descriptor } o
		 * @this { slime.Resource }
		 */
		function Resource(o) {
			this.type = (function(type,name) {
				if (typeof(type) == "string") return $api.mime.Type.parse(type);
				if (type && type.media && type.subtype) return type;
				if (!type && name) {
					var fromName = $api.mime.Type.fromName(name);
					if (fromName) return fromName;
				}
				if (!type) return null;
				throw new TypeError("Resource 'type' property must be a MIME type or string.");
			})(o.type,o.name);

			this.name = (o.name) ? o.name : void(0);

			if (o.read && o.read.string) {
				this.read = Object.assign(
					function(v) {
						var $platform = api.code.platform;

						if (v === String) {
							var rv = o.read.string();
							return rv;
						}
						if (v === JSON) return JSON.parse(this.read(String));

						var e4xRead = function() {
							var string = this.read(String);
							string = string.replace(/\<\?xml.*\?\>/, "");
							string = string.replace(/\<\!DOCTYPE.*?\>/, "");
							return string;
						};

						if ($platform.e4x && v == $platform.e4x.XML) {
							return new $platform.e4x.XML( e4xRead.call(this) );
						} else if ($platform.e4x && v == $platform.e4x.XMLList) {
							return new $platform.e4x.XMLList( e4xRead.call(this) );
						}
					},
					{
						string: function() {
							return o.read.string();
						}
					}
				)
			}
		}

		var ResourceExport = Object.assign(
			Resource,
			{
				/** @type { slime.runtime.resource.Exports["ReadInterface"]} */
				ReadInterface: {
					string: function(content) {
						return {
							string: function() {
								return content;
							}
						}
					}
				}
			}
		);

		var oldLoaders = code.oldLoaders({
			$api: $api,
			Resource: ResourceExport,
			createScriptScope: api.code.internal.createScriptScope,
			toExportScope: api.code.internal.old.toExportScope,
			methods: api.code.runtime.internal.methods
		});

		/** @type { slime.runtime.Exports } */
		var rv = $api.fp.now(
			{
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
				Resource: ResourceExport,
				old: {
					Loader: Object.assign(oldLoaders.constructor, oldLoaders.api, { constructor: null }),
					loader: oldLoaders.api
				},
				compiler: api.code.runtime.compiler,
				loader: Loader.api,
				namespace: function(string) {
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
				}
			},
			//	TODO	currently only used by jsapi in loader/api/old/jsh via jsh.js
			//	TODO	also used by client.html unit tests
			$api.Object.defineProperty({
				name: "$platform",
				descriptor: {
					value: api.code.platform,
					enumerable: true
				}
			}),
			$api.Object.maybeDefineProperty({
				name: "java",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					return {
						value: (api.code.platform.java) ? api.code.platform.java : void(0)
					};
				})
			}),
			function(it) {
				return $api.Object.compose(
					it,
					//	TODO	currently used to set deprecation warning in jsh.js
					//	TODO	currently used by jsapi in loader/api/old/jsh via jsh.js
					//	TODO	also used by client.html unit tests
					//	used to allow embeddings to set warnings for deprecate and experimental
					{ $api: $api }
				)
			}
		);
		return rv;
	}
//@ts-ignore
)(scope)
