//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.$api.fp.mapping {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
			fifty.tests.exports.mapping = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		from: {
			value: <P,R>(r: R) => (p: P) => R
			thunk: <P,R>(thunk: fp.Thunk<R>) => Mapping<P,R>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.mapping.from = function() {
				const value = 2;
				const thunkValue = 3;

				const byValue = $api.fp.Mapping.from.value(value);
				const byThunk = $api.fp.Mapping.from.thunk( () => thunkValue );

				verify(byValue(8)).is(value);
				verify(byValue(10)).is(value);
				verify(byThunk(9)).is(thunkValue);
				verify(byThunk(11)).is(thunkValue);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/** @deprecated Use `from.value()`. */
		all: <P,R>(r: R) => (p: P) => R
	}

	export interface Exports {
		thunk: <P,R>(p: P) => (p: fp.Mapping<P,R>) => Thunk<R>

		now: <P,R>(p: P) => (p: fp.Mapping<P,R>) => R
	}

	export interface Exports {
		/**
		 * Given a {@link mapping}, creates a `Mapping` that, given an argument, returns a {@link Thunk} that will, when
		 * invoked, invoke the underlying mapping with that argument and return the result.
		 */
		thunks: <P,R>(p: fp.Mapping<P,R>) => fp.Mapping<P,Thunk<R>>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.mapping.thunks = function() {
				var double: fp.Mapping<number,number> = (n: number) => n*2;

				var t1 = $api.fp.Mapping.thunks(double)(2);

				verify(t1()).is(4);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		applyResultWith: <T,P,R>(p: P) => (f: (t: T) => slime.$api.fp.Mapping<P,R>) => slime.$api.fp.Mapping<T,R>
	}

	export interface Exports {
		properties: <P,R>(p: {
			[k in keyof R]: (p: P) => R[k]
		}) => (p: P) => R
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.exports.mapping.properties = function() {
				var x = $api.fp.now.map(
					2,
					$api.fp.Mapping.properties({
						single: function(d) { return d; },
						double: function(d) { return d*2 },
						triple: function(d) { return d*3 }
					})
				);

				verify(x).single.is(2);
				verify(x).double.is(4);
				verify(x).triple.is(6);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Given a Mapping invocation (consisting of a mapping and an argument), return the result of the mapping for the
		 * argument.
		 *
		 * This function can be useful when running a function pipeline that is computing a function to execute and an argument
		 * to that function separately in order to invoke the function with the argument.
		 */
		invoke: <P,R>(p: {
			mapping: slime.$api.fp.Mapping<P,R>
			argument: P
		}) => R
	}
}

namespace slime.$api.fp.internal.mapping {
	export interface Context {
		deprecate: slime.$api.fp.internal.Context["deprecate"]
	}

	export interface Exports {
		Mapping: slime.$api.fp.Exports["Mapping"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
