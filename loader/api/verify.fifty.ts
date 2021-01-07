namespace slime.definition.verify {
	type BooleanSubject = {
		is: {
			(t: boolean): void
			type: (name: string) => void
			not: (t: boolean) => void
		}
	}

	type ValueSubject<T> = {
		is: {
			(t: T): void
			type: (name: string) => void
			not: (t: T) => void
		}
		evaluate: any
	} & (
		T extends Array<any> ? { length: Subject<number> } : {}
	)

	type MethodSubject<T extends (...args: any) => any> = {
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

	export namespace Verify {
		/**
		 * An object that can execute {@link Context.Test}s.
		 */
		export type Context = (f: slime.definition.unit.Test) => void
	}

	/**
	 * Creates a {@link Verify} object that communicates with the given {@link Context}.
	 */
	export type Export = ( scope: Verify.Context ) => Verify
}