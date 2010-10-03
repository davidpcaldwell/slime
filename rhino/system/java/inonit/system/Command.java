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
	static String getCommandOutput(String path, String[] arguments) throws IOException {
		Command shell = new Command();
		ContextImpl context = new ContextImpl();
		ListenerImpl listener = new ListenerImpl();
		shell.execute(context, new ConfigurationImpl(path, arguments), listener);
		if (listener.io != null) throw listener.io;
		return context.getCommandOutput();
	}
	
	static boolean packageShellCommand(String path, String[] arguments) throws IOException {
		Command shell = new Command();
		ListenerImpl listener = new ListenerImpl();
		shell.execute(new ContextImpl(), new ConfigurationImpl(path, arguments), listener);
		if (listener.io != null) throw listener.io;
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
	}
	
	public static abstract class Context {
		public abstract OutputStream getStandardOutput();
		public abstract OutputStream getStandardError();
		public abstract InputStream getStandardInput();
		public abstract Map getSubprocessEnvironment();
		public abstract File getWorkingDirectory();
	}
	
	public static abstract class Configuration {
		public abstract String getCommand();
		public abstract String[] getArguments();
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
	
	Command() {
	}
	
	void execute(Context parameters, Configuration configuration, Listener listener) {
		ArrayList args = new ArrayList();
		String program = configuration.getCommand();
		String[] arguments = configuration.getArguments();
		args.add(program);
		for (int i=0; i<arguments.length; i++) {
			args.add(arguments[i]);
		}
		String[] env = null;
		Map envMap = parameters.getSubprocessEnvironment();
		if (envMap != null) {
			ArrayList list = new ArrayList();
			Iterator i = envMap.keySet().iterator();
			while(i.hasNext()) {
				String name = (String)i.next();
				list.add(name + "=" + (String)envMap.get(name));
			}
			env = (String[])list.toArray(new String[0]);
		}

		Process p = null;
		try {
			p = Runtime.getRuntime().exec( (String[])args.toArray(new String[0]), env, parameters.getWorkingDirectory() );
		} catch (IOException e) {
			System.err.println("Error creating process:");
			e.printStackTrace();
			listener.threw(e);
		} catch (Throwable t) {
			t.printStackTrace();
		}
		if (p != null) {
			InputStream out = p.getInputStream();
			InputStream err = p.getErrorStream();
			OutputStream in = p.getOutputStream();

			OutputStream bOut = parameters.getStandardOutput();
			OutputStream bErr = parameters.getStandardError();
			Spooler sOut = new Spooler(out, bOut, false, "stdout");
			Spooler sErr = new Spooler(err, bErr, false, "stderr");
			Spooler sIn = new Spooler(parameters.getStandardInput(), in, true, "stdin");

			new Thread(sOut).start();
			new Thread(sErr).start();
			new Thread(sIn).start();
			try {
				int status = p.waitFor();
				listener.setStatus(status);
			} catch (InterruptedException e) {
				throw new RuntimeException("Subprocess thread interrupted.");
			}
		}
	}
	
	private class Spooler implements Runnable {
		private InputStream in;
		private OutputStream out;
		
		private boolean closeOnEnd;
		private boolean flush;
		
		private String id;

		private IOException e;

		Spooler(InputStream in, OutputStream out, boolean closeOnEnd, String id) {
			this.in = in;
			this.out = out;
			this.closeOnEnd = closeOnEnd;
			this.flush = this.closeOnEnd;
			this.id = id;
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
					if (this.closeOnEnd) {
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
