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

public class CygwinFilesystem extends Filesystem {
	private Cygpath paths;
	
	public static CygwinFilesystem create(String root, String helper) {
		CygwinFilesystem rv = new CygwinFilesystem();
		try {
			rv.paths = new HelperProcess(root, helper);
		} catch (IOException e) {
			rv.paths = new CygpathCommand(root);
		}
		return rv;
	}
	
	public CygwinFilesystem(String root) {
		this.paths = new CygpathCommand(root);
	}

	public String toString() {
		return getClass().getName() + " paths={" + paths + "}";
	}

	public final void finalize() {
		paths.destroy();
	}
	
	private CygwinFilesystem() {
	}

	private static abstract class Cygpath {
		abstract String toUnixPath(String path) throws IOException;
		abstract String toWindowsPath(String path) throws IOException;

		abstract void destroy();
	}
	
	private boolean shellCommandImpl(String path, String[] arguments) throws IOException {
		return OperatingSystem.get().shellCommand(path, arguments);
	}
	
	private static class CygpathCommand extends Cygpath {
		private String root;
		
		CygpathCommand(String root) {
			this.root = root;
		}

		public String toString() {
			return getClass().getName() + " root=" + root;
		}
		
		private String getCygpathOutput(String[] arguments) throws IOException {
			int counter = 0;
			while(counter < 10) {
				String s = OperatingSystem.get().getCommandOutput(
					new File(new File(this.root), "bin/cygpath").getCanonicalPath(),
					arguments
				);
				if (s.length() > 0) {
					//	Strip newline output by cygpath
					s = s.substring(0, s.length() - 1);
					return s;
				} else {
					counter++;
				}
			}
			String message = "";
			for (int i=0; i<arguments.length; i++) {
				message += arguments[i];
				if (i+1 != arguments.length)
					message += ",";
			}
			throw new IOException("cygpath failed: arguments=" + message);
		}
		
		String toUnixPath(String path) throws IOException {
			return getCygpathOutput(new String[] { "-u", path });
		}
		
		String toWindowsPath(String path) throws IOException {
			return getCygpathOutput(new String[] { "-w", path });
		}

		void destroy() {
		}
	}
	
	private static class HelperProcess extends Cygpath {
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
		
		synchronized String toUnixPath(String path) throws IOException {
			input.print("u" + path + "\n");
			input.flush();
			String rv = "";
			char c;
			while((c = (char)output.read()) != '\n') {
				rv += c;
			}
			return rv;
		}
		
		synchronized String toWindowsPath(String path) throws IOException {
			input.print("w" + path + "\n");
			input.flush();
			String rv = "";
			char c;
			while((c = (char)output.read()) != '\n') {
				rv += c;
			}
			return rv;
		}

		void destroy() {
			subprocess.terminate();
		}
	}

	//
	//	Methods used by NodeImpl
	//
	
	String getCommandOutput(String path, String[] arguments) throws IOException {
		return OperatingSystem.get().getCommandOutput(paths.toWindowsPath(path), arguments);
	}
	
	boolean shellCommand(String path, String[] arguments) throws IOException {
		return shellCommandImpl(paths.toWindowsPath(path), arguments);
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
