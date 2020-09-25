(
	function(
		$api: $api,
		tests: slime.fifty.test.tests,
		verify: slime.fifty.test.tests
	) {
		tests.impure = function() {
			var f1 = function(p) {
				p.number += 1;
			};
			var f2 = function(p) {
				p.number *= 2;
			};
			var f3 = function(p) {
				p.number -= 3;
			}
			var f = $api.Function.impure.compose(f1, f2, f3);
			var input = { number: 4 };
			var output = f(input);
			verify(output).number.is(7);

			var r1 = function(p) {
				return { number: 9 };
			};

			var r = $api.Function.impure.compose(f1, r1, f3);
			var rinput = { number: 4 };
			var routput = r(rinput);
			verify(routput).number.is(6);

		}

		tests.compare = function() {
			var array = [
				{ name: "a", value: 1 },
				{ name: "b", value: 0 },
				{ name: "c", value: 2 }
			];
			var comparator: $api.Function.Comparator<{ name: string, value: number }> = $api.Function.comparator.create(
				$api.Function.property("value"),
				$api.Function.comparator.operators
			);
			array.sort(comparator);
			verify(array)[0].name.is("b");
			verify(array)[1].name.is("a");
			verify(array)[2].name.is("c");
			array.sort($api.Function.comparator.reverse(comparator));
			verify(array)[0].name.is("c");
			verify(array)[1].name.is("a");
			verify(array)[2].name.is("b");

			var tiebreaking: $api.Function.Comparator<{ name: string, value: number, tiebreaker: number }> = $api.Function.comparator.create(
				$api.Function.property("tiebreaker"),
				$api.Function.comparator.operators
			);

			var multicomparator: $api.Function.Comparator<{ name: string, value: number, tiebreaker: number }> = $api.Function.comparator.compose(
				$api.Function.comparator.reverse(comparator),
				$api.Function.comparator.reverse(tiebreaking)
			);

			var multi = [
				{ name: "a", value: 1, tiebreaker: 2 },
				{ name: "b", value: 2, tiebreaker: 0 },
				{ name: "c", value: 1, tiebreaker: 3 },
				{ name: "d", value: 2, tiebreaker: 2 }
			].sort(multicomparator);

			verify(multi)[0].name.is("d");
			verify(multi)[1].name.is("b");
			verify(multi)[2].name.is("c");
			verify(multi)[3].name.is("a");
		}

		tests.suite = function() {
			run(tests.impure);
			run(tests.compare);
		}
	}
//@ts-ignore
)($api, tests, verify)
