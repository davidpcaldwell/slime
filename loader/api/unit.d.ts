namespace slime.definition.unit {
	namespace Verify {
		type Factory = {
			( scope: slime.definition.verify.Scope ): Verify
		}
	}

	type Verify = slime.definition.verify.Verify & {
		test: Function
		suite: Function
		scope: Function
		scenario: Function
		fire: Function
	}

	interface View {
		listen: (scenario: $api.Events) => void
		on: Event.Handler
	}

	namespace Event {
		namespace Scenario {
			type Start = {
				start: any
			}

			type End = {
				end: any
				success: boolean
			}

			type Detail = Start | End
		}

		namespace Test {
			type Detail = {
				success: boolean
				message: string
				error: any
			}
		}

		type Handler = $api.Events.Handler<{
			scenario: Event.Scenario.Detail
			test: Event.Test.Detail
		}>
	}

	namespace View {
		type Error = {
			type: string
			message: string
			stack: string
		}

		type Handler = {
			start: (scenario: {
				name: string
			}) => void

			test: (result: {
				success: boolean
				message: string
				error?: Error
			}) => void

			end: (
				scenario: {
					name: string
				},
				success: boolean
			) => void
		}

		type Listener = $api.Event.Handler<any>

		type Argument = Handler | Listener
	}

	interface Context {
		log: (message: string, p: any) => void,
		api: {
			Promise: () => PromiseConstructorLike & { all: Function, resolve: Function }
		}
	}

	interface Exports {
		Verify: (scope: any, vars?: any) => slime.definition.verify.Verify
		Suite: new (o: any) => { listeners: { add: (type: string, handler: Function) => void }, run: () => void, promise: () => void }
		View: {
			(o: View.Handler): View
			(f: View.Listener): View
		}
		getStructure: Function
		Scenario: new () => {}
		TestExecutionProcessor: Function
		JSON: {
			Encoder: (o: {
				send: (json: string) => void
			}) => View

			Decoder: () => {
				/**
				 * A property that allows listeners to be added to / removed from the underlying event emitter.
				 */
				listeners: $api.Events["listeners"]

				/**
				 * Fires the decoded event to this decoder's listeners.
				 */
				decode: (json: string) => void
			}
		}
	}
}