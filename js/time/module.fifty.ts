//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.time {
	export interface Date {
		year: number
		month: number
		day: number
	}

	export interface Time {
		hour: number
		minute: number

		/**
		 * May be a decimal number including fractional seconds.
		 */
		second: number
	}

	export interface Datetime extends Date, Time {
	}

	export namespace zone {
		export interface Time extends Datetime {
			zone: string
		}
	}

	export interface Zone {
		/**
		 * Given a UNIX time, in milliseconds, returns the corresponding time in this time zone.
		 */
		local: (unixMilliseconds: number) => Datetime

		/**
		 * Returns the UNIX time, in milliseconds, for the given time in this time zone.
		 */
		unix: (time: Datetime) => number
	}

	export interface Context {
		/**
		 * A function that returns the number of milliseconds since the UNIX epoch. If not supplied, the standard JavaScript
		 * implementation will be used.
		 */
		now?: slime.$api.fp.impure.External<number>

		zones?: {
			[id: string]: Zone
		}
	}

	export namespace test {
		export const { subject, load } = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			var context: Context = (
				function() {
					if (fifty.global.window) return fifty.$loader.module("context.browser.js");
					if (fifty.global.jsh) return fifty.$loader.module("context.java.js");
				}
			)();
			return {
				subject: script(context),
				load: function(context: Context) {
					return script(context);
				}
			};
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.Timezone = function() {
				fifty.run(function zones() {
					verify(test.subject).Timezone.local.is.type("object");
					verify(test.subject).Timezone.UTC.is.type("object");
				});

				verify(Object.keys(test.subject.Timezone).join(" "), "Timezones").is(Object.keys(test.subject.Timezone).join(" "));

				var depart: Datetime = { year: 2025, month: 1, day: 5, hour: 17, minute: 30, second: 40 };
				var instant = test.subject.Timezone["Pacific/Honolulu"].unix(depart);

				(
					function(datetime,zone) {
						var date = new Date(datetime.year, datetime.month-1, datetime.day, datetime.hour, datetime.minute, datetime.second);
						verify(date,"date").is(date);
						var stringed = date.toLocaleString("en-US", { timeZone: zone });
						verify(stringed,"stringed").is(stringed);
						var rv = new Date(stringed);
					}
				)(depart, "Pacific/Honolulu");

				verify(instant, "unix time").is(instant);
				var converted = test.subject.Timezone["America/New_York"].local(instant);
				verify(converted).year.is(2025);
				verify(converted).month.is(1);
				verify(converted).day.is(5);
				verify(converted).hour.is(22);
				verify(converted).minute.is(30);
				verify(converted).second.is(40);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.Value = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Functions that pertain to "time values", as defined by the ECMAScript
		 * [specification](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-time-values-and-time-range), representing
		 * the number of milliseconds since the epoch (January 1, 1970, midnight, UTC).
		 */
		Value: exports.Values
	}

	export namespace exports {
		export interface Values {
			/**
			 * Returns the current <dfn>time value</dfn>.
			 */
			now: slime.$api.fp.impure.External<slime.external.lib.es5.TimeValue>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { load } = test;

				fifty.tests.exports.Value.now = function() {
					var context: Context = {
						now: function() {
							return 1000;
						}
					};

					var configured = test.load(context);

					verify(configured).Value.now().is(1000);

					var defaulted = test.subject;

					verify(defaulted).Value.now().is.type("number");

					var now = defaulted.Value.now();
					verify(now).is(now);
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Date: exports.Dates
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Date = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Dates {
			input: {
				today: slime.$api.fp.impure.Input<slime.time.Date>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.Date.today = function() {
				var subject = test.load({
					now: $api.fp.returning(1643907600000)
				});
				var today = subject.Date.input.today();
				verify(today, "today", function(it) {
					it.year.is(2022);
					it.month.is(2);
					it.day.is(3);
				})
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface Dates {
			from: {
				ymd: (year: number, month: number, day: number) => Date
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.Date.from = function() {
					var leap = test.subject.Date.from.ymd(2024,2,29);

					verify(leap).year.is(2024);
					verify(leap).month.is(2);
					verify(leap).day.is(29);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Dates {
			/**
			 * Given a {@link Date}, returns a {@link slime.$api.fp.Predicate | Predicate} that represents whether a given
			 * `Date` is the same `Date`.
			 */
			is: (date: Date) => slime.$api.fp.Predicate<Date>

			/**
			 * Given a {@link Date}, returns a {@link slime.$api.fp.Predicate | Predicate} that represents whether a given
			 * `Date` is after that `Date`.
			 */
			isAfter: (date: Date) => slime.$api.fp.Predicate<Date>

			/**
			 * Given a {@link Date}, returns a {@link slime.$api.fp.Predicate | Predicate} that represents whether a given
			 * `Date` is before that `Date`.
			 */
			isBefore: (date: Date) => slime.$api.fp.Predicate<Date>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				var ymd = test.subject.Date.from.ymd;
				var leap = ymd(2024,2,29);

				var feb28 = ymd(2024,2,28);
				var mar1 = ymd(2024,3,1);

				fifty.tests.Date.is = function() {
					var isLeap = test.subject.Date.is(leap);

					var same = ymd(2024,2,29);

					verify(feb28).evaluate(isLeap).is(false);
					verify(same).evaluate(isLeap).is(true);
					verify(mar1).evaluate(isLeap).is(false);
				};

				fifty.tests.Date.isAfter = function() {
					var isAfterLeap = test.subject.Date.isAfter(leap);

					verify(feb28).evaluate(isAfterLeap).is(false);
					verify(mar1).evaluate(isAfterLeap).is(true);
				};

				fifty.tests.Date.isBefore = function() {
					var isBefore = test.subject.Date.isBefore(leap);

					verify(feb28).evaluate(isBefore).is(true);
					verify(mar1).evaluate(isBefore).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Dates {
			format: (mask: string) => (day: slime.time.Date) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const verify = fifty.verify;

				fifty.tests.Date.format = function() {
					var mar1: slime.time.Date = {
						year: 2009,
						month: 3,
						day: 1
					};

					var format = function(mask) {
						return test.subject.Date.format(mask)(mar1);
					}

					verify(format("yyyy mm dd")).is("2009 03 01");
					verify(format("yyyy/?m/?d")).is("2009/3/1");
					verify(format("Mmmm ?d, yyyy")).is("March 1, 2009");
					verify(format("Www Mmmm ?d, yyyy")).is("Sun March 1, 2009");
					verify(format("WWWWWW Mmmm ?d, yyyy")).is("SUNDAY March 1, 2009");
					verify(format("Wwwww Mmmm ?d, yyyy")).is("Sun March 1, 2009");
					verify(format("Wwwww Mmmm dd, yyyy")).is("Sun March 01, 2009");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Dates {
			offset: (offset: number) => (day: slime.time.Date) => slime.time.Date
			after: (day: slime.time.Date) => (offset: number) => slime.time.Date

			months: {
				offset: (offset: number) => (day: slime.time.Date) => slime.time.Date
				after: (date: slime.time.Date) => (offset: number) => slime.time.Date
			}

			years: {
				offset: (offset: number) => (day: slime.time.Date) => slime.time.Date
				after: (date: slime.time.Date) => (offset: number) => slime.time.Date
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.Date.add = function() {
					var day = {
						year: 2019,
						month: 11,
						day: 1
					};

					var yesterday = test.subject.Date.offset(-1);
					var tomorrow = test.subject.Date.offset(1);
					var add = test.subject.Date.after(day);

					var before = yesterday(day);
					var after = tomorrow(day);

					verify(before).year.is(2019);
					verify(before).month.is(10);
					verify(before).day.is(31);

					verify(after).year.is(2019);
					verify(after).month.is(11);
					verify(after).day.is(2);

					var plus = add(1);
					var minus = add(-1);

					verify(minus).year.is(2019);
					verify(minus).month.is(10);
					verify(minus).day.is(31);

					verify(plus).year.is(2019);
					verify(plus).month.is(11);
					verify(plus).day.is(2);
				};

				fifty.tests.Date.months = function() {
					var date: slime.time.Date = {
						year: 2019,
						month: 1,
						day: 15
					};

					var after = test.subject.Date.months.offset(2)(date);
					verify(after).year.is(2019);
					verify(after).month.is(3);
					verify(after).day.is(15);

					var after2 = test.subject.Date.months.after(date)(2);
					verify(after2).year.is(2019);
					verify(after2).month.is(3);
					verify(after2).day.is(15);

					var before = test.subject.Date.months.offset(-2)(date);
					verify(before).year.is(2018);
					verify(before).month.is(11);
					verify(before).day.is(15);

					var before2 = test.subject.Date.months.after(date)(-2);
					verify(before2).year.is(2018);
					verify(before2).month.is(11);
					verify(before2).day.is(15);
				};

				fifty.tests.Date.years = function() {
					var date1: slime.time.Date = {
						year: 2020,
						month: 2,
						day: 29
					};

					var date2: slime.time.Date = {
						year: 2020,
						month: 2,
						day: 28
					};

					var date3: slime.time.Date = {
						year: 2020,
						month: 3,
						day: 1
					};

					var next1 = test.subject.Date.years.after(date1)(1);
					verify(next1).year.is(2021);
					verify(next1).month.is(2);
					verify(next1).day.is(28);


					var next2 = test.subject.Date.years.after(date2)(1);
					verify(next2).year.is(2021);
					verify(next2).month.is(2);
					verify(next2).day.is(28);


					var next3 = test.subject.Date.years.after(date3)(1);
					verify(next3).year.is(2021);
					verify(next3).month.is(3);
					verify(next3).day.is(1);


					var next1leap = test.subject.Date.years.after(date1)(4);
					verify(next1leap).year.is(2024);
					verify(next1leap).month.is(2);
					verify(next1leap).day.is(29);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Dates {
			order: {
				js: (a: slime.time.Date, b: slime.time.Date) => number
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.Date.order = function() {
					var unordered: slime.time.Date[] = [
						{ year: 2018, month: 2, day: 2 },
						{ year: 2018, month: 1, day: 1 },
						{ year: 2018, month: 2, day: 1 },
						{ year: 2017, month: 1, day: 1 }
					];

					var ordered = unordered.sort(test.subject.Date.order.js);

					var verifyDate = function(index: number, year: number, month: number, day: number) {
						var target = ordered[index];
						verify(target).year.is(year);
						verify(target).month.is(month);
						verify(target).day.is(day);
					}

					verifyDate(0, 2017, 1, 1);
					verifyDate(1, 2018, 1, 1);
					verifyDate(2, 2018, 2, 1);
					verifyDate(3, 2018, 2, 2);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export type DayOfWeek = "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su"

	export namespace exports {
		export interface Dates {
			dayOfWeek: (date: slime.time.Date) => DayOfWeek
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.Date.dayOfWeek = function() {
					var date: slime.time.Date = {
						year: 2023,
						month: 3,
						day: 8
					};

					var day = test.subject.Date.dayOfWeek(date);

					verify(day).evaluate(String).is("We");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Dates {
			month: (date: slime.time.Date) => slime.time.Month
		}
	}

	export interface Month {
		year: number
		month: number
	}

	export namespace exports {
		export interface Month {
			last: (month: slime.time.Month) => slime.time.Date
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.exports.Month = fifty.test.Parent();

				fifty.tests.exports.Month.last = function() {
					var feb23 = test.subject.Month.last({
						year: 2023,
						month: 2
					});
					var feb24 = test.subject.Month.last({
						year: 2024,
						month: 2
					});
					verify(feb23,"2023feb.last",function(it) {
						it.year.is(2023);
						it.month.is(2);
						it.day.is(28);
					});
					verify(feb24,"2024feb.last",function(it) {
						it.year.is(2024);
						it.month.is(2);
						it.day.is(29);
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Month: exports.Month
	}

	export interface Exports {
		Timezone: {
			local: Zone
			UTC: Zone
			[x: string]: Zone
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Date);

				fifty.run(fifty.tests.Timezone);

				fifty.load("old.fifty.ts");
			}

			fifty.test.platforms();
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context|void,Exports>
}
