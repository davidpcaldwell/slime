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
	 * @param { slime.loader.Export<slime.time.PlatformExports> } $export
	 */
	function($api,$export) {
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
				/** @type { Intl.DateTimeFormatOptions & { hourCycle: string } } */
				var options = {
					timeZone: zone,
					year: "numeric", month: "numeric", day: "numeric",
					hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23"
				};
				var formatter = /** @type { Intl.DateTimeFormat & { formatToParts: (date: Date) => { type: string, value: string }[] } } */ (new Intl.DateTimeFormat("en-US", options));
				var local = function(millis) {
					var date = new Date(millis);
					var parts = formatter.formatToParts(date).reduce(function(values, part) {
						values[part.type] = Number(part.value);
						return values;
					}, /** @type { { [part: string]: number } } */ ({}));
					return {
						year: parts.year,
						month: parts.month,
						day: parts.day,
						hour: parts.hour,
						minute: parts.minute,
						second: parts.second + date.getUTCMilliseconds() / 1000
					};
				};
				return {
					id: zone,
					implementation: {
						local: local,
						unix: function(datetime) {
							var second = Math.floor(datetime.second);
							var milliseconds = Math.round((datetime.second - second) * 1000);
							var requested = Date.UTC(datetime.year, datetime.month - 1, datetime.day, datetime.hour, datetime.minute, second, milliseconds);
							var candidate = requested;
							for (var attempt = 0; attempt < 3; attempt++) {
								var datetimeAtCandidate = local(candidate);
								var localSecond = Math.floor(datetimeAtCandidate.second);
								var rendered = Date.UTC(datetimeAtCandidate.year, datetimeAtCandidate.month - 1, datetimeAtCandidate.day, datetimeAtCandidate.hour, datetimeAtCandidate.minute, localSecond, Math.round((datetimeAtCandidate.second - localSecond) * 1000));
								var adjustment = requested - rendered;
								if (adjustment == 0) return candidate;
								candidate += adjustment;
							}
							return candidate;
						}
					}
				}
			}
		).reduce(function(rv,it) {
			rv[it.id] = it.implementation;
			return rv;
		}, {});
		var localZone = {
			local: function(unix) {
				var date = new Date(unix);
				return {
					year: date.getFullYear(),
					month: date.getMonth() + 1,
					day: date.getDate(),
					hour: date.getHours(),
					minute: date.getMinutes(),
					second: date.getSeconds() + date.getMilliseconds() / 1000
				};
			},
			unix: function(datetime) {
				var second = Math.floor(datetime.second);
				var milliseconds = Math.round((datetime.second - second) * 1000);
				return new Date(datetime.year, datetime.month - 1, datetime.day, datetime.hour, datetime.minute, second, milliseconds).getTime();
			}
		};

		$export({
			importZones: function() {
				return zones;
			},
			world: {
				now: { read: function() { return new Date().getTime(); } },
				zone: { read: function() { return localZone; } }
			}
		});
	}
//@ts-ignore
)($api,$export);
