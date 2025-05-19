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
	 * @param { slime.jrunscript.io.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.io.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jrunscript.io.zip.Script } */
			zip: $loader.script("zip.js"),
			/** @type { slime.jrunscript.io.internal.grid.Script } */
			grid: $loader.script("grid.js"),
			/** @type { slime.jrunscript.io.mime.Script } */
			mime: $loader.script("mime.js")
		};

		/** @type { slime.jrunscript.io.mime.Context["api"]["io"] } */
		var mimeIoContext = {
			Buffer: $context.$slime.io.Buffer,
			Resource: Object.assign($context.$slime.Resource, { from: void(0) }),
			Streams: $context.$slime.io.Streams
		};

		var library = {
			zip: code.zip({
				InputStream: $context.$slime.io.InputStream.java,
				Streams: $context.$slime.io.Streams
			}),
			grid: code.grid({
				getClass: function(name) {
					return $context.api.java.getClass(name);
				},
				Streams: $context.$slime.io.Streams
			}),
			mime: code.mime({
				nojavamail: $context.nojavamail,
				$slime: {
					mime: $context.$slime.mime,
					Resource: $context.$slime.Resource
				},
				api: {
					java: $context.api.java,
					io: mimeIoContext
				}
			})
		}


		/** @type { slime.jrunscript.io.Exports["InputStream"] } */
		var InputStream = {
			string: function(stream) {
				return function() {
					return stream.character().asString();
				};
			},
			from: {
				string: function(value) {
					var buffer = new $context.$slime.io.Buffer();
					buffer.writeText().write(value);
					buffer.close();
					return buffer.readBinary();
				},
				java: function(native) {
					return $context.$slime.io.InputStream.java(native);
				}
			}
		};

		$export({
			Streams: $context.$slime.io.Streams,
			Buffer: $context.$slime.io.Buffer,
			Resource: Object.assign(
				$context.$slime.Resource,
				$context.$slime.jrunscript.Resource
			),
			Loader: $context.$slime.Loader,
			old: $context.$slime.old,
			InputStream: InputStream,
			java: {
				adapt: $context.$slime.io.Streams.java.adapt
			},
			mime: library.mime,
			archive: {
				zip: library.zip
			},
			grid: code.grid({
				getClass: function(name) {
					return $context.api.java.getClass(name);
				},
				Streams: $context.$slime.io.Streams
			}),
			system: $context.$slime.io.system,
			loader: $context.$slime.jrunscript.loader,
			Entry: $context.$slime.jrunscript.Entry
		});
	}
//@ts-ignore
)($api, $context, $loader, $export);
