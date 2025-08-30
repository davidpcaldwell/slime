//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.loader.Scope["Executor"] } Executor
	 * @param { slime.runtime.internal.loader.Scope["methods"] } methods
	 * @param { slime.runtime.internal.loader.Scope["createScriptScope"] } createScriptScope
	 * @param { slime.runtime.internal.loader.Scope["$api"] } $api
	 *
	 * @param { slime.old.loader.Export<slime.runtime.internal.loader.Exports> } $export
	 */
	function(Executor,methods,createScriptScope,$api,$export) {
		/**
		 * @type { slime.runtime.loader.Exports["Store"] }
		 */
		var Store = {
			content: function(p) {
				/**
				 *
				 * @param { string } path
				 */
				var getScript = function(path) {
					var elements = path.split("/");
					var script = p.store.get(elements);
					if (!script.present) throw new Error("Script " + path + " missing.");
					return {
						resource: script.value,
						code: $api.fp.now(
							script.value,
							$api.fp.now(
								p.compiler,
								$api.fp.Partial.impure.exception(
									function(it) { return new Error(); }
								)
							)
						),
						$loader: Store.content({
							store: $api.content.Store.path({
								store: p.store,
								path: elements.slice(0, elements.length-1)
							}),
							compiler: p.compiler,
							unsupported: p.unsupported,
							scope: p.scope
						})
					};
				};

				return {
					script: function(path) {
						var script = getScript(path);
						var executor = Executor({
							compiler: p.compiler,
							scope: p.scope,
							unsupported: p.unsupported
						})
						return function(context) {
							//	Need to use Object.assign rather than $api.Object.compose because createScriptScope creates
							//	an object where `$export` operates on that object.
							var scope = Object.assign(
								createScriptScope(context),
								{
									$loader: script.$loader
								}
							);
							var THIS = {};
							$api.Function.call(executor, THIS, script.resource, scope);
							return scope.$exports;
						}
					},
					run: function(path, scope, target) {
						var script = getScript(path);
						/** @type { slime.runtime.loader.Code } */
						var code = {
							name: path,
							type: function() {
								return $api.mime.Type("application", "javascript")
							},
							read: function() {
								return script.code.js;
							}
						}
						$api.Function.call(methods.run, target, code, scope);
					}
				}
			}
		}

		/**
		 * @type { slime.runtime.loader.Exports }
		 */
		var api = {
			Store: Store,
			synchronous: {
				scripts: function(loader) {
					var loadScript = function(loader,path) {
						var resource = loader.get(path.split("/"));

						if (resource.present) {
							var code = loader.code(resource.value);

							return function(context) {
								var rv;

								methods.run(
									code,
									{
										$context: context,
										$loader: void(0),
										$export: function(v) {
											rv = v;
										}
									}
								);

								return rv;
							}
						} else {
							return null;
						}
					};

					return function(path) {
						return loadScript(loader, path);
					}
				},
				resources: function(filter) {
					/**
					 *
					 * @param { slime.runtime.loader.Synchronous<any> } loader
					 * @param { Parameters<slime.runtime.loader.Exports["synchronous"]["resources"]>[0] } filter
					 * @param { string[] } path
					 * @returns
					 */
					var resources = function(loader, filter, path) {
						/** @type { { path: string[], name: string }[] } */
						var rv = [];
						var listing = loader.list(path);
						if (listing.present) {
							listing.value.forEach(function(item) {
								if (item.resource) {
									if (filter.resource(path, item.name)) {
										rv.push({ path: path, name: item.name });
									}
								}
								if (item.parent) {
									if (filter.parent(path.concat([item.name]))) {
										rv = rv.concat(resources(loader, filter, path.concat([item.name])));
									}
								}
							});
							return rv;
						}
						throw new Error("No listing for " + path);
					}

					return function(loader) {
						return resources(loader, filter, []);
					}
				}
			},
			object: {
				Synchronous: function(loader) {
					return {
						script: function(path) {
							return api.synchronous.scripts(loader)(path);
						}
					}
				}
			}
		};

		$export({
			api: api
		});
	}
//@ts-ignore
)(Executor,methods,createScriptScope,$api,$export);
