namespace slime.time {
	interface Day {
		year: any
	}

	namespace Day {
		interface Time {
		}
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
			new (): any
			order: Function
		}
		java: object
		install: Function
	}
}