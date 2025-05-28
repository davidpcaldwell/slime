//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.jrunscript.Global } $api
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
			Buffer: $api.jrunscript.io.Buffer,
			Resource: Object.assign($context.$slime.Resource, { from: void(0) }),
			Streams: $api.jrunscript.io.Streams
		};

		var library = {
			zip: code.zip({
				InputStream: $api.jrunscript.io.InputStream.java,
				Streams: $api.jrunscript.io.Streams
			}),
			grid: code.grid({
				getClass: function(name) {
					return $context.api.java.getClass(name);
				},
				Streams: $api.jrunscript.io.Streams
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


		/** @type { slime.jrunscript.io.Exports["InputStream"]["old"] } */
		var InputStream = {
			string: function(stream) {
				return function() {
					return stream.content.string.simple($api.jrunscript.io.Charset.default);
				};
			},
			from: {
				java: $api.deprecate($api.jrunscript.io.InputStream.java)
			}
		};

		$export({
			InputStream: $api.Object.compose($api.jrunscript.io.InputStream, {
				old: InputStream
			}),
			Streams: $api.jrunscript.io.Streams,
			Buffer: $api.jrunscript.io.Buffer,
			Resource: Object.assign(
				$context.$slime.Resource,
				$context.$slime.jrunscript.Resource
			),
			Loader: $context.$slime.Loader,
			old: $context.$slime.old,
			java: {
				adapt: $api.jrunscript.io.Streams.java.adapt
			},
			mime: library.mime,
			archive: {
				zip: library.zip
			},
			grid: code.grid({
				getClass: function(name) {
					return $context.api.java.getClass(name);
				},
				Streams: $api.jrunscript.io.Streams
			}),
			system: $api.jrunscript.io.system,
			loader: $context.$slime.jrunscript.loader,
			Entry: $context.$slime.jrunscript.Entry
		});
	}
//@ts-ignore
)($api, $context, $loader, $export);
