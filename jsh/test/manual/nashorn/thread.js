load("nashorn:mozilla_compat.js");
var thread = new JavaAdapter(
	Packages.java.lang.Runnable,
	{
		run: function() {
			for (var i=0; i<10; i++) {
				Packages.java.lang.System.err.println("i = " + i);
				Packages.java.lang.Thread.sleep(500);
			}
		}
	}
);
new Packages.java.lang.Thread(thread).start();
Packages.java.lang.System.err.println("Started.");
