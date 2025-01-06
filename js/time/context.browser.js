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
	 * @param { slime.loader.Export<slime.time.Context> } $export
	 */
	function($api,$export) {
		//	TODO	local time zone:
		//	Intl.DateTimeFormat().resolvedOptions().timeZone
		//
		//	Intl.supportedValuesOf('timeZone');

		//	TODO	should we build out API of Intl in TypeScript?

		/** @type { string[] } */
		var zoneIds = Intl["supportedValuesOf"]("timeZone");

		var zones = zoneIds.map(
			/**
			 *
			 * @param { string } zone
			 * @returns { { id: string, implementation: slime.time.Zone } }
			 */
			function(zone) {
				return {
					id: zone,
					implementation: {
						local: function(millis) {
							var date = new Date(millis);
							var formatted = date.toLocaleString("en-US", { timeZone: zone });
							var zoned = new Date(formatted);
							return {
								year: zoned.getFullYear(),
								month: zoned.getMonth() + 1,
								day: zoned.getDate(),
								hour: zoned.getHours(),
								minute: zoned.getMinutes(),
								second: zoned.getSeconds()
							};
						},
						unix: function(datetime) {
							var date = new Date(datetime.year, datetime.month-1, datetime.day, datetime.hour, datetime.minute, datetime.second);
							var rv = new Date(date.toLocaleString("en-US", { timeZone: zone }));
							return rv.getTime();
						}
					}
				}
			}
		).reduce(function(rv,it) {
			rv[it.id] = it.implementation;
			return rv;
		}, {});

		$export({
			zones: zones
		})
	}
//@ts-ignore
)($api,$export);
