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
							//	TODO	this is surprisingly messy, and probably still does not work for some cases near DST
							//			changes. Might need to post-process this result to ensure date is correct. But for now, we
							//			have a 99.9% case.
							var inLocalZone = new Date(datetime.year, datetime.month-1, datetime.day, datetime.hour, datetime.minute, datetime.second);
							var localOffset = inLocalZone.getTimezoneOffset();
							var otherTimeZoneRendered = inLocalZone.toLocaleString("en-US", { timeZone: zone, timeZoneName: "longOffset"});
							var otherTimeZoneOffset = (function() {
								if (otherTimeZoneRendered.substring(otherTimeZoneRendered.length-1) == "Z") return 0;
								var otherTimeZoneStringOffset = otherTimeZoneRendered.substring(otherTimeZoneRendered.length - 6);
								var offsetAbsoluteValueInMinutes = Number(otherTimeZoneStringOffset.substring(1,3)) * 60 + Number(otherTimeZoneStringOffset.substring(4,6));
								return (function() {
									if (otherTimeZoneStringOffset.substring(0,1) == "+") return -offsetAbsoluteValueInMinutes;
									if (otherTimeZoneStringOffset.substring(0,1) == "-") return offsetAbsoluteValueInMinutes;
									throw new Error();
								})();
							})();
							return inLocalZone.getTime() + (otherTimeZoneOffset - localOffset) * 60000
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
