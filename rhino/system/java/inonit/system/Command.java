//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME operating system interface.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;
import java.util.*;

public class Command {
	static Command create(Configuration configuration) {
		Command rv = new Command();
		rv.configuration = configuration;
		return rv;
	}

	public static abstract class Configuration {
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
					String name = (String)i.next();
					list.add(name + "=" + (String)envMap.get(name));
				}
				env = (String[])list.toArray(new String[0]);
			}
			return env;
		}
	}

	public static abstract class Listener {
		private Integer status;

		final void setStatus(int status) {
			this.status = new Integer(status);
			this.finished();
		}

		public final Integer getExitStatus() {
			return status;
		}

		public abstract void finished();
		public abstract void threw(IOException e);
	}

	static String getCommandOutput(String path, String[] arguments) throws IOException {
		Command shell = new Command();
		shell.configuration = new ConfigurationImpl(path,arguments);
		ContextImpl context = new ContextImpl();
		ListenerImpl listener = new ListenerImpl();
		shell.execute(context, listener);
		if (listener.threw() != null) throw listener.threw();
		return context.getCommandOutput();
	}

	static boolean wasSuccessfulExecuting(String path, String[] arguments) throws IOException {
		Command shell = new Command();
		shell.configuration = new ConfigurationImpl(path, arguments);
		ListenerImpl listener = new ListenerImpl();
		shell.execute(new ContextImpl(), listener);
		if (listener.threw() != null) throw listener.threw();
		Integer status = listener.getExitStatus();
		return (status != null && status.intValue() == 0);
	}

	private static class ContextImpl extends Context {
		private ByteArrayOutputStream out = new ByteArrayOutputStream();
		private ByteArrayOutputStream err = new ByteArrayOutputStream();
		
		private InputStream in = new ByteArrayInputStream(new byte[0]);
		
		private File working = null;
		private Map environment = null;
		
		private String commandOutput;
		
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
		
		void setWorkingDirectory(File file) {
			this.working = file;
		}

		void setStandardInput(InputStream in) {
			this.in = in;
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
	
	private static class ListenerImpl extends Listener {
		private IOException io;
		
		public void finished() {
		}
		
		public void threw(IOException e) {
			this.io = e;
		}

		IOException threw() {
			return this.io;
		}
	}
	
	private static class ConfigurationImpl extends Configuration {
		private String command;
		private String[] arguments;
		
		ConfigurationImpl(String command, String[] arguments) {
			this.command = command;
			this.arguments = arguments;
		}
		
		public final String getCommand() {
			return command;
		}
		
		public final String[] getArguments() {
			return arguments;
		}
	}

	private Configuration configuration;
	
	Command() {
	}

	static class Process {
		private java.lang.Process delegate;

		private Thread in;
		private Thread err;
		private Thread out;

		Process(java.lang.Process delegate, Context context) {
			this.delegate = delegate;
			this.in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false);
			this.err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false);
			this.out = Spooler.start(context.getStandardInput(), delegate.getOutputStream(), true);
		}

		int waitFor() throws InterruptedException {
			int rv = delegate.waitFor();
			this.in.join();
			this.err.join();
			return rv;
		}

		void destroy() {
			delegate.destroy();
		}
	}
	
	private Process launch(Context context) throws IOException {
		return new Process(
			Runtime.getRuntime().exec( configuration.cmdarray(), context.envp(), context.getWorkingDirectory() )
			,context
		);
	}

	Subprocess start(Context context) throws IOException {
		return new Subprocess(launch(context));
	}

	void execute(Context context, Listener listener) {
		try {
			Process p = launch(context);
			try {
				listener.setStatus(p.waitFor());
			} catch (InterruptedException e) {
				throw new RuntimeException("Subprocess thread interrupted.");
			}
		} catch (IOException e) {
			listener.threw(e);
		} catch (Throwable t) {
			throw new RuntimeException(t);
		}
	}
	
	private static class Spooler implements Runnable {
		static Thread start(InputStream in, OutputStream out, boolean closeOnEnd) {
			Spooler s = new Spooler(in, out, closeOnEnd);
			Thread t = new Thread(s);
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
			this.flush = closeOnEnd;
		}
		
		IOException failure() {
			return e;
		}

		public void run() {
			int i;
			try {
				while( (i = in.read()) != -1 ) {
					out.write(i);
					//	TODO	This flush, which essentially turns off buffering, is necessary for at least some classes of
					//			applications that are waiting on input in order to decide how to proceed.
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
