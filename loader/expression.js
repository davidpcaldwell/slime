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
			 * @param { slime.runtime.scope.Engine } $engine
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

		$engine.execute(
			scope.$slime.getRuntimeScript("polyfill.js"),
			{},
			null
		);

		var $platform = (
			/**
			 *
			 * @param { slime.runtime.Engine } $engine
			 */
			function($engine) {
				/** @type { slime.runtime.Platform } */
				var $exports = {};

				var global = (function() { return this; })();
				if (global && global.XML && global.XMLList) {
					$exports.e4x = {};
					$exports.e4x.XML = global.XML;
					$exports.e4x.XMLList = global.XMLList;
				}

				(
					/**
					 * @this { slime.runtime.Platform }
					 */
					function() {
						var getJavaClass = function(name) {
							try {
								if (typeof(scope.Packages) == "undefined") return null;
								var rv = scope.Packages[name];
								if (typeof(rv) == "function") {
									//	In the Firefox Java plugin, JavaPackage objects have typeof() == "function". They also have the
									//	following format for their String values
									try {
										var prefix = "[Java Package";
										if (String(rv).substring(0, prefix.length) == prefix) {
											return null;
										}
									} catch (e) {
										//	The string value of Packages.java.lang.Object and Packages.java.lang.Number throws a string (the
										//	below) if you attempt to evaluate it.
										if (e == "java.lang.NullPointerException") {
											return rv;
										}
									}
									return rv;
								}
								return null;
							} catch (e) {
								return null;
							}
						}

						if (getJavaClass("java.lang.Object")) {
							this.java = new function() {
								this.getClass = function(name) {
									return getJavaClass(name);
								}
							};
						}
					}
				).call($exports);

				try {
					if (typeof($engine) != "undefined") {
						if ($engine.MetaObject) {
							$exports.MetaObject = $engine.MetaObject;
						}
					}
				} catch (e) {
					//	MetaObject will not be defined
				}

				return $exports;
			}
		)($engine);

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
		 * @returns { slime.old.loader.Script<any,any> }
		 */
		var script = function(path) {
			/**
			 *
			 * @param { string } path
			 * @param { { [x: string]: any } } variables
			 * @returns
			 */
			var load = function(path,variables) {
				return execute(scope.$slime.getRuntimeScript(path), variables);
			};

			return Object.assign(
				function(scope) {
					return load(path, scope || {});
				},
				{
					thread: function(context) {
						//	TODO
						throw new Error();
					}
				}
			)
		};

		/** @type { slime.$api.Global } */
		var $api = script("$api.js")({
			$engine: $engine,
			$slime: {
				getRuntimeScript: scope.$slime.getRuntimeScript
			}
		});

		var code = {
			/** @type { slime.runtime.internal.content.Script } */
			content: script("content.js"),
			/** @type { slime.runtime.internal.scripts.Script } */
			scripts: script("scripts.js"),
			/** @type { slime.runtime.internal.loader.Script } */
			Loader: script("Loader.js"),
			/** @type { slime.runtime.internal.old_loaders.Script } */
			oldLoaders: script("old-loaders.js")
		};

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
							return $platform.e4x.XML( e4xRead.call(this) );
						} else if ($platform.e4x && v == $platform.e4x.XMLList) {
							return $platform.e4x.XMLList( e4xRead.call(this) );
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

		$api.engine = {
			execute: $engine.execute
		};

		$api.content = code.content();

		var scripts = code.scripts(
			{
				$api: $api,
				$platform: $platform,
				$engine: $engine
			}
		);

		var Loader = code.Loader({
			methods: scripts.methods,
			$api: $api,
			createScriptScope: scripts.createScriptScope
		});

		var loaders = code.oldLoaders({
			$api: $api,
			Resource: ResourceExport,
			createScriptScope: scripts.createScriptScope,
			toExportScope: scripts.toExportScope,
			methods: scripts.methods
		});

		/** @type { slime.runtime.Exports } */
		var rv = $api.fp.now(
			{
				mime: $api.mime,
				/** @type { slime.runtime.Exports["run"] } */
				run: function(code,scope,target) {
					return scripts.methods.run.call(target,loaders.Code.from.Resource(code),scope);
				},
				/** @type { slime.runtime.Exports["file"] } */
				file: function(code,context,target) {
					return scripts.methods.old.file.call(target,loaders.Code.from.Resource(code),context);
				},
				/** @type { slime.runtime.Exports["value"] } */
				value: function(code,scope,target) {
					return scripts.methods.old.value.call(target,loaders.Code.from.Resource(code),scope);
				},
				Resource: ResourceExport,
				old: {
					Loader: Object.assign(loaders.constructor, loaders.api, { constructor: null }),
					loader: loaders.api
				},
				compiler: {
					update: scripts.compiler.update,
					get: scripts.compiler.get
				},
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
			$api.Object.defineProperty({
				name: "engine",
				descriptor: {
					value: $engine,
					enumerable: true
				}
			}),
			//	TODO	currently only used by jsapi in loader/api/old/jsh via jsh.js
			//	TODO	also used by client.html unit tests
			$api.Object.defineProperty({
				name: "$platform",
				descriptor: {
					value: $platform,
					enumerable: true
				}
			}),
			$api.Object.maybeDefineProperty({
				name: "java",
				descriptor: $api.fp.Partial.from.loose(function(it) {
					return {
						value: ($platform.java) ? $platform.java : void(0)
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
