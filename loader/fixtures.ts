//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.test {
	export namespace mock {
		export interface Content<T> {
			set: (path: string, content: T) => void

			store: runtime.content.Store<T>
			index: runtime.content.Index<T>
		}
	}

	export interface Exports {
		subject: (fifty: slime.fifty.test.Kit, fixture?: slime.$api.fp.Transform<slime.runtime.Scope>) => slime.runtime.Exports

		mock: {
			content: <T>() => mock.Content<T>
		}
	}

	export type Script = slime.loader.Script<void,Exports>;

	(
		function($api: slime.$api.Global, $export: slime.loader.Export<Exports>) {
			$export({
				subject: function(fifty: slime.fifty.test.Kit, fixture?: slime.$api.fp.Transform<slime.runtime.Scope>) {
					if (!fixture) fixture = fifty.global.$api.fp.identity;
					var code = fifty.$loader.get("expression.js");
					var js = code.read(String);

					var subject: slime.runtime.Exports = (function() {
						var scope: slime.runtime.Scope = fixture({
							$slime: {
								getRuntimeScript: function(path) {
									var resource = fifty.$loader.get(path);
									return { name: resource.name, js: resource.read(String) }
								}
							}
						});
						return eval(js);
					})();

					return subject;
				},
				mock: {
					content: function() {
						var content = {};

						var get = function(path) {
							var rv = content[path.join("/")];
							return (typeof(rv) == "undefined") ? $api.fp.Maybe.from.nothing() : $api.fp.Maybe.from.some(rv);
						};

						var Index = function<T>(location: string): runtime.content.Index<T> {
							return {
								get: get,
								list: function(path) {
									var keys = Object.keys(content);
									var prefix = location + ((path.length) ? path.join("/") + "/" : "");
									var listing = keys
										.filter(function(key) { return key.substring(0,prefix.length) == prefix })
										.map(function(key) { return key.substring(prefix.length); })
									;
									if (listing.length == 0) return $api.fp.Maybe.from.nothing();
									var rv: { [name: string]: runtime.content.Entry<T> } = listing.reduce(function(rv,key) {
										var elements = key.split("/");
										if (elements.length > 1) {
											rv[elements[0]] = { name: elements[0], index: Index(prefix + elements[0] + "/") };
										} else {
											rv[elements[0]] = { name: elements[0], value: content[prefix + "/" + elements[0]] };
										}
										return rv;
									},{});
									return $api.fp.Maybe.from.some(
										Object.entries(rv).map(function(entry) { return entry[1]; })
									);
								}
							}
						}

						return {
							set: function(path, value) {
								content[path] = value;
							},
							store: {
								get: get
							},
							index: Index("")
						}
					}
				}
			});
		}
	//@ts-ignore
	)($api, $export);
}
