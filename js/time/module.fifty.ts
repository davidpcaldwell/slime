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
			Time: new (hours: number, minutes: number) => old.day.Time
			subtract: Function
			order: Function
			today: () => old.Day
			codec: {
				iso8601: {
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

				fifty.tests.Day.old.jsapi = (
					function() {
						const module = test.old;
						const api = test.subject;

						var Day = module.Day;

						var leapday = new Day(2008,2,29);

						var leap09 = leapday.addYears(1);

						var oldmas = new module.Day(1958,7,30);
						var katemas = new api.Day(1958,7,30);

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
							}
						}
					}
				)();
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
			}

			if (fifty.global.jsh) fifty.tests.platforms = fifty.jsh.platforms(fifty);
		}
	//@ts-ignore
	)(fifty,$loader,verify,tests)

	export type Script = slime.loader.Script<Context,Exports>
}
