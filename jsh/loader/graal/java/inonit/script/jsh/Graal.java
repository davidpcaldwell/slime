package inonit.script.jsh;

import inonit.script.engine.*;

public class Graal extends Main.Engine {
	private static class ExecutionImpl extends Shell.Execution {
		ExecutionImpl(Shell shell, boolean top) {
			super(shell);
		}
		
		@Override public void script(Code.Loader.Resource script) {
			throw new UnsupportedOperationException();
		}

		@Override public Integer run() {
			throw new UnsupportedOperationException();
		}
		
		@Override public void setJshHostProperty() {
			throw new UnsupportedOperationException();
		}
		
		@Override public void setGlobalProperty(String string, Object object) {
			throw new UnsupportedOperationException();
		}
		
		@Override protected Loader.Classes.Interface getClasspath() {
			throw new UnsupportedOperationException();
		}
	}
	
	public void main(Shell.Container context, Shell shell) throws Shell.Invocation.CheckedException {
		Shell.Execution execution = new ExecutionImpl(shell, true);
		Integer rv = execution.execute();
		if (rv == null) {
		} else if (rv.intValue() == 0) {
		} else {
			context.exit(rv.intValue());
		}
	}

	public static void main(String[] args) throws Shell.Invocation.CheckedException {
		Main.cli(new Graal(), args);
	}
}