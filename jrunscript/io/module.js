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
	 * @param { slime.jrunscript.io.Exports } $exports
	 */
	function($api,$context,$loader,$exports) {
		$exports.Streams = $context.$slime.io.Streams;

		$exports.Buffer = $context.$slime.io.Buffer;

		$exports.Resource = $context.$slime.Resource;

		$exports.Loader = $context.$slime.Loader;

		$exports.java = {
			adapt: $api.deprecate($context.$slime.io.Streams.java.adapt)
		};

		$exports.mime = $loader.file("mime.js", {
			nojavamail: $context.nojavamail,
			$slime: {
				mime: $context.$slime.mime,
				Resource: $context.$slime.Resource
			},
			api: {
				java: $context.api.java,
				io: $exports
			}
		});

		$exports.archive = {
			zip: $loader.file("zip.js", {
				InputStream: $context.$slime.io.InputStream,
				Streams: $context.$slime.io.Streams
			})
		};

		$exports.grid = $loader.file("grid.js", {
			getClass: function(name) {
				return $context.api.java.getClass(name);
			},
			Streams: $context.$slime.io.Streams
		});
	}
//@ts-ignore
)($api, $context, $loader, $exports);
