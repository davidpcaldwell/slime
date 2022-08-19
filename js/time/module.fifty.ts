//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.time {
	export namespace zone {
		export interface Time {
			year: number
			month: number
			day: number
			hour: number
			minute: number

			/**
			 * May be a decimal number including fractional seconds.
			 */
			second: number
		}
	}

	export interface Zone {
		/**
		 * Given a UNIX time, in milliseconds, returns the corresponding time in this time zone.
		 */
		local: (unixMilliseconds: number) => zone.Time

		/**
		 * Returns the UNIX time, in milliseconds, for the given time in this time zone.
		 */
		unix: (time: zone.Time) => number
	}

	export namespace context {
		/**
		 * Configuration of the Java context for this module. Allows the Calendar and TimeZone Java classes to be replaced, in
		 * scenarios where they are inaccessible but do not work. Unlikely to be needed; older versions of Google App Engine for
		 * Java restricted reflective access to these classes.
		 */
		export interface Java {
			Calendar?: slime.jrunscript.Packages["java"]["util"]["Calendar"]
			TimeZone?: slime.jrunscript.Packages["java"]["util"]["TimeZone"]
		}
	}

	export interface Context {
		zones?: {
			[id: string]: Zone
		}

		old?: {
			Day_month: boolean
		}

		java?: context.Java
	}

	export namespace test {
		export const { subject, old } = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			var jcontext: slime.loader.Script<context.Java,Context> = fifty.$loader.script("context.java.js");
			return {
				subject: (fifty.global.jsh) ? script(jcontext()) : script(),
				old: script({
					old: {
						Day_month: true
					}
				})
			};
		//@ts-ignore
		})(fifty);
	}

	export interface Day {
		year: number
		month: number
		day: number
	}

	export namespace old {
		/**
		 * @experimental Has other undocumented properties
		 */
		export interface Weekday {
			/**
			 * The full name of the weekday; e.g., `"MONDAY"`, `"WEDNESDAY"`.
			 */
			name: string
		}

		/**
		 * Represents a calendar year.
		 */
		export interface Year {
			value: number
		}

		export interface Day {
			year: Year
			month: Month
			day: number

			weekday: Weekday

			at: (time: any) => Time
			format(mask: string): string
			add(n: number): Day
			addMonths(n: number): Day
			addYears(n: number): Day
			isBefore(day: Day): boolean
			isAfter(day: Day): boolean

			/**
			 *
			 * @param day
			 * @returns `true` if the given `Day` is the same day as this `Day`; `false` otherwise.
			 */
			is(day: Day): boolean

			adapt: () => slime.time.Day
		}

		export interface Month {
			year: Year
			id: {
				index: number
			}
			/**
			 * @param n A day of the month.
			 */
			day: (n: number) => Day
		}

		export namespace day {
			export interface Time {
				hours: number
				minutes: number
				seconds: number
			}
		}

		export interface Time {
			day: Day
			format(mask: string): string
			local(zone?: Zone)
		}

		export interface When {
			unix: number
			local(): Time
			local(zone: any): Time
		}
	}

	export interface World {
		today: () => Day
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Day = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);


	export namespace exports {
		export interface Day {
			format: (mask: string) => (day: slime.time.Day) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const verify = fifty.verify;

				fifty.tests.Day.format = function() {
					var mar1: slime.time.Day = {
						year: 2009,
						month: 3,
						day: 1
					};

					var format = function(mask) {
						return test.subject.Day.format(mask)(mar1);
					}

					verify(format("yyyy mm dd")).is("2009 03 01");
					verify(format("yyyy/?m/?d")).is("2009/3/1");
					verify(format("Mmmm ?d, yyyy")).is("March 1, 2009");
					verify(format("Www Mmmm ?d, yyyy")).is("Sun March 1, 2009");
					verify(format("WWWWWW Mmmm ?d, yyyy")).is("SUNDAY March 1, 2009");
					verify(format("Wwwww Mmmm ?d, yyyy")).is("Sun March 1, 2009");
					verify(format("Wwwww Mmmm dd, yyyy")).is("Sun March 01, 2009");

					const subject = test.subject;
					fifty.run(function old() {
						var mar1 = new subject.Day(2009,3,1);
						const test = function(b) { return verify(b).is(true); }
						test(mar1.format("yyyy mm dd") == "2009 03 01");
						test(mar1.format("yyyy/?m/?d") == "2009/3/1");
						test(mar1.format("Mmmm ?d, yyyy") == "March 1, 2009");
						test(mar1.format("Www Mmmm ?d, yyyy") == "Sun March 1, 2009");
						test(mar1.format("WWWWWW Mmmm ?d, yyyy") == "SUNDAY March 1, 2009");
						test(mar1.format("Wwwww Mmmm ?d, yyyy") == "Sun March 1, 2009");
						test(mar1.format("Wwwww Mmmm dd, yyyy") == "Sun March 01, 2009");
					});
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace exports {
		export interface Day {
			/**
			 * @param year Year
			 * @param month Month (1 = January)
			 * @param day Day of Month
			 */
			new (year: number, month: number, day: number): old.Day
			new (p: Day): old.Day
			new (p: any): old.Day

			subtract: Function

			Time: new (hours: number, minutes: number, seconds?: number) => old.day.Time

			order: Function
			today: () => old.Day
			codec: {
				iso8601: {
					/**
					 * Encodes Day objects into strings, and decodes them from strings, using the ISO8601 extended format
					 * (YYYY-MM-DD).
					 */
					extended: slime.Codec<old.Day,string>
				}
				json: any
				js: any
			}
			rehydrate: (p: any) => old.Day
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.Day.old = {};
				fifty.tests.Day.old.constructor = function() {
					var nov1: slime.time.Day = {
						year: 2021,
						month: 11,
						day: 1
					};

					var day = new test.subject.Day(nov1);

					verify(day).year.value.is(2021);
					verify(day).month.id.index.is(11);
					verify(day).day.is(1);
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace exports {
		export interface Month {
			/**
			 * @param year A year.
			 * @param month A month, where 1 = January
			 */
			new (year: number, month: number): old.Month
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const api = test.subject;

				fifty.tests.Month = function() {
					fifty.run(function() {
						var novemberSecondNineteen = new api.Month(2019,11).day(2);
						verify(novemberSecondNineteen).year.value.is(2019);
						verify(novemberSecondNineteen).month.id.is(api.Year.Month.NOVEMBER);
						verify(novemberSecondNineteen).day.is(2);
					});

					fifty.run(function() {
						var novemberNineteen = new api.Month(2019,11);
						verify(novemberNineteen).year.value.is(2019);
						verify(novemberNineteen).id.is(api.Year.Month.NOVEMBER);

						var second = novemberNineteen.day(2);
						verify(second).year.value.is(2019);
						verify(second).month.id.is(api.Year.Month.NOVEMBER);
						verify(second).day.is(2);
					});
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export interface Exports {
		Year: {
			new (year: number): old.Year

			Month: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.Year = function() {
				var nineteen = new test.subject.Year(2019);
				verify(nineteen).value.is(2019);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.jsapi = fifty.test.Parent();

			const module = test.old;
			const api = test.subject;

			fifty.tests.jsapi.Day = (
				function() {
					var Day = module.Day;

					var leapday = new Day(2008,2,29);

					var leap09 = leapday.addYears(1);

					var oldmas = new module.Day(1958,7,30);
					var katemas = new api.Day(1958,7,30);

					const test = function(b: boolean) {
						verify(b).is(true);
					}

					return {
						year: function() {
							verify(katemas).year.value.is(1958);
						},
						month: function() {
							verify(katemas).month.year.value.is(1958);
							verify(katemas).month.id.is(api.Year.Month.JULY);
							verify(oldmas).month.is(module.Year.Month.JULY);
						},
						add: function() {
							var day = new api.Day(2019,11,1);
							var before = day.add(-1);
							var after = day.add(1);

							verify(before).year.value.is(2019);
							verify(before).month.id.is(api.Year.Month.OCTOBER);
							verify(before).day.is(31);

							verify(after).year.value.is(2019);
							verify(after).month.id.is(api.Year.Month.NOVEMBER);
							verify(after).day.is(2);
						},
						addMonths: function() {
							var date = new api.Day(2019,1,15);
							var after = date.addMonths(2);
							verify(after).year.value.is(2019);
							verify(after).month.id.is(api.Year.Month.MARCH);
							verify(after).day.is(15);
						},
						isBefore: function() {
							var day = new api.Day(2019,11,2);
							var before = day.add(-1);
							var after = day.add(1);

							verify(day).isBefore(before).is(false);
							verify(day).isBefore(after).is(true);
							verify(day).isBefore(day).is(false);
						},
						_1: function() {
							module.install();
							var Day = module.Day;
							var Year = module.Year;

							var day = new Day(2009,1,1);
							var jan2 = day.add(1);
							test(jan2.year.value == 2009);
							test(jan2.month == Year.Month.JANUARY);
							test(jan2.day == 2);
							var jan8 = day.add(7);
							test(jan8.year.value == 2009);
							test(jan8.month == Year.Month.JANUARY);
							test(jan8.day == 8);
							var feb1 = day.add(31);
							test(feb1.year.value == 2009);
							test(feb1.month == Year.Month.FEBRUARY);
							test(feb1.day == 1);
							var dec31 = day.add(-1);
							test(dec31.year.value == 2008);
							test(dec31.month == Year.Month.DECEMBER);
							test(dec31.day == 31);

							var jan31 = day.add(30);
							var feb31 = jan31.addMonths(1);
							test(feb31.year.value == 2009);
							test(feb31.month == Year.Month.FEBRUARY);
							test(feb31.day == 28);

							var feb3110 = jan31.addMonths(13);
							test(feb3110.year.value == 2010);
							test(feb3110.month == Year.Month.FEBRUARY);
							test(feb3110.day == 28);

							//	TODO	Promote into jsunit framework?
							var ExpectError = function(f) {
								var success;
								var messages = {};
								try {
									f();
									success = false;
									messages = { failure: "No error" };
								} catch (e) {
									success = true;
									messages = { success: "Correct: got error: " + e };
								}
								this.success = success;
								this.messages = messages;
							}

							var invalid: { success: boolean, messages: { failure?: string, success?: string } } =
								new ExpectError(function() { return new Day(2009,2,29) });
							verify(invalid).success.is(true);
							verify(invalid).messages.success.is.type("string");
							verify(invalid).messages.success.is(invalid.messages.success);


							var leapday = new Day(2008,2,29);

							var leap09 = leapday.addYears(1);
							test(leap09.year.value == 2009);
							test(leap09.month == Year.Month.FEBRUARY);
							test(leap09.day == 28);

							//@ts-ignore
							var converted = new Date(leap09);
							test(converted.getFullYear() == 2009);
							test(converted.getMonth() == 1);
							test(converted.getDate() == 28);
						},
						formatting: function() {
							var mar1 = leap09.add(1);

							var noon = new Day.Time(12,0);
							var mar1_noon = mar1.at(noon);
							var mar1_1pm = mar1.at(new Day.Time(13,0));
							var mar1_9am = mar1.at(new Day.Time(9,0));
							var mar1_901314am = mar1.at(new Day.Time(9,1,3.14));
							test(mar1_noon.format("yyyy mm dd hr:mi") == "2009 03 01 12:00");
							test(mar1_noon.format("yyyy mm dd hr:mipm") == "2009 03 01 12:00pm");
							test(mar1_1pm.format("yyyy mm dd hr:mipm") == "2009 03 01 01:00pm");
							test(mar1_1pm.format("yyyy mm dd hr:mipm") == "2009 03 01 01:00pm");
							test(mar1_9am.format("yyyy mm dd h:mipm") == "2009 03 01 9:00am");
							test(mar1_901314am.format("yyyy mm dd h:mi:sc.## pm") == "2009 03 01 9:01:03.14 am");

							var jul2 = new Day(2009,7,2);
							test(jul2.at(new Day.Time(13,0)).format("Www Mmmm ?d, yyyy") == "Thu July 2, 2009");
						},
						codec_js: function() {
							var leap09js = Day.codec.js.encode(leap09);
							test(leap09js.year == 2009);
							test(leap09js.month == 2);
							test(leap09js.day == 28);
							var leap09decode = Day.codec.js.decode(leap09js);
							test(leap09.is(leap09decode));

							var when = leap09.at(new Day.Time(12,30)).local();
							var copied = module.When.codec.js.decode(module.When.codec.js.encode(when));
							test(when.unix == copied.unix);
						},
						codec_iso8601: function() {
							var first = new Day(2019,1,1);
							var codec = Day.codec.iso8601.extended;

							verify(codec.encode(first)).is("2019-01-01");
							verify(codec.decode(codec.encode(first))).evaluate(function(day) {
								return day.is(first);
							}).is(true);
						}
					}
				}
			)();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Month: exports.Month
		Day: exports.Day
		Time: {
			new (): old.Time
			Zone: {
				[id: string]: Zone
			}
		}
		When: {
			new (p: { date: Date }): old.When
			new (p: { unix: number }): old.When
			new (date: Date): old.When
			new (): old.When
			codec: {
				rfc3339: slime.Codec<old.When,string>
				Date: slime.Codec<old.When,Date>
				js: any
			}
			order: Function
			now: () => old.When
		}
		java: object
		install: Function
		world: World
	}

	(
		function(
			fifty: slime.fifty.test.Kit,
			$loader: slime.Loader,
			verify: slime.fifty.test.verify,
			tests: slime.fifty.test.tests
		) {
			tests.suite = function() {
				var global = (function() { return this; })();
				var subject: slime.time.Exports = (global.jsh) ? $loader.module("module.js", $loader.file("context.java.js")) : $loader.module("module.js");
				//var subject: slime.time.Exports = $loader.module("module.js");

				var when = new subject.When({ unix: 1599143670821 });

				(function(when) {
					var rfc3339 = subject.When.codec.rfc3339.encode(when);
					var decoded = subject.When.codec.rfc3339.decode(rfc3339);
					verify(when).unix.is(decoded.unix);
				})(when);

				//	Got 1599187454916 from 2020-09-04T02:44:14.917Z
				var sample = "2020-09-04T02:44:14.917Z";
				var desired = 1599187454917;
				var decoded = subject.When.codec.rfc3339.decode(sample);
				verify(decoded).unix.is(desired);

				//	Got 1599188612109 from 2020-09-04T03:03:32.110Z
				var sample = "2020-09-04T03:03:32.110Z";
				var desired = 1599188612110;
				var decoded = subject.When.codec.rfc3339.decode(sample);
				verify(decoded).unix.is(desired);

				var sample = "2020-09-04T03:17:44.858Z";
				var desired = 1599189464858;
				var decoded = subject.When.codec.rfc3339.decode(sample);
				verify(decoded).unix.is(desired);

				var base = new subject.Day(2021,1,1).at(new subject.Day.Time(11,59)).local();
				var rounding = new subject.When({ unix: base.unix + 59750 });
				var formatted = rounding.local().format("yyyy-mm-dd HR:mi:sc");
				verify(formatted).is("2021-01-01 11:59:59");

				fifty.run(fifty.tests.Year);

				fifty.run(fifty.tests.Month);

				fifty.run(fifty.tests.Day);

				fifty.run(fifty.tests.jsapi);
			}

			if (fifty.global.jsh) fifty.tests.platforms = fifty.jsh.platforms(fifty);
		}
	//@ts-ignore
	)(fifty,$loader,verify,tests)

	export type Script = slime.loader.Script<Context,Exports>
}
