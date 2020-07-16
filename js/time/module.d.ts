namespace slime.time {
	interface Day {
		year: any
	}

	namespace Day {
		interface Time {
		}
	}

	interface Time {
		format(mask: string): string
	}

	interface When {
		unix: number
		local(): Time
	}

	interface Context {
		zones: object
		old: {
			Day_month: boolean
		}
		java: object
	}

	interface Exports {
		Year: Function
		Month: Function
		Day: {
			new (p: any): slime.time.Day
			Time: new (hours: number, minutes: number) => Day.Time
			subtract: Function
			order: Function
		}
		Time: {
			new (): slime.time.Time
			Zone: object
		}
		When: {
			new (): When
			new (date: Date): When
			codec: {
				rfc3339: slime.Codec<When,string>
			}
			order: Function
		}
		java: object
		install: Function
	}
}