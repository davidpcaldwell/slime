package inonit.tools;

public class Test {
	private static void doIt() {
		System.err.println("Under profiler.");
		Object lock = new Object();
		try {
			synchronized(lock) {
				lock.wait(100);
			}
		} catch (Throwable t) {
		}
	}
	
	private static Class load(String name) {
		try {
			return Class.forName(name);
		} catch (ClassNotFoundException e) {
			return null;
		}
	}
	
	private static void environment() {
		System.err.println(load("inonit.tools.Profiler"));
		System.err.println(load("javassist.Loader"));
		//jsh.shell.echo(String(Packages.java.lang.System.getProperties().get("inonit.tools.Profiler")))
	}
	
	public static void main(String[] args) {
		doIt();
		environment();
		System.err.println("Finishing profiled application.");
	}
}
