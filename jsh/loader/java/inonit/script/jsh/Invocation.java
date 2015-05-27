//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;

import inonit.script.engine.*;

public abstract class Invocation {
	public static abstract class Script {
		private static Script create(final Code.Source.File delegate, final java.net.URI uri) {
			return new Script() {
				@Override public java.net.URI getUri() {
					return uri;
				}

				public Code.Source.File getSource() {
					return delegate;
				}
			};
		}

		static Script create(File file) {
			return create(Code.Source.File.create(file), file.toURI());
		}

		static Script create(Code.Source.File delegate) {
			return create(delegate, null);
		}

		public abstract java.net.URI getUri();
		public abstract Code.Source.File getSource();
	}

	public abstract Script getScript();
	public abstract String[] getArguments();

	static class CheckedException extends Exception {
		CheckedException(String message) {
			super(message);
		}

		CheckedException(String message, Throwable cause) {
			super(message, cause);
		}
	}

	public static Invocation jsh(final File script, final String[] arguments) {
		return new Invocation() {
			@Override public String toString() {
				String rv = String.valueOf(script);
				for (String s : arguments) {
					rv += " " + s;
				}
				return rv;
			}

			@Override public Invocation.Script getScript() {
				return Invocation.Script.create(script);
			}

			@Override public String[] getArguments() {
				return arguments;
			}
		};
	}

	public static Invocation packaged(final String[] arguments) {
		return new Invocation() {
			public Script getScript() {
				//	TODO	DRY with Installation.java; may go away as we refactor URI management
				return Script.create(Code.Source.File.create(Code.Source.URI.jvm(Installation.class, "packaged/main.jsh.js"), "main.jsh.js", ClassLoader.getSystemResourceAsStream("main.jsh.js")));
			}

			public String[] getArguments() {
				return arguments;
			}
		};
	}

	public static Invocation create(String[] arguments) throws CheckedException {
		if (arguments.length == 0) {
			throw new IllegalArgumentException("At least one argument, representing the script, is required.");
		}
		final List<String> args = new ArrayList<String>();
		args.addAll(Arrays.asList(arguments));
		final String scriptPath = args.remove(0);
		if (scriptPath.startsWith("http://") || scriptPath.startsWith("https://")) {
			final java.net.URL url;
			final java.io.InputStream stream;
			try {
				url = new java.net.URL(scriptPath);
				stream = url.openStream();
			} catch (java.net.MalformedURLException e) {
				throw new CheckedException("Malformed URL: " + scriptPath, e);
			} catch (IOException e) {
				throw new CheckedException("Could not open: " + scriptPath, e);
			}
			return new Invocation() {
				public Script getScript() {
					return new Script() {
						@Override
						public java.net.URI getUri() {
							try {
								return url.toURI();
							} catch (java.net.URISyntaxException e) {
								//	TODO	when can this happen? Probably should refactor to do this parsing earlier and use
								//			CheckedException
								throw new RuntimeException(e);
							}
						}

						@Override
						public Code.Source.File getSource() {
							return Code.Source.File.create(Code.Source.URI.create(url), scriptPath, stream);
						}
					};
				}

				public String[] getArguments() {
					return args.toArray(new String[args.size()]);
				}
			};
		} else {
			final File mainScript = new File(scriptPath);
			if (!mainScript.exists()) {
				//	TODO	this really should not happen if the launcher is launching this
				throw new CheckedException("File not found: " + scriptPath);
			}
			if (mainScript.isDirectory()) {
				throw new CheckedException("Filename: " + scriptPath + " is a directory");
			}
			return new Invocation() {
				public Script getScript() {
					return Script.create(mainScript);
				}

				public String[] getArguments() {
					return (String[]) args.toArray(new String[0]);
				}
			};
		}
	}

}