package inonit.script.rhino;

import java.io.*;
import java.util.*;

import org.mozilla.javascript.*;

public class Errors extends RuntimeException {
	public static Errors get(Context context) {
		if (context == null) throw new RuntimeException("'context' must not be null.");
		if (context.getErrorReporter() instanceof Errors.ErrorReporterImpl) {
			return ((Errors.ErrorReporterImpl)context.getErrorReporter()).getErrors();
		} else {
			return null;
		}
	}

	private ArrayList<ScriptError> errors = new ArrayList<ScriptError>();
	private ErrorReporterImpl reporter = new ErrorReporterImpl();

	List<ScriptError> errors() {
		return errors;
	}

	class ErrorReporterImpl implements ErrorReporter {
		public void warning(String string, String string0, int i, String string1, int i0) {
			errors.add(new ScriptError(ScriptError.Type.WARNING, string, string0, i, string1, i0, null));
		}

		public EvaluatorException runtimeError(String string, String string0, int i, String string1, int i0) {
			if (errors == null) throw new RuntimeException("errors is null.");
			errors.add(new ScriptError(ScriptError.Type.RUNTIME, string, string0, i, string1, i0, null));
			return new EvaluatorException(string, string0, i, string1, i0);
		}

		public void error(String string, String string0, int i, String string1, int i0) {
			errors.add(new ScriptError(ScriptError.Type.ERROR, string, string0, i, string1, i0, null));
		}

		Errors getErrors() {
			return Errors.this;
		}
	}

	ErrorReporterImpl getErrorReporter() {
		return reporter;
	}

	private void emitErrorMessage(Engine.Log err, String prefix, ScriptError e) {
		err.println(prefix + e.getSourceName() + ":" + e.getLineNumber() + ": " + e.getMessage());
		String errCaret = "";
		//	TODO	This appears to be null even when it should not be.
		if (e.getLineSource() != null) {
			for (int i=0; i<e.getLineSource().length(); i++) {
				char c = e.getLineSource().charAt(i);
				if (i < e.getColumn()-1) {
					if (c == '\t') {
						errCaret += "\t";
					} else {
						errCaret += " ";
					}
				} else if (i == e.getColumn()-1) {
					errCaret += "^";
				}
			}
			err.println(prefix + e.getLineSource());
			err.println(prefix + errCaret);
		}
		if (e.getStackTrace() != null) {
			err.println(e.getStackTrace());
		}
		err.println();
	}

	public void dump(Engine.Log err, String prefix) {
		err.println();
		err.println(prefix + "Script halted because of " + errors.size() + " errors.");
		err.println();
		for (int i=0; i<errors.size(); i++) {
			emitErrorMessage(err, prefix, errors.get(i));
		}
	}

	public void reset() {
		this.errors = new ArrayList<ScriptError>();
	}

	public ScriptError[] getErrors() {
		return this.errors.toArray(new ScriptError[0]);
	}

	private void addRhino(RhinoException e) {
		errors.add(new ScriptError(ScriptError.Type.RUNTIME, e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber(), e));
	}

	public void add(EcmaError e) {
		addRhino(e);
	}

	public void add(EvaluatorException e) {
		addRhino(e);
	}

	public void add(JavaScriptException e) {
		//	Thought about writing a separate method to construct ScriptError with no Throwable, under the theory that perhaps
		//	we would not want to dump a stack trace in this case (JavaScript throw keyword).  But decided in the end that
		//	stack traces are useful things, and if we want them for ordinary Java exceptions, JavaScript exceptions should
		//	qualify, too.
		addRhino(e);
	}

	public static class ScriptError {
		public static class Type {
			public static final Type RUNTIME = new Type();
			public static final Type ERROR = new Type();
			public static final Type WARNING = new Type();

			private Type() {
			}
		}

		private Type type;
		private String message;
		private String sourceName;
		private int line;
		private String lineSource;
		private int offset;
		private Throwable t;

		ScriptError(Type type, String message, String sourceName, int line, String lineSource, int offset, Throwable t) {
			this.type = type;
			this.message = message;
			this.sourceName = sourceName;
			this.line = line;
			this.lineSource = lineSource;
			this.offset = offset;
			this.t = t;
		}

		public String toString() {
			return getClass().getName() + " message=" + message + " sourceName=" + sourceName + " line=" + line;
		}

		public boolean is(Type type) {
			return this.type == type;
		}

		public String getSourceName() {
			return sourceName;
		}

		public int getLineNumber() {
			return line;
		}

		public String getLineSource() {
			return lineSource;
		}

		public int getColumn()  {
			return offset;
		}

		public String getMessage() {
			return message;
		}

		public String getStackTrace() {
			//	TODO	This implementation would be much easier with programmatic access to Rhino stack traces...
			if (t == null) return null;
			StringWriter s = new StringWriter();
			PrintWriter p = new PrintWriter(s, true);
			t.printStackTrace(p);
			String topStack = s.toString();
			if (topStack.indexOf("Caused by:") != -1) {
				topStack = topStack.substring(0, topStack.indexOf("Caused by:"));
			}
			s = new StringWriter();
			p = new PrintWriter(s, true);
			p.print(topStack);
			Throwable target = t.getCause();
			while(target != null) {
				p.println("Caused by: " + target.getClass().getName() + ": " + target.getMessage());
				for (int i=0; i<target.getStackTrace().length; i++) {
					StackTraceElement e = target.getStackTrace()[i];
					p.println("\tat " + e);
				}
				target = target.getCause();
				if (target != null) {
					p.print("Caused by: ");
				}
			}
			return s.toString();
		}

		public Throwable getThrowable() {
			return t;
		}
	}
}
