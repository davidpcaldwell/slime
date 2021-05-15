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
	 * @param { any } $context
	 * @param { slime.Loader } $loader
	 * @param { any } $exports
	 */
	function($api,$context,$loader,$exports) {
		if (!$context.api || !$context.api.js) {
			throw new Error("Required: $context.api.js");

			// //	Statement creation optimized to stream results for MySQL Connector/J driver; currently there is no
			// //	easy way for an individual driver to customize this object
			// //	TODO	but there should be an easier way and so this should be refactored
			// if (false) {
			// 	statement = peer.createStatement();
			// } else {
			// 	statement = peer.createStatement(Packages.java.sql.ResultSet.TYPE_FORWARD_ONLY, Packages.java.sql.ResultSet.CONCUR_READ_ONLY);
			// 	statement.setFetchSize(Packages.java.lang.Integer.MIN_VALUE);
			// }

		}

		var core = $loader.file("core.js");

		var drivers = $loader.file("drivers.js", {
			api: $context.api.js.Object.set({}, $context.api, { core: core })
		});

		var api = $loader.file("api.js", {
			api: $context.api
		});

		var getJavaClass = $context.api.java.getClass;

		$api.debug.disableBreakOnExceptionsFor(function() {
			if (getJavaClass("org.apache.derby.jdbc.EmbeddedDriver")) {
				$exports.derby = $loader.module("derby/module.js",drivers);
			}

			if (getJavaClass("org.postgresql.ds.PGSimpleDataSource")) {
				$exports.postgresql = $loader.module("postgresql/module.js", {
					api: $context.api,
					base: function(configuration) {
						var api = Object.assign({}, $context.api, { core: core });
						return $loader.file("drivers.js", Object.assign({}, { api: api }, configuration));
					},
				});
			};

			var code = {
				/** @type { slime.jrunscript.db.mysql.Factory } */
				mysql: $loader.factory("mysql/module.js")
			}

			$exports.mysql = code.mysql({
				jdbc: (getJavaClass("com.mysql.jdbc.Driver")) ? drivers : void(0),
				library: {
					java: $context.api.java,
					shell: $context.api.shell
				}
			});
		})();
	}
//@ts-ignore
)($api,$context,$loader,$exports);
