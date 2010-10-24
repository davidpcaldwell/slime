package inonit.system;

public class Subprocess {
	public static abstract class Listener {
		public abstract void interrupted(InterruptedException e);
		public abstract void finished(int status);
	}

	private Process p;

	Subprocess(Process p) {
		this.p = p;
	}
	
	public void wait(Listener listener) {
		try {
			int status = p.waitFor();
			listener.finished(status);
		} catch (InterruptedException e) {
			listener.interrupted(e);
		}
	}

	public void terminate() {
		p.destroy();
	}
}
