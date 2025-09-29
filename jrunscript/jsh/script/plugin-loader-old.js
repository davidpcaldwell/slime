//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.script.internal.loader_old.Context } $context
	 * @param { slime.loader.Export<slime.jsh.script.internal.loader_old.Exports> } $export
	 */
	function($api,$context,$export) {
		$export(
			function(plugin,jsh) {
				plugin({
					isReady: function() {
						return Boolean(jsh.web && jsh.file && jsh.script && jsh.http);
					},
					load: function() {
						/**
						 * @param { string } string
						 */
						var interpretModuleLocation = function(string) {
							/** @type { slime.web.Exports } */
							var web = jsh.web;

							//	we don't want to use the location if it is a relative path; it will be handled later by jsh.script.loader
							//	in the calling code
							var isAbsolute = function(path) {
								return jsh.file.filesystems.os.isAbsolutePath(path);
							}

							if (isAbsolute(string)) {
								var location = jsh.file.Pathname(string);
								if (location.directory) {
									return location.directory;
								} else if (location.file) {
									return location.file;
								}
							}

							//	then, let's check to see if it's a URL. For now we only support URLs with schemes.
							/** @type { slime.web.Url } */
							var url = web.Url.parse(string);
							if (url.scheme) {
								return url;
							}
						};

						/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.jrunscript.file.Directory } */
						var isDirectory = function(location) {
							return typeof(location["pathname"]) == "object" && location["directory"] === true;
						}

						/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.jrunscript.file.File } */
						var isFile = function(location) {
							return typeof(location["pathname"]) == "object" && location["directory"] === false;
						}

						/** @type { (location: ReturnType<interpretModuleLocation>) => location is slime.web.Url } */
						var isUrl = function(location) {
							return typeof(location["scheme"]) == "string";
						}

						jsh.loader.module = (function(was) {
							/** @type { (p: any) => p is slime.web.Url } */
							var isUrl = function(p) {
								return typeof(p) == "object" && p.scheme && p.host && p.path;
							}

							/**
							 *
							 * @param { slime.web.Url } location
							 * @returns
							 */
							var fromUrl = function(location) {
								var object = jsh.web.Url.parse(jsh.web.Url.codec.string.encode(location));
								var base = object.resolve("./");
								var path = (base.toString() == location.toString()) ? "module.js" : location.toString().substring(base.toString().length);
								var loader = new jsh.http.Client().Loader(base);
								return function(code) {
									code = path;
									return loader.module.apply(loader, arguments);
								}
							}

							return function(code) {
								if (isUrl(code)) {
									return fromUrl(code).apply(this, arguments);
								}
								if (typeof(code) == "string") {
									var location = interpretModuleLocation(code);
									if (location && isFile(location)) {
										code = location.pathname;
									} else if (location && isDirectory(location)) {
										code = location.pathname;
									} else if (location && isUrl(location)) {
										return fromUrl(location).apply(this, arguments);
									} else {
										return jsh.script.loader.module.apply(jsh.script.loader, arguments);
									}
								}
								return was.apply(this,arguments);
							}
						})(jsh.loader.module);

						var loadUrl = function(url) {
							var response = new jsh.http.Client().request({
								url: url
							});
							//	TODO	maybe better error handling?
							if (response.status.code != 200) return null;
							//	TODO	the strange remapping below is because of some inconsistency between jrunscript Resource types
							//			and HTTP client bodies. Need to do some low-level refactoring, possibly.
							return {
								type: response.body.type,
								stream: {
									binary: response.body.stream
								}
							}
						};

						["file","value","run"].forEach(function(operation) {
							jsh.loader[operation] = (function(was) {
								return function(code) {
									if (typeof(code) == "object" && code.scheme && code.host && code.path) {
										code = loadUrl(code);
									}
									if (typeof(code) == "string") {
										var location = interpretModuleLocation(code);
										if (location && isFile(location)) {
											code = location.pathname;
										} else if (location && isUrl(location)) {
											var response = loadUrl(location);
											if (response) code = response;
										} else if (location && isDirectory(location)) {
											throw new TypeError("Cannot " + operation + " code from directory " + location);
										} else {
											return jsh.script.loader[operation].apply(jsh.script.loader, arguments);
										}
									}
									return was.apply(this, arguments);
								}
							})(jsh.loader[operation]);
						})
					}
				})
			}
		)
	}
//@ts-ignore
)($api,$context,$export);
