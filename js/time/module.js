//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.time.Context } $context
	 * @param { slime.loader.Script<slime.time.Exports> } $export
	 */
	function($api,$context,$export) {
		var now = $context.now || function() { return new Date().getTime(); };

		/** @type { { local: slime.time.Zone, UTC: slime.time.Zone, [id: string]: slime.time.Zone } } */
		var zones = {
			local: new function() {
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
			},
			//	TODO	Should we make this conditional on $context.zones.UTC?
			UTC: new function() {
				this.local = function(unix) {
					var date = new Date(unix);
					return {
						year: date.getUTCFullYear(), month: date.getUTCMonth()+1, day: date.getUTCDate(),
						hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds() + date.getUTCMilliseconds() / 1000
					};
				}
				this.unix = function(local) {
					var wholeSeconds = Math.floor(local.second);
					var milliseconds = Math.round((local.second - Math.floor(local.second)) * 1000);
					return Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,wholeSeconds,milliseconds);
				}
			}
		};

		if (typeof($context.zones) != "undefined") {
			for (var x in $context.zones) {
				zones[x] = $context.zones[x];
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
				if (d < 1) throw new Error("Some problem here; " + y + "/" + m + "/" + d);
			}
			return new Date(y,m,d);
		}

		/**
		 *
		 * @param { number } y
		 * @param { number } m
		 * @param { number } d
		 * @returns { slime.time.Date }
		 */
		var harmonizeDate = function(y,m,d) {
			while(m > 12) {
				m -= 12;
				y += 1;
			}
			while (m < 1) {
				m += 12;
				y -= 1;
			}
			while(new Date(y,m-1,d).getMonth() != m-1) {
				d--;
				if (d < 1) throw new Error("Some problem here; " + y + "/" + m + "/" + d);
			}
			return {
				year: y,
				month: m,
				day: d
			};
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

			this.day = function(p) {
				if (typeof(p) == "number") {
					return new Day({
						year: this.year,
						month: this.id,
						day: p
					});
				}
			}
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

		/**
		 *
		 * @param { slime.time.Date } ref
		 * @param { number } offset
		 * @return { slime.time.Date }
		 */
		var Date_add = function(ref,offset) {
			var base = new Date(
				ref.year,
				ref.month-1,
				ref.day,
				0,
				0,
				0
			);
			var time = base.getTime() + (offset + 0.5)*24*60*60*1000;
			var end = new Date(time);
			return {
				year: end.getFullYear(),
				month: end.getMonth() + 1,
				day: end.getDate()
			}
		};

		/**
		 *
		 * @param { slime.time.Date } ref
		 * @param { number } offset
		 * @returns { slime.time.Date }
		 */
		var Date_addMonths = function(ref,offset) {
			return harmonizeDate(ref.year, ref.month + offset, ref.day);
		};

		var Date_addYears = function(ref,offset) {
			return harmonizeDate(ref.year + offset, ref.month, ref.day);
		}

		/**
		 * @constructor
		 * @param { any } p
		 */
		function Day(p) {
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
				if (typeof(arg.year) == "number" && typeof(arg.month) == "number" && typeof(arg.day) == "number") {
					year = new Year(arg.year);
					month = new Month({ year: year, id: MonthId.get(arg.month) });
					day = arg.day;
				} else if (typeof(arg.year) != "undefined") {
					year = Year.cast(arg.year);
					month = new Month({ year: year, id: MonthId.cast(arg.month) });
					day = Number(arg.day);
				} else {
					throw new Error("Unknown arguments: " + Array.prototype.join.apply(arguments, [","]));
				}
			} else {
				throw new Error("Unknown arguments: " + Array.prototype.join.apply(arguments, [","]));
			}

			//	TODO	use Date_add
			var toDate = function(offset) {
				if (typeof(offset) == "undefined") offset = 0;
				var base = new Date(
					year.value,
					month.id.index-1,
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
			this.month = ($context.old && $context.old.Day_month) ? month.id : month;
			this.day = day;

			this.weekday = WeekDayId.get(toDate().getDay());
			$api.experimental(this,"weekday");

			this.add = function(offset) {
				return new Day({date: toDate(offset)});
			}

			this.addMonths = function(offset) {
				var asDate = harmonize(this.year.value, month.id.index-1+offset, this.day);
				return new Day({date: asDate});
			}

			this.addYears = function(offset) {
				return new Day({date: harmonize(this.year.value+offset, month.id.index-1, this.day)});
			}

			this.at = function(time) {
				return new Time({day: this, time: time});
			}

			this.format = function(mask) {
				var parser = new Parser();
				addDayParserChecks(parser,year,month.id,day,toDate());
				return parser.format(mask);
			}

			this.isBefore = function(day) {
				return toGlobalDate(this).getTime() < toGlobalDate(day).getTime();
			}

			this.isAfter = function(day) {
				return toGlobalDate(this).getTime() > toGlobalDate(day).getTime();
			}

			this.is = function(day) {
				return toGlobalDate(this).getTime() == toGlobalDate(day).getTime();
			}

			this.adapt = function() {
				return {
					year: year.value,
					month: month.id.index,
					day: day
				}
			}

			return this;
		}
		Day.subtract = function(a,b) {
			var whena = a.at(new Day_Time(0,0)).local();
			var whenb = b.at(new Day_Time(0,0)).local();
			return Math.round((whena.unix - whenb.unix) / 1000 / 60 / 60 / 24);
		}
		/**
		 * @constructor
		 * @param { any } hours
		 * @param { any } [minutes]
		 */
		function Day_Time(hours,minutes) {
			var Self = arguments.callee;
			var hours;
			var minutes;
			var seconds;

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
					return new Day_Time(args.json);
				} else {
					throw "Unrecognized arguments.";
				}
			} else if (arguments.length == 2) {
				return new Day_Time({hours: arguments[0], minutes: arguments[1]});
			} else if (arguments.length == 3) {
				return new Day_Time({hours: arguments[0], minutes: arguments[1], seconds: arguments[2]});
			} else {
				throw "Unrecognized arguments.";
			}

			//	TODO	Use read only on platforms supporting this
			this.hours = hours;
			this.minutes = minutes;
			this.seconds = seconds;

			//	TODO	horrifying overlap of stuff in addTimeParserChecks
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

			return void(0);
		}
		Day.today = function() {
			return new Day({date: new Date()});
		}
		Day.codec = {};
		Day.codec.js = new function() {
			this.encode = function(o) {
				var month = (o.month.id) ? o.month.id.index : o.month.index;
				return { year: o.year.value, month: month, day: o.day };
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
				var month = (o.month.id) ? o.month.id.index : o.month.index;
				return new Day(o.year.value,month,o.day);
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
		Day.rehydrate = function(json) {
			return new Day(json.year.value, json.month.id.index, json.day);
		};

		function Time() {
			var day;
			var time;

			if (arguments.length == 1) {
				if (arguments[0].json) {
					day = new Day({ json: arguments[0].json.day });
					time = new Day_Time({ json: arguments[0].json.time });
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
					month: (day.month.id) ? day.month.id.index : day.month.index,
					day: day.day,
					hour: time.hours,
					minute: time.minutes,
					second: time.seconds
				});
				return new When({unix: unix});
			}

			this.format = function(mask) {
				var parser = new Parser();
				var monthId = (this.day.month.id) ? this.day.month.id : this.day.month;
				addDayParserChecks(parser,this.day.year,monthId,this.day.day,ToDate(this.day));
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
					time: new Day_Time(o.time)
				});
			}
		}

		function When() {
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
					return new When({
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
			/** @type { slime.time.old.When["local"] } */
			this.local = function(zone) {
				if (!zone) zone = zones.local;
				var zoned = zone.local(date.getTime());
				return new Time({
					day: new Day(zoned.year,zoned.month,zoned.day),
					time: new Day_Time(zoned.hour,zoned.minute,zoned.second)
				});
			}

			// this.day = new Day({ date: date });

			// this.time = new Day.Time({
			// 	hours: date.getHours(),
			// 	minutes: date.getMinutes(),
			// 	seconds: date.getSeconds() + date.getMilliseconds() / 1000
			// });

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
				if (!parsedTime) {
					throw new TypeError("Does not match RFC3339 format: " + string);
				}
				var seconds = parsedTime[6];
				if (parsedTime[7]) {
					seconds += "." + parsedTime[7];
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
					year: Number(parsedTime[1]),
					month: Number(parsedTime[2]),
					day: Number(parsedTime[3]),
					hour: Number(parsedTime[4]),
					minute: Number(parsedTime[5]),
					second: Number(seconds)
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

		/**
		 * @returns { Date | void }
		 */
		var ToDate = function() {
			var isDay = function(p) {
				//	It is mysterious why the second part of this OR is necessary, but the first version did not work
				//	consistently on Google Chrome within an application, so adding this workaround for now, pending future investigation.
				return p && (p.constructor == Day || p.constructor.toString() == Day.toString());
			};

			if (arguments.length == 1 && typeof(arguments[0]) == "object" && isDay(arguments[0])) {
				var monthId = (arguments[0].month.id) ? arguments[0].month.id : arguments[0].month;
				return new Date(arguments[0].year.value, monthId.index-1, arguments[0].day);
			} else if (arguments.length == 1 && typeof(arguments[0]) == "object" && arguments[0].constructor == When) {
				var monthId = (arguments[0].month.id) ? arguments[0].month.id : arguments[0].month;
				return new Date(arguments[0].day.year.value, monthId.index-1,arguments[0].day.day,
					arguments[0].time.hours, arguments[0].time.minutes, Math.floor(arguments[0].time.seconds),
					(arguments[0].time.seconds % 1) * 1000
				);
			}
			return void(0);
		}

		/**
		 * @returns { Date }
		 */
		var toGlobalDate = function() {
			var rv = ToDate.apply(this,arguments);
			if (!rv) throw new Error();
			return rv;
		}

		// TODO: this is dumb and should be removed
		var install = (function() {
			var called = false;
			return function callee() {
				var global = (function(){ return this; })();
				if (!called) {
					var oldDate = global.Date;
					global.Date = function() {
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
					global.Date.was = oldDate;
					var members = [];
					members.push("UTC");
					for (var x in oldDate) {
						members.push(x);
					}
					members.forEach( function(x) {
						Date[x] = oldDate[x];
					});
					Date.now = oldDate.now;
					called = true;
				}
			}
		})();

		/** @type { slime.time.DayOfWeek[] } */
		var daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

		var ordering = {
			/** @type { (a: slime.time.Date, b: slime.time.Date) => number } */
			js: function(a,b) {
				if (a.year - b.year != 0) return a.year - b.year;
				if (a.month - b.month != 0) return a.month - b.month;
				if (a.day - b.day != 0) return a.day - b.day;
				return 0;
			}
		}

		var Value = {
			now: function(context) {
				return context.now || Date.now;
			}
		};

		$export({
			Value: $api.fp.methods.pin($context)(Value),
			Date: {
				input: {
					today: function() {
						var datetime = zones.local.local(now());
						return {
							year: datetime.year,
							month: datetime.month,
							day: datetime.day
						}
					}
				},
				from: {
					ymd: function(y,m,d) {
						return {
							year: y,
							month: m,
							day: d
						}
					}
				},
				is: function(date) {
					return function(other) {
						return ordering.js(date, other) == 0;
					}
				},
				isBefore: function(date) {
					return function(other) {
						return ordering.js(date, other) > 0;
					}
				},
				isAfter: function(date) {
					return function(other) {
						return ordering.js(date, other) < 0;
					}
				},
				offset: function(offset) {
					return function(day) {
						return Date_add(day, offset);
					}
				},
				after: function(day) {
					return function(offset) {
						return Date_add(day, offset);
					}
				},
				month: function(date) {
					return {
						year: date.year,
						month: date.month
					};
				},
				months: {
					offset: function(offset) {
						return function(day) {
							return Date_addMonths(day, offset);
						}
					},
					after: function(day) {
						return function(offset) {
							return Date_addMonths(day, offset);
						}
					}
				},
				years: {
					offset: function(offset) {
						return function(day) {
							return Date_addYears(day, offset);
						}
					},
					after: function(day) {
						return function(offset) {
							return Date_addYears(day, offset);
						}
					}
				},
				/** @type {slime.time.Exports["Date"]["format"] } */
				format: function(mask) {
					/** @type { ReturnType<slime.time.Exports["Date"]["format"]> } */
					return function(day) {
						var dayObject = new Day(day.year, day.month, day.day);
						return dayObject.format(mask);
					}
				},
				order: {
					js: ordering.js
				},
				dayOfWeek: function(date) {
					var js = new Date(date.year, date.month-1, date.day);
					var dow = js.getDay();
					var index = (dow == 0) ? 6 : dow - 1;
					return daysOfWeek[index];
				}
			},
			Month: {
				/** @type { slime.time.exports.Month["last"] } */
				last: function(p) {
					/** @type { slime.time.Month } */
					var next = (p.month == 12) ? {
						year: p.year + 1,
						month: 1
					} : {
						year: p.year,
						month: p.month + 1
					};
					/** @type { slime.time.Date } */
					var first = {
						year: next.year,
						month: next.month,
						day: 1
					};
					return Date_add(first, -1);
				}
			},
			Timezone: zones,
			install: install,
			Day: Object.assign(
				Day,
				{
					order: order,
					Time: Day_Time
				}
			),
			Time: Object.assign(
				Time,
				{
					Zone: zones
				}
			),
			Year: Year,
			When: Object.assign(
				When,
				{
					order: order
				}
			)
		})
	}
//@ts-ignore
)($api,$context,$export)
