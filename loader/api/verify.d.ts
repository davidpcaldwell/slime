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
		T extends Array ? { length: Subject<number> } : {}
	)

	type MethodSubject<T> = {
		(...p: Parameters<T>): Subject<ReturnType<T>>
	}

	type Subject<T> = (
		(
			T extends Boolean
			? BooleanSubject
			: (
				T extends Function
				? MethodSubject<T>
				: ValueSubject<T>
			)
		)
		& { [K in keyof T]: Subject<T[K]> }
	)

	type Verify = {
		<T>(value: boolean, name?: string): BooleanSubject
		<T>(value: T, name?: string): Subject<T>
	}

	namespace Scope {
		type Test = {
			(): { success: boolean, message: string }
		}
	}

	interface Scope {
		test: (f: Scope.Test) => void
	}

	type Factory = {
		( scope: Scope ): Verify
	}

	interface Exports {
		Verify: Factory
	}
}