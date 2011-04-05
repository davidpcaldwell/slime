//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.io.cygwin;

import java.io.*;
import java.util.*;

import java.lang.reflect.*;

import inonit.script.runtime.io.*;
import inonit.system.*;
import inonit.system.cygwin.*;

public class CygwinFilesystem extends Filesystem {
	public static CygwinFilesystem create(String root, String helper) {
		CygwinFilesystem rv = new CygwinFilesystem();
		Cygwin cygwin = Cygwin.create(new File(root));
		try {
			rv.paths = new HelperProcess(root, helper);
		} catch (IOException e) {
			rv.paths = new Subprocesses(cygwin);
		}
		rv.paths.initialize(new CachedCommands(cygwin));
		return rv;
	}

	public static CygwinFilesystem create(String root) {
		CygwinFilesystem rv = new CygwinFilesystem();
		Cygwin cygwin = Cygwin.create(new File(root));
		rv.paths = new Subprocesses(cygwin);
		rv.paths.initialize(new CachedCommands(cygwin));
		return rv;
	}

	private Implementation paths;
	private Commands commands;

	private CygwinFilesystem() {
	}

	public String toString() {
		return getClass().getName() + " paths={" + paths + "}";
	}

	public final void finalize() {
		paths.destroy();
	}
	
	private static abstract class Commands {
		private OperatingSystem os = OperatingSystem.get();

		abstract String getWindowsPath(String unix) throws IOException;

		String getCommandOutput(String command, String[] arguments) throws IOException {
			String rv = "";
			for (int i=0; i<1; i++) {
				rv = os.getCommandOutput(getWindowsPath(command),arguments);
				if (rv.length() > 0) return rv;
			}
			return rv;
		}

		boolean shellCommand(String command, String[] arguments) throws IOException {
			return os.shellCommand(getWindowsPath(command), arguments);
		}
	}

	private static class CachedCommands extends Commands {
		private HashMap<String,String> cache = new HashMap<String,String>();

		private Cygwin cygwin;

		CachedCommands(Cygwin cygwin) {
			this.cygwin = cygwin;
		}

		String getWindowsPath(String unix) throws IOException {
			if (cache.get(unix) == null) {
				cache.put(unix, cygwin.toWindowsPath(unix, false) );
			}
			return cache.get(unix);
		}
	}

	private static abstract class Implementation {
		private Commands commands;

		final void initialize(Commands commands) {
			this.commands = commands;
		}

		Commands commands() {
			return commands;
		}

		abstract String toUnixPath(String path) throws IOException;
		abstract String toWindowsPath(String path) throws IOException;
		abstract String[] list(NodeImpl node) throws IOException;

		boolean isSoftlink(NodeImpl node) throws IOException {
			//	TODO	Implement retries
			String path = node.getScriptPath();
			String output = commands.getCommandOutput("/bin/ls", new String[] { "-d", "--file-type", path });
			if (output.length() == 0) throw new RuntimeException("No output for ls " + path);
			output = output.substring(0, output.length() - 1);
			return output.endsWith("@");
		}

		boolean delete(NodeImpl node) throws IOException {
			if (node.isSoftlink()) {
				return commands.shellCommand( "/bin/rm", new String[] { node.getScriptPath() } );
			} else if (node.isDirectory()) {
				return commands.shellCommand( "/bin/rm", new String[] { "-Rf", node.getScriptPath() } );
			} else {
				return commands.shellCommand( "/bin/rm", new String[] { node.getScriptPath() } );
			}
		}

		boolean mkdir(NodeImpl node) throws IOException {
			return commands.shellCommand("/bin/mkdir", new String[] { node.getScriptPath() });
		}

		boolean mkdirs(NodeImpl node) throws IOException {
			return commands.shellCommand("/bin/mkdir", new String[] { "-p", node.getScriptPath() });
		}

		abstract void destroy();
	}
	
	private static class Subprocesses extends Implementation {
		private Cygwin cygwin;
		
		Subprocesses(Cygwin cygwin) {
			this.cygwin = cygwin;
		}

		public String toString() {
			return getClass().getName() + " cygwin=" + cygwin;
		}
		
		String toUnixPath(String path) throws IOException {
			return this.cygwin.toUnixPath(path,false);
		}
		
		String toWindowsPath(String path) throws IOException {
			return this.cygwin.toWindowsPath(path,false);
		}

		String[] list(NodeImpl node) throws IOException {
			String output = commands().getCommandOutput("/bin/ls", new String[] { "-A", "--file-type", node.getScriptPath() });
			ArrayList names = new ArrayList();
			String name = "";
			for (int i=0; i<output.length(); i++) {
				if (output.charAt(i) == '\n') {
					names.add( name );
					name = "";
				} else {
					name += output.charAt(i);
				}
			}
			return (String[])names.toArray(new String[0]);
		}

		void destroy() {
		}
	}
	
	private static class HelperProcess extends Implementation {
		private InputStream output;
		private PrintWriter input;

		private Subprocess subprocess;
		
		private Map getenv() {
			try {
				Method systemGetenv = System.class.getMethod("getenv", new Class[0]);
				return (Map)systemGetenv.invoke(null, new Object[0]);
			} catch (NoSuchMethodException e) {
				return null;
			} catch (SecurityException e) {
				return null;
			} catch (IllegalAccessException e) {
				throw new RuntimeException(e);
			} catch (InvocationTargetException e) {
				throw new RuntimeException(e.getTargetException());
			}
		}

		public String toString() {
			return getClass().getName() + " subprocess=" + subprocess;
		}
		
		HelperProcess(final String root, final String path) throws IOException {
			if (path == null) throw new IllegalArgumentException("'path' must not be null.");

			final Streams.Bytes.Buffer stdin = new Streams.Bytes.Buffer();
			final Streams.Bytes.Buffer stdout = new Streams.Bytes.Buffer();

			Command.Configuration configuration = new Command.Configuration() {
				public String getCommand() {
					return path;
				}

				public String[] getArguments() {
					return new String[0];
				}
			};

			Command.Context context = new Command.Context() {
				public File getWorkingDirectory() {
					return new File(System.getProperty("user.dir"));
				}

				public Map getSubprocessEnvironment() {
					Map toUse = new HashMap();

					Map existing = getenv();
					if (existing != null) {
						Iterator keys = existing.keySet().iterator();
						while(keys.hasNext()) {
							Object key = keys.next();
							Object value = existing.get(key);
							toUse.put(key, value);
						}
					}

					//	TODO	Probably should prepend path here rather than overwriting
					toUse.put("PATH", root + "/bin");
					return toUse;
				}

				public OutputStream getStandardOutput() {
					return stdout.getOutputStream();
				}

				public InputStream getStandardInput() {
					return stdin.getInputStream();
				}

				public OutputStream getStandardError() {
					return System.err;
				}
			};

			this.subprocess = OperatingSystem.get().start(configuration, context);
			this.output = stdout.getInputStream();
			this.input = new PrintWriter(stdin.getOutputStream(), true);
		}

		synchronized String getResponse(String request) throws IOException {
			input.print(request + "\n");
			input.flush();
			String rv = "";
			char c;
			while((c = (char)output.read()) != '\n') {
				rv += c;
			}
			return rv;
		}
		
		synchronized String toUnixPath(String path) throws IOException {
			return getResponse("u" + path);
		}
		
		synchronized String toWindowsPath(String path) throws IOException {
			return getResponse("w" + path);
		}

		String[] list(NodeImpl directory) throws IOException {
			String response = getResponse("l" + directory.getScriptPath());
			if (response.length() == 0) return new String[0];
			return response.split("\\|");
		}

		void destroy() {
			subprocess.terminate();
		}
	}

	//
	//	Methods used by NodeImpl
	//
	
	boolean isSoftlink(NodeImpl node) throws IOException {
		return paths.isSoftlink(node);
	}

	boolean delete(NodeImpl node) throws IOException {
		return paths.delete(node);
	}

	public boolean mkdir(NodeImpl node) throws IOException {
		return paths.mkdir(node);
	}

	public boolean mkdirs(NodeImpl node) throws IOException {
		return paths.mkdirs(node);
	}

	public Filesystem.Node[] list(NodeImpl node, FilenameFilter pattern) throws IOException {
		String[] names = paths.list(node);
		ArrayList unfiltered = new ArrayList();
		for (int i=0; i<names.length; i++) {
			String filename = (String)names[i];
			if (filename.endsWith("/")) {
				//	directory
				String leafName = filename.substring(0, filename.length() - 1);
				NodeImpl n = NodeImpl.createDirectory(this, node.getHostFile(), node.getScriptPath(), leafName);
				unfiltered.add(n);
			} else if (filename.endsWith("@")) {
				//	softlink; could be directory, may not be
				String leafName = filename.substring(0, filename.length() - 1);
				NodeImpl n = NodeImpl.createLink(this, node.getScriptPath(), leafName);
				unfiltered.add(n);
			} else if (filename.endsWith("|") || filename.endsWith(">") || filename.endsWith("=")) {
				//	Ignore (FIFO, "door", and AF_UNIX socket, respectively)
			} else {
				//	ordinary file
				NodeImpl n = NodeImpl.createFile(this, node.getHostFile(), node.getScriptPath(), filename);
				unfiltered.add(n);
			}
		}
		if (pattern == null) {
			pattern = new FilenameFilter() {
				public boolean accept(File dir, String name) {
					return true;
				}
			};
		}
		ArrayList rv = new ArrayList();
		for (int i=0; i<unfiltered.size(); i++) {
			NodeImpl n = (NodeImpl)unfiltered.get(i);
			if (pattern.accept(n.getHostFile().getParentFile(), n.getHostFile().getName())) {
				rv.add(n);
			}
		}

		return (Filesystem.Node[])rv.toArray(new Filesystem.Node[0]);
	}

	File toHostFileImpl(String path) throws IOException {
		return new java.io.File(paths.toWindowsPath(path));
	}

	String toScriptPath(String file) throws IOException {
		return paths.toUnixPath(file);
	}
	
	//
	//	Methods implementing Filesystem
	//

	protected String getPathnameSeparatorImpl() {
		return "/";
	}

	protected String getSearchpathSeparatorImpl() {
		return ":";
	}
	
	protected String getLineSeparatorImpl() {
		return "\n";
	}

	protected Node createNode(String path) {
		return NodeImpl.create(this, path);
	}

	protected Node createNode(File file) {
		return NodeImpl.create(this, file);
	}
}
