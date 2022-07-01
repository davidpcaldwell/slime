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
		/** @type { slime.jrunscript.io.Exports["InputStream"] } */
		var InputStream = {
			string: function(stream) {
				return $api.Function.world.old.ask(function() {
					return stream.character().asString();
				});
			}
		}
		var $$exports = {
			Streams: $context.$slime.io.Streams,
			Buffer: $context.$slime.io.Buffer,
			Resource: $context.$slime.Resource,
			Loader: $context.$slime.Loader,
			InputStream: InputStream,
			java: {
				adapt: $context.$slime.io.Streams.java.adapt
			},
			mime: void(0),
			archive: {
				zip: $loader.file("zip.js", {
					InputStream: $context.$slime.io.InputStream,
					Streams: $context.$slime.io.Streams
				})
			},
			grid: $loader.file("grid.js", {
				getClass: function(name) {
					return $context.api.java.getClass(name);
				},
				Streams: $context.$slime.io.Streams
			}),
			system: $context.$slime.io.system
		};
		$$exports.mime = $loader.file("mime.js", {
			nojavamail: $context.nojavamail,
			$slime: {
				mime: $context.$slime.mime,
				Resource: $context.$slime.Resource
			},
			api: {
				java: $context.api.java,
				io: $$exports
			}
		});
		$export($$exports);
	}
//@ts-ignore
)($api, $context, $loader, $export);
