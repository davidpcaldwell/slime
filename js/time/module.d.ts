namespace slime.time {
	interface Day {
		year: any
		at: Function
		format(mask: string): string
		month: any
		day: any
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
			new (year: number, month: number, day: number): slime.time.Day
			new (p: any): slime.time.Day
			Time: new (hours: number, minutes: number) => Day.Time
			subtract: Function
			order: Function
			today: () => Day
			codec: {
				iso8601: {
					extended: slime.Codec<Day,string>
				}
			}
		}
		Time: {
			new (): slime.time.Time
			Zone: object
		}
		When: {
			new (p: { date: Date }): When
			new (p: { unix: number }): When
			new (date: Date): When
			new (): When
			codec: {
				rfc3339: slime.Codec<When,string>
				Date: slime.Codec<When,Date>
			}
			order: Function
			now: () => When
		}
		java: object
		install: Function
	}
}