namespace slime.definition.verify {
	type BooleanSubject = {
		is: {
			(t: boolean): void
			type: (name: string) => void
			not: (t: boolean) => void
		}
	}

	/**
	 * Allows evaluating an arbitrary function with this subject's underlying value as an argument, and returning its result as a new
	 * {@link Subject}.
	 *
	 * The new subject also has the ability to test for errors thrown during the operation. One can test for:
	 * * `.threw`, which returns the thrown object (probably an `Error`), as the subject, allowing it to be asserted upon.
	 * * `.threw.type(type)`, which asserts that a subtype of `type` was thrown
	 * * `.threw.nothing()`, which asserts that nothing was thrown.
	 */
	type evaluate = any

	type ValueSubject<T> = {
		is: {
			/**
			 * Asserts that the subject value is === to the given value.
			 */
			(t: T): void
			type: (name: string) => void
			not: (t: T) => void
		}

		evaluate: evaluate
		//	TODO	should refine in this sequence:
		//	evaluate: {
		//		(f: (t: T) => any): any
		//		property: any
		//	}
		//	... then the following more precise functions
		//	(f: (t: T) => any): any
		//	<R>(f: (t: T) => R): any
		//	<R>(f: (t: T) => R) => Subject<R>
		//	... also need a refinement for evaluate.property
		//	... but any of this would require some cleanup, they cause ascending numbers of errors currently
	} & (
		T extends Array<any> ? { length: Subject<number> } : {}
	)

	type MethodSubject<T extends (...args: any) => any> = {
		//	TODO	could we build the .threw stuff into MethodSubject as well?
		(...p: Parameters<T>): Subject<ReturnType<T>>
	}

	type Subject<T> = (
		(
			T extends Boolean
			? BooleanSubject
			: (
				T extends (...args: any) => any
				? MethodSubject<T>
				: ValueSubject<T>
			)
		)
		& { [K in keyof T]: Subject<T[K]> }
	)

	/**
	 * A function that returns a {@link Subject}, which supports a convenient API for making assertions about a subject value.
	 */
	export type Verify = {
		<T>(value: boolean, name?: string, lambda?: (it: BooleanSubject) => void): BooleanSubject
		<T>(value: T, name?: string, lambda?: (it: Subject<T>) => void): Subject<T>
	}

	/**
	 * An object that can execute {@link Context.Test}s.
	 */
	export type Context = (f: slime.definition.unit.Test) => void

	/**
	 * Creates a {@link Verify} object that communicates with the given {@link Context}.
	 */
	export type Export = ( scope: Context ) => Verify
}