//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.file.internal.mock.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.mock.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		/**
		 * @type { slime.jrunscript.file.Exports["mock"]["filesystem"] }
		 *
		 * @returns { slime.jrunscript.file.world.Filesystem }
		 */
		var Mock = function(p) {
			var SLASH = (p && p.separator && p.separator.pathname) ? p.separator.pathname : "/";
			var COLON = (p && p.separator && p.separator.searchpath) ? p.separator.searchpath : ":";

			/** @typedef { { type: "file", data: slime.jrunscript.Array<number> } } File */
			/** @typedef { { type: "directory" } } Directory */
			/** @typedef { File | Directory } Node */

			/** @type { { [path: string]: Node } } } */
			var state = {
			}

			/** @type { (node: Node) => node is File } */
			var isFile = function(node) {
				return node.type == "file";
			}

			/** @type { slime.jrunscript.file.world.Filesystem["openInputStream"] } */
			var openInputStream = function(p) {
				return function(events) {
					var at = state[p.pathname];
					if (!at) {
						events.fire("notFound");
						return $api.fp.Maybe.from.nothing();
					}
					if (!isFile(at)) throw new Error("TODO");
					return $api.fp.Maybe.from.some(
						$context.library.io.InputStream.from.java(
							new Packages.java.io.ByteArrayInputStream(
								at.data
							)
						)
					);
				}
			};

			/** @type { slime.jrunscript.file.world.Filesystem["openOutputStream"] } */
			var openOutputStream = function(p) {
				return function(events) {
					//	TODO	append
					if (p.append) throw new Error("Unimplemented");
					var buffer = new $context.library.io.Buffer();
					var out = buffer.writeBinary();
					/** @type { slime.jrunscript.runtime.io.OutputStream } */
					var wrap = {
						character: out.character,
						close: function() {
							out.close();
							state[SLASH + p.pathname] = {
								type: "file",
								data: buffer.readBinary().java.array()
							};
						},
						java: out.java,
						split: out.split
					};
					return $api.fp.Maybe.from.some(wrap);
				}
			};

			/** @type { slime.jrunscript.file.world.Filesystem["fileExists"] } */
			var fileExists = function(p) {
				return function(events) {
					var at = state[p.pathname];
					return $api.fp.Maybe.from.some(Boolean(at && at.type == "file"));
				}
			};

			/** @type { slime.jrunscript.file.world.Filesystem["directoryExists"] } */
			var directoryExists = function(p) {
				return function(events) {
					var at = state[p.pathname];
					return $api.fp.Maybe.from.some(Boolean(at && at.type == "directory"));
				}
			};

			return {
				separator: {
					pathname: SLASH,
					searchpath: COLON
				},
				canonicalize: function(p) {
					return function(events) {
						return $api.fp.Maybe.from.some(p.pathname);
					}
				},
				copy: void(0),
				createDirectory: void(0),
				directoryExists: directoryExists,
				fileExists: fileExists,
				move: void(0),
				remove: function(p) {
					return function(events) {
						//	TODO	what should happen if it doesn't exist?
						//	TODO	what should happen if it's a directory?
						var at = state[p.pathname];
						if (at) {
							delete state[p.pathname];
						}
					}
				},
				fileSize: void(0),
				fileLastModified: void(0),
				listDirectory: function(p) {
					return function(events) {
						debugger;
						var prefix = p.pathname + "/";
						return $api.fp.Maybe.from.some(
							Object.entries(state).filter(function(entry) {
								return entry[0].substring(0,prefix.length) == prefix;
							}).map(function(entry) {
								return entry[0].substring(prefix.length);
							})
						);
					}
				},
				openInputStream: openInputStream,
				openOutputStream: openOutputStream,
				temporary: function(p) {
					return function(events) {
						var getName = function(parent,prefix,index,suffix) {
							return parent + SLASH + prefix + index + suffix;
						};
						var tmp = p.parent || "tmp";
						var prefix = p.prefix || "slime";
						var suffix = p.suffix || ".tmp";
						var index = 0;
						var name = getName(tmp, prefix, index, suffix);
						while (state[name]) {
							name = getName(tmp, prefix, ++index, suffix);
						}
						if (p.directory) {
							state[name] = { type: "directory" };
						} else {
							state[name] = { type: "file", data: $context.library.java.Array.create({ type: Packages.java.lang.Byte, array: [] }) };
						}
						return name;
					}
				},
				Directory: void(0),
				File: void(0),
				Pathname: void(0),
				pathname: void(0)
			}
		};

		$export({
			filesystem: function(p) {
				return Mock(p);
			}
		})
	}
//@ts-ignore
)(Packages,$api,$context,$export);
