//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the js/time SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.zones = {};
var TimeZone = ($context.TimeZone) ? $context.TimeZone : Packages.java.util.TimeZone;
var Calendar = ($context.Calendar) ? $context.Calendar : Packages.java.util.Calendar;
var jstrings = TimeZone.getAvailableIDs();

var Zone = function(peer) {
	this.local = function(unix) {
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
	}

	this.unix = function(local) {
		var calendar = Calendar.getInstance(peer);
		//Packages.java.lang.System.err.println("zone = " + peer + " calendar = " + calendar);
		var second = Math.floor(local.second);
		var fraction = local.second - second;
		var milliseconds = Math.floor(fraction * 1000);
		//Packages.java.lang.System.err.println("Calling Calendar.set");
		calendar.set(local.year, local.month-1, local.day, local.hour, local.minute, local.second);
		//Packages.java.lang.System.err.println("Calling Calendar.set (MILLISECONDS)");
		calendar.set(Calendar.MILLISECOND, milliseconds);
		return Number(calendar.getTimeInMillis());
	}
};

(function createZones() {
	for (var i=0; i<jstrings.length; i++) {
		$exports.zones[String(jstrings[i])] = new Zone(TimeZone.getTimeZone(jstrings[i]));
	}
})();

$exports.java = {
	TimeZone: TimeZone,
	Calendar: Calendar
}
