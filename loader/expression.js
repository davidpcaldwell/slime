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
		var $slime = scope.$slime;
		var Packages = scope.Packages;

		/**
		 * A local wrapper for the scope-provided `$engine` value which fills in intermediate chaining properties and provides a
		 * default script executor that uses `eval` which is lazily-loaded in a way that is legal when loading it in strict mode.
		 */
		var engine = (
			/**
			 *
			 * @param { slime.runtime.$engine } $engine
			 * @returns { slime.runtime.internal.Engine }
			 */
			function($engine) {
				return {
					Error: {
						decorate: ($engine && $engine.Error) ? $engine.Error.decorate : void(0)
					},
					//@ts-ignore
					execute: (function() {
						if ($engine && $engine.execute) return $engine.execute;
						//	This is the function we want, but Node.js objects to the with() statement, even if we don't execute it
						//	(because we replace it with the compliant Node.js version), in strict mode. So we need to fall back to a
						//	dynamically created version, which follows the comment block.
						//
						// return (
						// 	function(/*script{name,js},scope,target*/) {
						// 		return (function() {
						// 			//@ts-ignore
						// 			with( arguments[1] ) {
						// 				return eval(arguments[0]);
						// 			}
						// 		}).call(
						// 			arguments[2],
						// 			arguments[0].js, arguments[1]
						// 		);
						// 	}
						// );
						//
						//	TODO	could we simply replace this version with the Node.js version everywhere?
						return new Function(
							"script",
							"scope",
							"target",
							[
								"return(",
								"function $engine_execute(/*script{name,js},scope,target*/) {",
								"\treturn (function() {",
								"\t\twith( arguments[1] ) {",
								"\t\t\treturn eval(arguments[0]);",
								"\t\t}",
								"\t}).call(",
								"\t\targuments[2],",
								"\t\targuments[0].js, arguments[1]",
								"\t);",
								"}",
								").apply(null,arguments)"
							].join("\n")
						)
					})(),
					MetaObject: ($engine && $engine.MetaObject) ? $engine.MetaObject : void(0)
				}
			}
		)(scope.$engine);

		var $platform = (
			/**
			 *
			 * @param { slime.runtime.internal.Engine } $engine
			 */
			function($engine) {
				/** @type { slime.runtime.$platform } */
				var $exports = {};
				$exports.Object = {};
				if (Object.defineProperty) {
					$exports.Object.defineProperty = { ecma: true };
				}
				if (Object.prototype.__defineGetter__) {
					if (!$exports.Object.defineProperty) $exports.Object.defineProperty = {};
					$exports.Object.defineProperty.accessor = true;
				}

				var global = (function() { return this; })();
				if (global && global.XML && global.XMLList) {
					$exports.e4x = {};
					$exports.e4x.XML = global.XML;
					$exports.e4x.XMLList = global.XMLList;
				}

				(
					/**
					 * @this { slime.runtime.$platform }
					 */
					function() {
						var getJavaClass = function(name) {
							try {
								if (typeof(Packages) == "undefined") return null;
								var rv = Packages[name];
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
		)(engine);

		engine.execute(
			$slime.getRuntimeScript("polyfill.js"),
			{},
			null
		);

		/**
		 *
		 * @param { { name: string, js: string } } code
		 * @param { { [x: string]: any } } scope
		 * @returns
		 */
		var execute = function(code,scope) {
			/** @type { any } */
			var exported;

			engine.execute(
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
		 * @param { { [x: string]: any } } scope
		 * @returns
		 */
		var load = function(path,scope) {
			return execute($slime.getRuntimeScript(path), scope);
		};

		/**
		 *
		 * @param { string } path
		 * @returns { slime.old.loader.Script<any,any> }
		 */
		var script = function(path) {
			return Object.assign(
				function(scope) {
					return load(path, scope);
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
		var $api = load(
			"$api.js",
			{
				$engine: engine,
				$slime: {
					getRuntimeScript: function(path) {
						return $slime.getRuntimeScript(path);
					}
				}
			}
		);

		var code = {
			/** @type { slime.runtime.internal.scripts.Script } */
			scripts: script("scripts.js"),
			/** @type { slime.runtime.internal.loader.Script } */
			Loader: script("Loader.js"),
			/** @type { slime.runtime.internal.old_loaders.Script } */
			loaders: script("old-loaders.js")
		};

		var mime = $api.mime;

		/**
		 * @param { slime.resource.Descriptor } o
		 * @this { slime.Resource }
		 */
		function Resource(o) {
			this.type = (function(type,name) {
				if (typeof(type) == "string") return mime.Type.parse(type);
				if (type && type.media && type.subtype) return type;
				if (!type && name) {
					var fromName = mime.Type.fromName(name);
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
		)

		var scripts = code.scripts(
			{
				$api: $api,
				$platform: $platform,
				$engine: engine
			}
		);

		$api.compiler = scripts.compiler.library;

		var Loader = code.Loader({
			methods: scripts.methods,
			$api: $api
		});

		var loaders = code.loaders({
			$api: $api,
			Resource: ResourceExport,
			createScriptScope: scripts.createScriptScope,
			toExportScope: scripts.toExportScope,
			methods: scripts.methods
		});

		/** @type { slime.runtime.Exports } */
		var rv = $api.Object.compose(
			{
				mime: {
					Type: mime.Type
				},
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
					//	TODO	the static type definition for this lacks the properties added by `loaders` -- are they necessary?
					Loader: Object.assign(loaders.constructor, loaders, { constructor: null }),
					loader: loaders.api
				},
				compiler: {
					update: scripts.compiler.update
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
				},
				//	TODO	currently only used by jsapi in jsh/unit via jsh.js, so undocumented
				//	TODO	also used by client.html unit tests
				$platform: $platform,
			},
			($platform.java) ? { java: $platform.java } : {},
			{
				//	TODO	currently used to set deprecation warning in jsh.js
				//	TODO	currently used by jsapi in jsh/unit via jsh.js
				//	TODO	also used by client.html unit tests
				//	used to allow implementations to set warnings for deprecate and experimental
				$api: $api
			},
			{
				//	Set by jrunscript expression.js
				//	TODO	May not be necessary; see inline comment in runtime expression.fifty.ts
				typescript: void(0)
			}
		);
		return rv;
	}
//@ts-ignore
)(scope)
