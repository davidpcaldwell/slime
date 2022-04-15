//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.time {
	export interface Day {
		year: number
		month: number
		day: number
	}

	export namespace old {
		export interface Day {
			year: {
				value: number
			}
			at: Function
			format(mask: string): string
			month: Month
			day: number
			add(n: number): Day
			addMonths(n: number): Day
			addYears(n: number): Day
			isAfter(day: Day): boolean

			/** @experimental Has other undocumented properties */
			weekday: {
				/**
				 * The full name of the weekday; e.g., `"MONDAY"`, `"WEDNESDAY"`.
				 */
				name: string
			}
			adapt: () => slime.time.Day
		}

		export interface Month {
			id: {
				index: number
			}
			day: (n: number) => Day
		}

		export namespace day {
			export interface Time {
			}
		}

		export interface Time {
			day: any
			format(mask: string): string
		}

		export interface When {
			unix: number
			local(): Time
			local(zone: any): Time
		}
	}

	export interface Context {
		zones: object
		old: {
			Day_month: boolean
		}
		java: object
	}

	export namespace test {
		export const subject: Exports = (
			function(fifty: slime.fifty.test.kit) {
				return fifty.$loader.module("module.js");
			}
		//@ts-ignore
		)(fifty);
	}

	export interface World {
		today: () => Day
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.Day = function() {
				fifty.run(fifty.tests.Day.format);
			};
		}
	//@ts-ignore
	)(fifty);


	export namespace exports {
		export interface Day {
			format: (mask: string) => (day: slime.time.Day) => string
		}

		(
			function(
				fifty: slime.fifty.test.kit
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

	export interface Exports {
	}

	export namespace exports {
		export interface Day {
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
	}

	export interface Exports {
		Year: Function
		Month: Function
		Day: exports.Day
		Time: {
			new (): old.Time
			Zone: object
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
			fifty: slime.fifty.test.kit,
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

				fifty.run(fifty.tests.Day);

				fifty.run(fifty.tests.Day.old.constructor);
			}
		}
	//@ts-ignore
	)(fifty,$loader,verify,tests)
}
