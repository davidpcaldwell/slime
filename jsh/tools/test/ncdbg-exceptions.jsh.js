//	Does "Pause on caught exceptions" work?
try {
	throw new Error();
} catch (e) {
}

//	What about pausing on *uncaught* exceptions?

var x = {};
x.foo();
