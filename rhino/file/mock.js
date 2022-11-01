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
		 *
		 * @returns { slime.jrunscript.file.world.spi.Filesystem }
		 */
		var Mock = function(p) {
			var SLASH = (p && p.separators && p.separators.pathname) ? p.separators.pathname : "/";
			var COLON = (p && p.separators && p.separators.searchpath) ? p.separators.searchpath : ":";

			/** @type { { [path: string]: slime.jrunscript.Array<number> } } */
			var state = {
			}

			/** @type { slime.jrunscript.file.world.spi.Filesystem["openInputStream"] } */
			var openInputStream = function(p) {
				return function(events) {
					if (!state[p.pathname]) events.fire("notFound");
					if (!state[p.pathname]) return $api.fp.Maybe.nothing();
					return $api.fp.Maybe.value(
						$context.library.io.InputStream.from.java(
							new Packages.java.io.ByteArrayInputStream(
								state[p.pathname]
							)
						)
					);
				}
			};

			/** @type { slime.jrunscript.file.world.spi.Filesystem["openOutputStream"] } */
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
							state[p.pathname] = buffer.readBinary().java.array();
						},
						java: out.java,
						split: out.split
					};
					return $api.fp.Maybe.value(wrap);
				}
			};

			/** @type { slime.jrunscript.file.world.spi.Filesystem["fileExists"] } */
			var fileExists = function(p) {
				return function(events) {
					return $api.fp.Maybe.value(Boolean(state[p.pathname]));
				}
			}

			return {
				separator: {
					pathname: SLASH,
					searchpath: COLON
				},
				copy: void(0),
				createDirectory: void(0),
				directoryExists: void(0),
				fileExists: fileExists,
				move: void(0),
				fileLength: void(0),
				fileLastModified: void(0),
				listDirectory: void(0),
				openInputStream: openInputStream,
				openOutputStream: openOutputStream,
				temporary: void(0),
				relative: function(base, relative) {
					return base + SLASH + relative;
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
