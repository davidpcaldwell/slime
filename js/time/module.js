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

var zones = {};
if (typeof($context.zones) != "undefined") {
	for (var x in $context.zones) {
		zones[x] = $context.zones[x];
	}
}

zones.local = new function() {
	this.local = function(unix) {
		var date = new Date(unix);
		return {
			year: date.getFullYear(), month: date.getMonth()+1, day: date.getDate(),
			hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() + date.getMilliseconds() / 1000
		}
	}
	this.unix = function(local) {
		return new Date(local.year,local.month-1,local.day,local.hour,local.minute,local.second).getTime();
	}
}
if (!zones.UTC) {
	zones.UTC = new function() {
		this.local = function(unix) {
			var date = new Date(unix);
			return {
				year: date.getUTCFullYear(), month: date.getUTCMonth()+1, day: date.getUTCDate(),
				hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds() + date.getUTCMilliseconds() / 1000
			};
		}
		this.unix = function(local) {
			return Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,local.second);
		}
	}
}

var harmonize = function(y,m,d) {
	if (typeof(y) != "number") throw "y not number: " + y;
	if (typeof(m) != "number") throw "m not number: " + m;
	if (typeof(d) != "number") throw "d not number: " + d;
	while(m > 11) {
		m -= 12;
		y += 1;
	}
	while (m < 0) {
		m += 12;
		y -= 1;
	}
	while(new Date(y,m,d).getMonth() != m) {
		d--;
		if (d < 1) throw "Some problem here; " + y + "/" + m + "/" + d;
	}
	return new Date(y,m,d);
}

var Year = function(args) {
	if (typeof(args) == "object" && args.constructor == arguments.callee) {
		this.value = args.value;
	} else if (typeof(args) == "number") {
		this.value = args;
	} else {
		throw "Unrecognized argument: " + args;
	}
	//	TODO	Make 'ad' read-only
}
Year.Month = {};
Year.cast = function(args) {
	if (args.constructor == Year) {
		return args;
	} else {
		throw new TypeError("Not Year: " + args);
	}
}

var MonthId = function(name,index) {
	this.index = index;
	this.name = name;
	this.abbr = name.substring(0,3);

	arguments.callee[index] = this;
	Year.Month[name] = this;
}
MonthId.get = function(index) {
	return this[index];
}
MonthId.cast = function(object) {
	if (object.constructor == MonthId) {
		return object;
	} else {
		throw new TypeError("Not MonthId: " + object);
	}
}
var months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
months.forEach( function(name,index) {
	new MonthId(name,index+1);
});

var Month = function(p) {
	if (arguments.length == 2 && typeof(arguments[0]) == "number" && typeof(arguments[1]) == "number") {
		return new Month({ year: new Year(arguments[0]), id: MonthId.get(arguments[1]) });
	}
	this.year = p.year;
	this.id = p.id;
}

var Week = function() {
}
Week.Day = {};

var WeekDayId = function(name,index,minabbr,maxabbr) {
	this.name = name;

	var abbr = {};

	var i;
	for (i=4; i<arguments.length; i++) {
		abbr[arguments[i].length] = arguments[i];
	}

	var abbreviate = function(length) {
		if (maxabbr < length) {
			return abbreviate(maxabbr);
		}
		if (abbr[length]) return abbr[length];
		return name.substring(0,length);
	}

	this.abbr = {};
	for (i=1; i<=5; i++) {
		this.abbr[i] = abbreviate(i);
	}

	this.abbr1to2 = function() {
		if (minabbr.length == 1) return this.abbr[1];
		return this.abbr[2];
	}

	Week.Day[name] = this;
}
WeekDayId.get = function(index) {
	return days[index];
}
var days = [
	new WeekDayId("SUNDAY", 0, 2, 3, "U"),
	new WeekDayId("MONDAY", 1, 1, 3),
	new WeekDayId("TUESDAY", 2, 2, 4),
	new WeekDayId("WEDNESDAY", 3, 1, 4, "WEDS"),
	new WeekDayId("THURSDAY", 4, 2, 5, "R"),
	new WeekDayId("FRIDAY", 5, 1, 3),
	new WeekDayId("SATURDAY", 6, 2, 3, "A")
];

var Parser = function() {
	var checks = [];

	this.add = function(check) {
		checks.push(check);
	}

	this.format = function(mask) {
		var rv = "";
		while(mask.length > 0) {
			//	If none match, just use the mask character
			var result = {length: 1, string: mask.substring(0,1), initial: true};
			for (var i=0; i<checks.length; i++) {
				if (result.initial) {
					var check = checks[i].execute(mask);
					if (check) {
						result = check;
					}
				}
			}
			rv += result.string;
			mask = mask.substring(result.length);
		}
		return rv;
	}
}

var addDayParserChecks = function(parser,year,month,day,date) {
	var toDate = function() {
		return date;
	}

	//	TODO	Promote to some sort of string-manipulation API, or even inonit.js?
	var lzpad = function(s,len) {
		var str = String(s);
		while(str.length < len) {
			str = "0" + str;
		}
		return str;
	}

	var check = function(string,s,val) {
		var match;
		var length;
		if (typeof(s) == "string") {
			match = string.substring(0,s.length) == s;
			length = s.length;
		} else if (typeof(s) == "object") {
			match = s.check(string);
			length = s.length;
		}
		if (match) {
			return {string: String(val), length: length};
		}
		return function(){}();
	}

	var addCheck = function(pattern,object) {
		if (arguments.length == 1 && arguments[0].execute) {
			parser.add(arguments[0])
		} else {
			parser.add(new function() {
				this.execute = function(mask) {
					return check(mask,pattern,object);
				}
			})
		}
	}

	addCheck("mmmm", month.name.toLowerCase());
	addCheck("Mmmm", month.name.substring(0,1) + month.name.substring(1).toLowerCase());
	addCheck("MMMM", month.name);
	addCheck("mmm", month.abbr.toLowerCase());
	addCheck("Mmm", month.abbr.substring(0,1) + month.abbr.substring(1).toLowerCase());
	addCheck("MMM", month.abbr);

	var caseInsensitive = function(prefix,value) {
		return new function() {
			this.execute = function(string) {
				if (string.substring(0,prefix.length).toUpperCase() == prefix) {
					return {string: value, length: prefix.length};
				}
				return function(){}();
			}
		}
	}

	var mixedCase = function(prefix,value) {
		return new function() {
			var match = function(string) {
				return string.substring(0,prefix.length);
			}
			var getString = function(string) {
				var upper = value;
				var allUpper = (match(string).toUpperCase() == match(string));
				var mixedCase = !allUpper && (match(string).toUpperCase().substring(0,1) == match(string).substring(0,1));
				var allLower = (!allUpper) && (!mixedCase);
				if (allUpper) return upper;
				if (mixedCase) return upper.substring(0,1) + upper.substring(1).toLowerCase();
				if (allLower) return upper.toLowerCase();
				return function(){}();
			}

			this.execute = function(string) {
				if (string.substring(0,prefix.length).toUpperCase() == prefix) {
					return {
						string: getString(string),
						length: prefix.length
					}
				}
				return function(){}();
			}
		}
	}

	var dayOfWeek = WeekDayId.get(toDate().getDay());

	addCheck(mixedCase("WWWWWW", dayOfWeek.name));
	addCheck(mixedCase("WWWWW", dayOfWeek.abbr[5]));
	addCheck(mixedCase("WWWW", dayOfWeek.abbr[4]));
	addCheck(mixedCase("WWW", dayOfWeek.abbr[3]));
	addCheck(mixedCase("?W", dayOfWeek.abbr1to2()));
	addCheck(mixedCase("WW", dayOfWeek.abbr[2]));
	addCheck(mixedCase("W", dayOfWeek.abbr[1]));

	addCheck(caseInsensitive("MM", lzpad(month.index, 2)));
	addCheck(caseInsensitive("?M", month.index));
	addCheck(caseInsensitive("YYYY", String(year.value)));
	addCheck(caseInsensitive("YY", year.value % 100));
	addCheck(caseInsensitive("DD", lzpad(day, 2)));
	addCheck(caseInsensitive("?D", day));
}

var addTimeParserChecks = function(parser,hours,minutes,seconds) {
	var format = function(n,pad) {
		var rv = n.toFixed(0);
		if (pad && rv.length == 1) rv = "0" + rv;
		return rv;
	}

	var toampm = function(hours) {
		if (hours == 0) return 12;
		if (hours > 12) return hours-12;
		return hours;
	}

	var ampm = function(hours) {
		if (hours < 12) return "am";
		return "pm";
	}

	var replace = function(prefix,replace) {
		parser.add(new function() {
			this.execute = function(string) {
				if (string.substring(0,prefix.length) == prefix) {
					return {length: prefix.length, string: replace};
				}
				return function(){}();
			}
		});
	}

	replace("HR", format(hours, true));
	replace("hr", format(toampm(hours), true));
	replace("H", format(hours));
	replace("h", format(toampm(hours)));

	replace("mi", format(minutes, true));
	replace("sc", format(seconds, true));
	replace("am", ampm(hours));
	replace("AM", ampm(hours).toUpperCase());
	replace("pm", ampm(hours));
	replace("PM", ampm(hours).toUpperCase());

	parser.add(new function() {
		this.execute = function(string) {
			if (string.indexOf(".#") == 0) {
				var mul = function(str,n) {
					return Array(n+1).join(str);
				}

				var count = 1;
				while(string.indexOf("." + mul("#",count+1)) != -1) {
					count++;
				}

				return {length: count+1, string: "." + seconds.toFixed(count).split(".")[1]};
			}
			return function(){}();
		}
	});
}

var order = function(a,b) {
	if (a.isBefore(b)) return -1;
	if (a.isAfter(b)) return 1;
	return 0;
}

var Day = function() {
	var year;
	var month;
	var day;

	if (typeof(arguments[0]) == "number" && arguments.length == 3) {
		(function checkArguments() {
			var asDate = new Date(arguments[0], arguments[1]-1, arguments[2]);
			if (asDate.getFullYear() != arguments[0] || asDate.getMonth() != (arguments[1]-1) || asDate.getDate() != arguments[2]) {
				throw new Error("Invalid date arguments: " + Array.prototype.join.apply(arguments, [","]));
			}	
		}).apply(this,arguments);
		return new Day({
			year: new Year(arguments[0]),
			month: MonthId.get(arguments[1]),
			day: arguments[2]
		});
	}

	if (typeof(arguments[0]) == "object" && arguments[0] && typeof(arguments[0].date) == "object") {
		var arg = arguments[0];
		return new Day(
			arg.date.getFullYear(),
			arg.date.getMonth()+1,
			arg.date.getDate()
		);
	}

	if (typeof(arguments[0]) == "object" && arguments[0] && typeof(arguments[0].json) == "object") {
		var arg = arguments[0];
		return new Day(arg.json.year.value, arg.json.month.index, arg.json.day);
	}
	
	if (arguments.length == 1) {
		var arg = arguments[0];
		if (typeof(arg.year) != "undefined") {
			year = Year.cast(arg.year);
			month = MonthId.cast(arg.month);
			day = Number(arg.day);
		} else {
			throw new Error("Unknown arguments: " + Array.prototype.join.apply(arguments, [","]));
		}
	} else {
		throw new Error("Unknown arguments: " + Array.prototype.join.apply(arguments, [","]));
	}

	var toDate = function(offset) {
		if (typeof(offset) == "undefined") offset = 0;
		var base = new Date(
			year.value,
			month.index-1,
			day,
			0,
			0,
			0
		);
		var time = base.getTime() + (offset + 0.5)*24*60*60*1000;
		var end = new Date(time);
		return new Date(end.getFullYear(), end.getMonth(), end.getDate());
	}

	//	TODO	Use getters on platforms supporting them
	this.year = year;
	this.month = ($context.old && $context.old.Day_month) ? month : new Month({ year: year, id: month });
	this.day = day;

	this.weekday = WeekDayId.get(toDate().getDay());
	$api.experimental(this,"weekday");

	this.add = function(offset) {
		return new Day({date: toDate(offset)});
	}

	this.addMonths = function(offset) {
		var asDate = harmonize(this.year.value, this.month.index-1+offset, this.day);
		return new Day({date: asDate});
	}

	this.addYears = function(offset) {
		return new Day({date: harmonize(this.year.value+offset, this.month.index-1, this.day)});
	}

	this.at = function(time) {
		return new Time({day: this, time: time});
	}

	this.format = function(mask) {
		var parser = new Parser();
		addDayParserChecks(parser,year,month,day,toDate());
		return parser.format(mask);
	}

	this.isBefore = function(day) {
		return ToDate(this).getTime() < ToDate(day).getTime();
	}

	this.isAfter = function(day) {
		return ToDate(this).getTime() > ToDate(day).getTime();
	}

	this.is = function(day) {
		return ToDate(this).getTime() == ToDate(day).getTime();
	}

	return this;
}
Day.subtract = function(a,b) {
	var whena = a.at(new Day.Time(0,0)).local();
	var whenb = b.at(new Day.Time(0,0)).local();
	return Math.round((whena.unix - whenb.unix) / 1000 / 60 / 60 / 24);
}
Day.Time = function() {
	var hours;
	var minutes;
	var seconds;

	var Self = arguments.callee;

	if (arguments.length == 1) {
		var between = function(prop,min,max) {
			if (typeof(args[prop]) == "undefined") throw "Missing: " + prop;
			var n = Number(args[prop]);
			if (n < min || n > max) throw "Out of range: " + prop + "=" + n;
			//	TODO	Check for integer
			return n;
		}

		var args = arguments[0];
		if (typeof(args.hours) != "undefined") {
			hours = between("hours",0,23);
			minutes = between("minutes",0,59);
			seconds = (args.seconds) ? Number(args.seconds) : 0;
			if (seconds < 0 || seconds >= 60) {
				throw "Illegal seconds: " + seconds;
			}
		} else if (typeof(args.json) != "undefined") {
			return new arguments.callee(args.json);
		} else {
			throw "Unrecognized arguments.";
		}
	} else if (arguments.length == 2) {
		return new Self({hours: arguments[0], minutes: arguments[1]});
	} else if (arguments.length == 3) {
		return new Self({hours: arguments[0], minutes: arguments[1], seconds: arguments[2]});
	} else {
		throw "Unrecognized arguments.";
	}

	//	TODO	Use read only on platforms supporting this
	this.hours = hours;
	this.minutes = minutes;
	this.seconds = seconds;

	this.format = function(mask) {
		var format = function(n,pad) {
			var rv = Math.floor(n).toFixed(0);
			if (pad && rv.length == 1) rv = "0" + rv;
			return rv;
		}

		var toampm = function(hours) {
			if (hours == 0) return 12;
			if (hours > 12) return hours-12;
			return hours;
		}

		var ampm = function(hours) {
			if (hours < 12) return "am";
			return "pm";
		}

		mask = mask.replace(/HR/, format(this.hours, true));
		mask = mask.replace(/hr/, format(toampm(this.hours), true));
		mask = mask.replace(/H/, format(this.hours));
		mask = mask.replace(/h/, format(toampm(this.hours)));

		mask = mask.replace(/mi/, format(this.minutes, true));
		mask = mask.replace(/sc/, format(this.seconds, true));
		mask = mask.replace(/am/, "pm");
		mask = mask.replace(/AM/, "PM");
		mask = mask.replace(/pm/, ampm(this.hours));
		mask = mask.replace(/PM/, ampm(this.hours).toUpperCase());

		if (mask.indexOf(".#") != -1) {
			var mul = function(str,n) {
				return Array(n+1).join(str);
			}

			var count = 1;
			while(mask.indexOf("." + mul("#",count+1)) != -1) {
				count++;
			}

			mask = mask.replace("." + mul("#",count), "." + this.seconds.toFixed(count).split(".")[1]);
		}
		return mask;
	}

	return function(){}();
}
Day.today = function() {
	return new Day({date: new Date()});
}
Day.codec = {};
Day.codec.js = new function() {
	this.encode = function(o) {
		return { year: o.year.value, month: o.month.index, day: o.day };
	}

	this.decode = function(o) {
		return new Day(o.year,o.month,o.day);
	}
}
Day.codec.json = new function() {
	this.encode = function(o) {
		return {
			year: { value: o.year.value },
			month: { index: o.month.index },
			day: o.day
		};
	}

	this.decode = function(o) {
		return new Day(o.year.value,o.month.index,o.day);
	}
}
Day.codec.iso8601 = new function() {
	this.extended = new function() {
		this.encode = function(o) {
			return o.format("yyyy-mm-dd");
		}

		this.decode = function(string) {
			var parsed = string.split("-");
			var rv = new Day(Number(parsed[0]),Number(parsed[1]),Number(parsed[2]));
			return rv;
		}
	}
}

var Time = function() {
	var day;
	var time;

	if (arguments.length == 1) {
		if (arguments[0].json) {
			day = new Day({ json: arguments[0].json.day });
			time = new Day.Time({ json: arguments[0].json.time });
		} else {
			day = arguments[0].day;
			time = arguments[0].time;
		}
	}

	this.day = day;
	this.time = time;

	this.addDays = function(days) {
		return new When({
			day: day.add(days),
			time: time
		});
	}

	this.addMonths = function(months) {
		return new When({
			day: day.addMonths(months),
			time: time
		});
	}

	this.addYears = function(years) {
		return new When({
			day: day.addYears(years),
			time: time
		});
	}

	this.local = function(zone) {
		if (!zone) zone = zones.local;
		var unix = zone.unix({
			year: day.year.value,
			month: day.month.index,
			day: day.day,
			hour: time.hours,
			minute: time.minutes,
			second: time.seconds
		});
		return new When({unix: unix});
	}

	this.format = function(mask) {
		var parser = new Parser();
		addDayParserChecks(parser,this.day.year,this.day.month,this.day.day,ToDate(this.day));
		addTimeParserChecks(parser,this.time.hours,this.time.minutes,this.time.seconds);
		return parser.format(mask);
	}
}
Time.codec = {};
Time.codec.js = new function() {
	this.encode = function(o) {
		return { day: Day.codec.js.encode(o.day), time: { hours: o.time.hours, minutes: o.time.minutes, seconds: o.time.seconds } };
	}

	this.decode = function(o) {
		return new Time({
			day: Day.codec.js.decode(o.day),
			time: new Day.Time(o.time)
		});
	}
}

var When = function() {
	var date;

	if (arguments.length == 1) {
		var args = arguments[0];
		if (args.getYear && args.getFullYear) {
			return new When({ date: args });
		} else if (args.date) {
			date = new Date(args.date.getTime());
		} else if (args.unix) {
			date = new Date(args.unix);
		} else if (args.day) {
			date = new Date(
				args.day.year.value,
				args.day.month.index-1,
				args.day.day,
				args.time.hours,
				args.time.minutes,
				Math.floor(args.time.seconds),
				(args.time.seconds - Math.floor(args.time.seconds)) * 1000
			);
		} else if (args.json) {
			return new arguments.callee({
				unix: args.json.unix
			});
		} else {
			throw new TypeError("Unrecognized arguments.");
		}
	} else {
		throw new TypeError("Unrecognized arguments.");
	}

	this.toString = function() {
		return date.toString();
	}

	//	Time zone information: http://www.twinsun.com/tz/tz-link.htm
	this.local = function(zone) {
		if (!zone) zone = zones.local;
		var zoned = zone.local(date.getTime());
		return new Time({
			day: new Day(zoned.year,zoned.month,zoned.day),
			time: new Day.Time(zoned.hour,zoned.minute,zoned.second)
		});
	}

//	this.day = new Day({ date: date });
//
//	this.time = new Day.Time({
//		hours: date.getHours(),
//		minutes: date.getMinutes(),
//		seconds: date.getSeconds() + date.getMilliseconds() / 1000
//	});

	this.unix = date.getTime();

	this.isBefore = function(other) {
		return this.unix < other.unix;
	}

	this.isAfter = function(other) {
		return this.unix > other.unix;
	}

	this.is = function(other) {
		return this.unix == other.unix;
	}
	return this;
}
When.now = function() {
	return new When({date: new Date()});
}
When.codec = {};
When.codec.js = new function() {
	this.encode = function(o) {
		return { unix: o.unix };
	}

	this.decode = function(o) {
		return new When({ unix: o.unix });
	}
}
When.codec.rfc3339 = new function() {
	this.decode = function(string) {
		var parsedTime = /^(\d{4})\-(\d{2})\-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})(?:\.(\d{3}))?(Z|((?:\+|\-)\d{2})\:(\d{2}))$/.exec(string);
		var seconds = parsedTime[6];
		if (parsedTime[7]) {
			seconds += Number(parsedTime[7]) / 1000;
		}
		var offset;
		var zone = parsedTime[8];
		if (parsedTime[9] && parsedTime[10]) {
			var hh = Number(parsedTime[9]);
			var mm = Number(parsedTime[10]);
			offset = hh * 60 + ((hh < 0) ? -mm : mm);
		} else if (parsedTime[8] == "Z") {
			offset = 0;
		}
		var utc = zones.UTC.unix({
			year: parsedTime[1],
			month: parsedTime[2],
			day: parsedTime[3],
			hour: parsedTime[4],
			minute: parsedTime[5],
			second: parsedTime[6]
		});
		var rv = utc - offset * 60 * 1000;
		return new When({ unix: rv });
	}

	this.encode = function(when) {
		return when.local(zones.UTC).format("yyyy-mm-ddTHR:mi:sc.###Z");
	}
}
When.codec.Date = new function() {
	this.encode = function(o) {
		return new Date(o.unix);
	}

	this.decode = function(o) {
		return new When(o.getTime());
	}
}
var Period = function(args) {
}

var ToDate = function() {
	var isDay = function(p) {
		//	It is mysterious why the second part of this OR is necessary, but the first version did not work
		//	consistently on Google Chrome within an application, so adding this workaround for now, pending future investigation.
		return p && (p.constructor == Day || p.constructor.toString() == Day.toString());
	};

	if (arguments.length == 1 && typeof(arguments[0]) == "object" && isDay(arguments[0])) {
		return new Date(arguments[0].year.value, arguments[0].month.index-1, arguments[0].day);
	} else if (arguments.length == 1 && typeof(arguments[0]) == "object" && arguments[0].constructor == When) {
		return new Date(arguments[0].day.year.value, arguments[0].day.month.index-1,arguments[0].day.day,
			arguments[0].time.hours, arguments[0].time.minutes, Math.floor(arguments[0].time.seconds),
			(arguments[0].time.seconds % 1) * 1000
		);
	}
	return function(){}();
}

$exports.Year = Year;
//$exports.Year = {Month: Year.Month};
$exports.Month = Month;
$exports.Day = Day;
$exports.Day.order = order;
$exports.Time = Time;
$exports.Time.Zone = zones;
$exports.When = When;
$exports.When.order = order;
if ($context.java) {
	$exports.java = $context.java;
}
//exports.Time = Time;
//exports.Period = Period;
// TODO: this is dumb and should be removed
$exports.install = function() {
	if (!arguments.callee.called) {
		var oldDate = Date;
		Date = function() {
			if(this.constructor == arguments.callee) {
				var local = ToDate.apply(null, arguments);
				if (local) {
					return local;
				} else {
					//	TODO	funky reflective constructor
					if (arguments.length == 1) {
						return new oldDate(arguments[0]);
					} else if (arguments.length == 2) {
						return new oldDate(arguments[0],arguments[1]);
					} else if (arguments.length == 3) {
						return new oldDate(arguments[0],arguments[1],arguments[2]);
					} else if (arguments.length == 4) {
						return new oldDate(arguments[0],arguments[1],arguments[2],arguments[3]);
					} else if (arguments.length == 5) {
						return new oldDate(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);
					} else if (arguments.length == 6) {
						return new oldDate(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);
					} else if (arguments.length == 7) {
						return new oldDate(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5],arguments[6]);
					} else if (arguments.length == 0) {
						return new oldDate();
					} else if (arguments.length > 7) {
						throw new TypeError("Illegal number of arguments to new Date(...); see ECMA-262 15.9.3");
					}
				}
				return function(){}();
			} else {
				return oldDate.apply(this, arguments);
			}
		};
		Date.was = oldDate;
		var members = [];
		members.push("UTC");
		for (var x in oldDate) {
			members.push(x);
		}
		members.forEach( function(x) {
			Date[x] = oldDate[x];
		});
		Date.now = oldDate.now;
		arguments.callee.called = true;
	}
}