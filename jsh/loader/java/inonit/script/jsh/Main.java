package inonit.script.jsh;

public class Main {
	private Main() {
	}
	
	public static void initialize() {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Thread.currentThread().setUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
			public void uncaughtException(Thread t, Throwable e) {
				Throwable error = e;
				java.io.PrintWriter writer = new java.io.PrintWriter(System.err,true);
				while(error != null) {
					writer.println(error.getClass().getName() + ": " + error.getMessage());
					StackTraceElement[] trace = error.getStackTrace();
					for (StackTraceElement line : trace) {
						writer.println("\t" + line);
					}
					error = error.getCause();
					if (error != null) {
						writer.print("Caused by: ");
					}
				}
			}
		});		
	}
}
