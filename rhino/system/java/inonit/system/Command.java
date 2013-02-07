//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;
import java.util.*;

public class Command {
	public static abstract class Context {
		public abstract OutputStream getStandardOutput();
		public abstract OutputStream getStandardError();
		public abstract InputStream getStandardInput();
		public abstract Map getSubprocessEnvironment();
		public abstract File getWorkingDirectory();

		final String[] envp() {
			String[] env = null;
			Map envMap = getSubprocessEnvironment();
			if (envMap != null) {
				ArrayList list = new ArrayList();
				Iterator i = envMap.keySet().iterator();
				while(i.hasNext()) {
					Object next = i.next();
					if (!(next instanceof String)) {
						throw new RuntimeException("Environment variable name is not a string, but " + next);
					}
					String name = (String)next;
					Object value = envMap.get(name);
					if (!(value instanceof String)) {
						throw new RuntimeException("Environment variable value for " + name + " is not a string, but " + value);
					}
					list.add(name + "=" + value);
				}
				env = (String[])list.toArray(new String[0]);
			}
			return env;
		}
	}

	public static abstract class Configuration {
		static Configuration create(final String path, final String[] arguments) {
			return new Configuration() {
				public final String getCommand() {
					return path;
				}
				
				public final String[] getArguments() {
					return arguments;
				}
			};
		}
		
		public abstract String getCommand();
		public abstract String[] getArguments();

		final String[] cmdarray() {
			ArrayList args = new ArrayList();
			String program = getCommand();
			String[] arguments = getArguments();
			args.add(program);
			for (int i=0; i<arguments.length; i++) {
				args.add(arguments[i]);
			}
			return (String[])args.toArray(new String[0]);
		}
	}

	public static abstract class Listener {
		static final Listener LISTEN = new Listener() {
			@Override public void finished() {
			}

			@Override public void threw() {
			}
		};
		
		private Integer status;
		private IOException threw;
		
		final void finished(int status) {
			this.status = new Integer(status);
			this.finished();
		}
		
		final void threw(IOException e) {
			this.threw = e;
		}

		public final Integer getExitStatus() {
			return status;
		}
		
		public final IOException getLaunchException() {
			return threw;
		}
		
		public abstract void finished();
		public abstract void threw();
	}

	public static class Result {
		private static class ContextImpl extends Context {
			private ByteArrayOutputStream out = new ByteArrayOutputStream();
			private ByteArrayOutputStream err = new ByteArrayOutputStream();

			private InputStream in = new ByteArrayInputStream(new byte[0]);

			private File working = null;
			private Map environment = null;

			public File getWorkingDirectory() {
				return working;
			}

			public Map getSubprocessEnvironment() {
				return environment;
			}

			public OutputStream getStandardOutput() {
				return out;
			}

			public OutputStream getStandardError() {
				return err;
			}

			public InputStream getStandardInput() {
				return in;
			}

			private String commandOutput;

			byte[] output() {
				return out.toByteArray();
			}

			byte[] error() {
				return err.toByteArray();
			}

			public String getCommandOutput() throws IOException {
				if (commandOutput == null) {
					Reader outputReader = new InputStreamReader(new ByteArrayInputStream(out.toByteArray()));
					StringBuffer outputBuffer = new StringBuffer();
					int charInt;
					while( (charInt = outputReader.read()) != -1) {
						outputBuffer.append( (char)charInt );
					}
					commandOutput = outputBuffer.toString();
				}
				return commandOutput;
			}
		}

		private IOException exception;
		private byte[] output;
		private byte[] error;
		private ContextImpl context = new ContextImpl();
		private Listener listener = new Listener() {
			@Override public void finished() {
				Result.this.output = context.output();
				Result.this.error = context.error();
			}

			@Override public void threw() {
				Result.this.exception = this.getLaunchException();
			}
		};
		
		Context getContext() {
			return context;
		}
		
		Listener getListener() {
			return listener;
		}

		public final InputStream getOutputStream() {
			if (output == null) return null;
			return new ByteArrayInputStream(output);
		}

		public final InputStream getErrorStream() {
			if (error == null) return null;
			return new ByteArrayInputStream(error);
		}

		public final IOException getLaunchException() {
			return exception;
		}

		public final boolean isSuccess() {
			return listener.getExitStatus() != null && listener.getExitStatus().intValue() == 0;
		}

		public static class Failure extends Exception {
			private Result result;

			Failure(Result result) {
				this.result = result;
			}

			public Result getResult() {
				return this.result;
			}
		}

		public String getCommandOutput() throws IOException {
			return context.getCommandOutput();
		}
		
		public final Result evaluate() throws Failure {
			if (this.isSuccess()) {
				return this;
			} else {
				throw new Failure(this);
			}
		}
	}

	static class Process {
		private java.lang.Process delegate;

		private Thread in;
		private Thread err;
		private Thread out;

		private InputStream stdin;

		Process(java.lang.Process delegate, Context context, Configuration configuration) {
			this.delegate = delegate;
			String spoolName = configuration.getCommand();
			this.in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, "stdout: " + spoolName);
			this.err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, "stderr: " + spoolName);
			this.stdin = context.getStandardInput();
			this.out = Spooler.start(this.stdin, delegate.getOutputStream(), true, "stdin from " + this.stdin + ": " + spoolName);
		}

		int waitFor() throws InterruptedException {
			int rv = delegate.waitFor();
			this.in.join();
			this.err.join();
			return rv;
		}

		void destroy() {
			try {
				this.stdin.close();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			delegate.destroy();
		}
	}

	static Command create(Configuration configuration) {
		Command rv = new Command();
		rv.configuration = configuration;
		return rv;
	}

	private Configuration configuration;

	private Command() {
	}

	private static Process launch(Context context, Configuration configuration) throws IOException {
		String[] command = configuration.cmdarray();
		for (int i=0; i<command.length; i++) {
			if (command[i] == null) {
				throw new NullPointerException("Command argument " + i + " must not be null.");
			}
		}
		return new Process(
			Runtime.getRuntime().exec( command, context.envp(), context.getWorkingDirectory() )
			,context
			,configuration
		);
	}

	void execute(Context context, Listener listener) {
		try {
			Process p = launch(context, configuration);
			try {
				listener.finished(p.waitFor());
			} catch (InterruptedException e) {
				throw new RuntimeException("Subprocess thread interrupted.");
			}
		} catch (IOException e) {
			listener.threw(e);
		} catch (Throwable t) {
			throw new RuntimeException(t);
		}
	}

	int getExitStatus(Context context) throws IOException {
		Listener listener = Listener.LISTEN;
		execute(context, listener);
		if (listener.getLaunchException() != null) throw listener.getLaunchException();
		return listener.getExitStatus();
	}
	
	Subprocess start(Context context) throws IOException {
		return new Subprocess(launch(context, configuration));
	}

	Result getResult() {
		Result result = new Result();
		execute(result.getContext(), result.getListener());
		return result;
	}

	private static class Spooler implements Runnable {
		static Thread start(InputStream in, OutputStream out, boolean closeOnEnd, String name) {
			Spooler s = new Spooler(in, out, closeOnEnd);
			Thread t = new Thread(s);
			t.setName(t.getName() + ":" + name);
			t.start();
			return t;
		}

		private InputStream in;
		private OutputStream out;

		private boolean closeOnEnd;
		private boolean flush;

		private IOException e;

		Spooler(InputStream in, OutputStream out, boolean closeOnEnd) {
			this.in = in;
			this.out = out;
			this.closeOnEnd = closeOnEnd;
			this.flush = true;
		}

		IOException failure() {
			return e;
		}

		public void run() {
			int i;
			try {
				while( (i = in.read()) != -1 ) {
					out.write(i);
					//	If we do not flush here, then when the underlying process writes to the parent process console, for example,
					//	-that- write will not flush, and so the output will not appear.
					if (flush) {
						out.flush();
					}
				}
				if (closeOnEnd) {
					out.close();
				}
			} catch (IOException e) {
				this.e = e;
			}
		}
	}
}