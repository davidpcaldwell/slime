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
	 * @param { slime.time.context.Java } $context
	 * @param { slime.loader.Export<slime.time.Context> } $export
	 */
	function(Packages,$context,$export) {
		var TimeZone = ($context.TimeZone) ? $context.TimeZone : Packages.java.util.TimeZone;
		var Calendar = ($context.Calendar) ? $context.Calendar : Packages.java.util.Calendar;

		var Zone = function(peer) {
			return {
				local: function(unix) {
					var calendar = Calendar.getInstance(peer);
					calendar.setTimeInMillis(unix);
					return {
						year: Number(calendar.get(Calendar.YEAR)),
						month: Number(calendar.get(Calendar.MONTH))+1,
						day: Number(calendar.get(Calendar.DAY_OF_MONTH)),
						hour: Number(calendar.get(Calendar.HOUR_OF_DAY)),
						minute: Number(calendar.get(Calendar.MINUTE)),
						second: Number(calendar.get(Calendar.SECOND)) + Number(calendar.get(Calendar.MILLISECOND)) / 1000
					};
				},
				unix: function(local) {
					var calendar = Calendar.getInstance(peer);
					//Packages.java.lang.System.err.println("zone = " + peer + " calendar = " + calendar);
					var second = Math.floor(local.second);
					var fraction = local.second - second;
					var milliseconds = Math.round(fraction * 1000);
					//Packages.java.lang.System.err.println("Calling Calendar.set");
					calendar.set(local.year, local.month-1, local.day, local.hour, local.minute, local.second);
					//Packages.java.lang.System.err.println("Calling Calendar.set (MILLISECONDS)");
					calendar.set(Calendar.MILLISECOND, milliseconds);
					return Number(calendar.getTimeInMillis());
				}
			}
		};

		$export({
			zones: (
				function() {
					/** @type { slime.time.Context["zones"] } */
					var rv = {};
					var jstrings = TimeZone.getAvailableIDs();
					for (var i=0; i<jstrings.length; i++) {
						rv[String(jstrings[i])] = Zone(TimeZone.getTimeZone(jstrings[i]));
					}
					return rv;
				}
			)(),
			java: {
				TimeZone: TimeZone,
				Calendar: Calendar
			}
		})
	}
//@ts-ignore
)(Packages,$context,$export);
