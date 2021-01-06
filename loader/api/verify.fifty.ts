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

	export type Verify = {
		<T>(value: boolean, name?: string, lambda?: (it: BooleanSubject) => void): BooleanSubject
		<T>(value: T, name?: string, lambda?: (it: Subject<T>) => void): Subject<T>
	}

	export namespace Scope {
		export type Test = {
			(): Test.Result
		}

		export namespace Test {
			export interface Result {
				success: boolean
				error?: any
				message: string
			}
		}
	}

	export interface Scope {
		test: (f: Scope.Test) => void
	}

	export type Factory = {
		( scope: Scope ): Verify
	}
}