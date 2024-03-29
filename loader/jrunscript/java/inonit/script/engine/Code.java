//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.logging.*;

public class Code {
	private static final inonit.system.Logging LOG = inonit.system.Logging.get();

	private Code() {
	}

	/**
	 *	A class provided by Loader objects so that they can be used to create class path elements. The
	 *	{@link Locator#getResource getResource()} method has the same semantics as the <code>ClassLoader.getResource()</code>
	 *	method.
	 */
	public static abstract class Locator {
		public abstract URL getResource(String path);
	}

	public static abstract class Loader {
		public static class Github {
			public static final Github INSTANCE = new Github();

			private static URLConnection openBasicAuthConnection(URL url, String user, String password) throws IOException {
				final URLConnection connection = url.openConnection();
				String authorization = "Basic "
					//	below used java.xml.bind.DatatypeConverter.printBase64Binary earlier, which is JDK 7-compatible
					//	but does not work with JDK 11
					+ java.util.Base64.getEncoder().encodeToString(
						(user + ":" + password).getBytes()
					)
				;
				connection.addRequestProperty("Authorization", authorization);
				return connection;
			}

			private URLStreamHandler handler = new URLStreamHandler() {
				@Override protected URLConnection openConnection(URL u) throws IOException {
					URL withoutStreamHandler = new URL(u.toExternalForm());
					if (System.getProperty("jsh.github.user") != null) {
						return openBasicAuthConnection(
							withoutStreamHandler,
							System.getProperty("jsh.github.user"),
							System.getProperty("jsh.github.password")
						);
					} else {
						return withoutStreamHandler.openConnection();
					}
				}
			};

			private Github() {
			}

			public boolean hosts(URL url) {
				if (url.getAuthority() == null) return false;
				return url.getAuthority().equals("raw.githubusercontent.com") || url.getAuthority().equals("api.github.com");
			}

			public URLStreamHandler getUrlStreamHandler() {
				return this.handler;
			}
		}

		public static class URI {
			private static java.net.URI string(String s) {
				try {
					return new java.net.URI("slime://" + s);
				} catch (URISyntaxException e) {
					throw new RuntimeException(e);
				}
			}

			static URI create(java.net.URI delegate) {
				return new URI(delegate);
			}

			public static URI create(URL url) {
				try {
					return new URI(url.toURI());
				} catch (URISyntaxException e) {
					throw new RuntimeException(e);
				}
			}

			public static URI script(String scriptName, String path) {
				return new URI(string("script/" + scriptName.replace("/", "-") + "/" + path));
			}

			public static URI jvm(Class<?> c, String path) {
				return new URI(string("java/" + c.getName() + "/" + path));
			}

			private java.net.URI delegate;

			private URI(java.net.URI delegate) {
				this.delegate = delegate;
			}

			public java.net.URI adapt() {
				return delegate;
			}

			static URI create(java.io.File file) {
				return new URI(file.toURI());
			}
		}

		public static abstract class Resource {
			//	Seems to be used only for the Java compiler in inonit.script.engine.Java
			public abstract URI getURI();

			public abstract String getSourceName();
			public abstract InputStream getInputStream();
			public abstract Long getLength();
			public abstract java.util.Date getLastModified();

			public final Reader getReader() {
				InputStream in = getInputStream();
				if (in == null) return null;
				return new InputStreamReader(in);
			}

			public static Resource create(final java.io.File file) {
				return new Resource() {
					@Override public String toString() {
						return file.toString();
					}

					@Override public URI getURI() {
						return URI.create(file);
					}

					@Override public String getSourceName() {
						try {
							return file.getCanonicalPath();
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Long getLength() {
						return Long.valueOf(file.length());
					}

					@Override public java.util.Date getLastModified() {
						return new java.util.Date(file.lastModified());
					}

					@Override public InputStream getInputStream() {
						try {
							return new FileInputStream(file);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			//	TODO	this implementation will not respond correctly to getInputStream() being called multiple times
			private static Resource create(final URL url, final URLConnection opened) {
				return new Resource() {
					private URLConnection connection;

					@Override public String toString() {
						return url.toString();
					}

					private String getSourceName(URL url) {
						if (url.getProtocol().equals("file")) {
							try {
								java.io.File file = new java.io.File(url.toURI());
								return file.getCanonicalPath();
							} catch (URISyntaxException e) {
							} catch (IOException e) {
							}
						}
						return url.toExternalForm();
					}

					private java.net.URI toURI(URL url) {
						//	.toURI does not work correctly for files with certain characters, like spaces.
						//	See http://stackoverflow.com/questions/4494063/how-to-avoid-java-net-urisyntaxexception-in-url-touri
						if (url.getProtocol().equals("file")) {
							return new java.io.File(url.getFile()).toURI();
						}
						try {
							return url.toURI();
						} catch (URISyntaxException e) {
							throw new RuntimeException(e);
						}
					}

					private URLConnection connect() throws IOException {
						if (connection == null) {
							if (opened != null) {
								connection = opened;
							} else {
								connection = url.openConnection();
							}
						}
						return connection;
					}

					@Override public URI getURI() {
						return new URI(toURI(url));
					}

					@Override public String getSourceName() {
						return getSourceName(url);
					}

					@Override public InputStream getInputStream() {
						try {
							return connect().getInputStream();
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Long getLength() {
					//	TODO	Do something fancier to retain backward compatibility with 1.6
//						Long length = (connection.getContentLengthLong() == -1) ? null : new Long(connection.getContentLengthLong());
//						Long length = (connection.getContentLength() == -1) ? null : new Long(connection.getContentLength());
						try {
							int i = connect().getContentLength();
							if (i == -1) return null;
							return Long.valueOf(i);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}

					@Override public Date getLastModified() {
						try {
							long l = connect().getLastModified();
							if (l == -1) return null;
							return new Date(l);
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			public static Resource create(final URL url) {
				//	TODO	right now, the URL-based resource does some weird optimizations etc. so that we don't connect to the
				//			same URL over-and-over again, and hence it only supports the input being read once. That's worth fixing,
				//			but for now we leave it because we don't remember where it came from, how to test it (maybe jsh remote
				//			shells), etc.
				//
				//			Our file-based implementation works correctly, so for now we will just use it when we know the thing is
				//			a file.
				if (url.getProtocol().equals("file")) {
					try {
						return create(java.nio.file.Paths.get(url.toURI()).toFile());
					} catch (URISyntaxException e) {
						throw new RuntimeException(e);
					}
				}
				return create(url, (URLConnection)null);
			}

			//	Used in jrunscript/io to create Code.Loader.Resource objects in resources implementation, also in servlet
			public static Resource create(final URI uri, final String name, final Long length, final java.util.Date modified, final InputStream in) {
				return new Resource() {
					private byte[] bytes;

					@Override public String toString() {
						return "Code.Loader.Resource uri=" + uri.adapt() + " name=" + name + " length=" + length + " modified=" + modified;
					}

					@Override public URI getURI() {
						return uri;
					}

					@Override public String getSourceName() {
						return name;
					}

					@Override public Long getLength() {
						return length;
					}

					@Override public java.util.Date getLastModified() {
						return modified;
					}

					@Override public InputStream getInputStream() {
						if (bytes == null) {
							try {
								bytes = new inonit.script.runtime.io.Streams().readBytes(in);
							} catch (IOException e) {
								throw new RuntimeException(e);
							}
						}
						return new ByteArrayInputStream(bytes);
					}
				};
			}
		}

		public static Loader NULL = new Loader() {
			@Override public String toString() { return "Code.Loader.NULL"; }

			public Resource getFile(String path) {
				return null;
			}

			public Locator getLocator() {
				return null;
			}

			public Enumerator getEnumerator() {
				return new Enumerator() {
					@Override public String[] list(String prefix) {
						return new String[0];
					}
				};
			}
		};

		private static final Loader system = new Loader() {
			@Override public String toString() {
				return "Source: system class loader";
			}

			public Resource getFile(String path) {
				URL url = ClassLoader.getSystemClassLoader().getResource(path);
				if (url == null) return null;
				return Resource.create(url);
			}

			public Locator getLocator() {
				return null;
			}

			public Enumerator getEnumerator() {
				//	TODO	can this actually be implemented?
				return null;
			}
		};

		public static Loader system(final String prefix) {
			return system.child(prefix);
		}

		static Loader create(final java.net.URL url, Enumerator enumerator) {
			return new UrlBased(url, enumerator);
		}

		//	TODO
		static Loader jar(final File jar) throws IOException {
			try {
				return create(jar.toURI().toURL(), Enumerator.zip(jar.getAbsolutePath(), new FileInputStream(jar)));
			} catch (MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public static Loader create(java.io.File file) {
			try {
				return create(file.toURI().toURL(), Enumerator.create(file));
			} catch (java.net.MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public static Loader create(final java.net.URL url) {
			return create(url, null);
		}

		public static Loader bitbucketApiVersionOne(URL url) {
			return Code.Loader.create(url, Code.Loader.Enumerator.bitbucketApiVersionOne(url));
		}

		public static Loader githubApi(URL url) {
			return Code.Loader.create(url, Code.Loader.Enumerator.githubApi(url));
		}

		public static Loader github(URL zip, String prefix) throws IOException, URISyntaxException {
			return zip(zip.toURI().toString(), zip.openConnection().getInputStream()).child(prefix);
		}

		static Loader create(java.net.URLClassLoader parent) {
			List<URL> urls = Arrays.asList(((URLClassLoader)parent).getURLs());
			List<Code.Loader> sources = new ArrayList<Code.Loader>();
			for (URL url : urls) {
				if (url.getProtocol().equals("file")) {
					try {
						java.io.File file = new java.io.File(url.toURI());
						if (file.getName().endsWith(".jar")) {
							sources.add(Code.Loader.zip(file));
						} else {
							sources.add(Code.Loader.create(file));
						}
					} catch (java.net.URISyntaxException e) {
						throw new RuntimeException(e);
					}
				} else {
					sources.add(Code.Loader.create(url));
				}
			}
			return Code.Loader.create(sources);
		}

		public static Loader zip(final java.io.File file) {
			try {
				return zip(file.toString(), new java.io.FileInputStream(file));
			} catch (FileNotFoundException e) {
				throw new RuntimeException(e);
			}
		}

		public static Loader zip(final Code.Loader.Resource file) {
			return zip(file.toString(), file.getInputStream());
		}

		//	TODO	left over from a refactor; fixing callers should make this method unnecessary
		private static String toPrefix(String input) {
			if (input == null) return "";
			if (input.length() == 0) return "";
			if (input.endsWith("/")) return input;
			return input + "/";
		}

		private static void maintainDirectories(HashMap<String,HashSet<String>> directories, String entryName) {
			if (entryName.lastIndexOf("/") != -1) {
				String directory;
				String basename;
				if (entryName.endsWith("/")) {
					int split = entryName.substring(0, entryName.length()-1).lastIndexOf("/");
					if (split == -1) {
						directory = "";
						basename = entryName;
					} else {
						directory = entryName.substring(0, split+1);
						basename = entryName.substring(split+1);
					}
				} else {
					directory = entryName.substring(0, entryName.lastIndexOf("/") + 1);
					basename = entryName.substring(entryName.lastIndexOf("/") + 1);
				}
				HashSet<String> listing = directories.get(directory);
				if (listing == null) {
					listing = new HashSet<String>();
					directories.put(directory, listing);
				}
				listing.add(basename);
				maintainDirectories(directories, directory);
			}
		}

		private static Loader zip(final String name, final java.io.InputStream stream) {
			try {
				java.util.zip.ZipInputStream in = new java.util.zip.ZipInputStream(stream);
				java.util.zip.ZipEntry entry;
				final HashMap<String,Loader.Resource> files = new HashMap<String,Loader.Resource>();
				final HashMap<String,HashSet<String>> directories = new HashMap<String,HashSet<String>>();
				while( (entry = in.getNextEntry()) != null) {
					final byte[] bytes = new inonit.script.runtime.io.Streams().readBytes(in, false);
					final String entryName = entry.getName();
					maintainDirectories(directories, entryName);
					Loader.Resource f = new Loader.Resource() {
						public String toString() {
							return name + "!" + entryName + " length=" + bytes.length;
						}

						@Override public URI getURI() {
							LOG.log(Code.Loader.class, Level.FINE, "getURI()", null);
							return Code.Loader.URI.create(Code.Loader.URI.string(name + "!" + "/" + name));
						}

						@Override public String getSourceName() {
							LOG.log(Code.Loader.class, Level.FINE, "getSourceName()", null);
							return name + "!" + entryName;
//							throw new UnsupportedOperationException("Not supported yet in " + name + "."); //To change body of generated methods, choose Tools | Templates.
						}

						@Override public InputStream getInputStream() {
							return new ByteArrayInputStream(bytes);
						}

						@Override public Long getLength() {
							return Long.valueOf(bytes.length);
						}

						@Override public Date getLastModified() {
							//	TODO	there is a 1.8 implementation of this in ZipEntry but we won't use it unless we drop support
							//			for 1.7, otherwise we'll need to implement via reflection
							return null;
						}
					};
					files.put(entry.getName(), f);
				}
				final Enumerator enumerator = new Enumerator() {
					@Override public String[] list(String prefix) {
						String start = toPrefix(prefix);
						return (directories.get(start) != null) ? directories.get(start).toArray(new String[0]) : new String[0];
					}
				};
				return new Code.Loader() {
					@Override public String toString() { return "Code.Loader zip=" + name; }

					@Override public Resource getFile(String path) throws IOException {
						LOG.log(Code.Loader.class, Level.FINE, "getFile(" + path + ")", null);
						Resource rv = files.get(path);
						LOG.log(Code.Loader.class, Level.FINE, String.valueOf(rv), null);
						return rv;
					}

					@Override public Enumerator getEnumerator() {
						return enumerator;
					}

					@Override public Locator getLocator() {
						LOG.log(Code.Loader.class, Level.FINE, "getClasses()", null);
						//	TODO	think about this
						return null;
					}
				};
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		private static Enumerator enumerator(List<Loader> sources) {
			final List<Enumerator> enumerators = new ArrayList<Enumerator>();
			for (Loader s : sources) {
				Enumerator e = s.getEnumerator();
				if (e == null) return null;
				enumerators.add(e);
			}
			return new Enumerator() {
				@Override public String[] list(String prefix) {
					HashSet<String> strings = new HashSet<String>();
					for (Enumerator e : enumerators) {
						String[] s = e.list(prefix);
						if (s != null) {
							for (String string : s) {
								strings.add(string);
							}
						}
					}
					return strings.toArray(new String[0]);
				}
			};
		}

		public static Loader create(final List<Loader> delegates) {
			final Locator classes = new Locator() {
				@Override public URL getResource(String path) {
					for (Loader delegate : delegates) {
						Locator c = delegate.getLocator();
						if (c != null && c.getResource(path) != null) {
							return c.getResource(path);
						}
					}
					return null;
				}
			};

			final Enumerator enumerator = enumerator(delegates);

			return new Loader() {
				@Override public String toString() {
					String rv = "Code.Loader: [";
					boolean first = true;
					for (Loader s : delegates) {
						if (!first) {
							rv += ",";
						} else {
							first = false;
						}
						rv += s.toString();
					}
					rv += "]";
					return rv;
				}

				@Override public Resource getFile(String path) throws IOException {
					for (Loader delegate : delegates) {
						Resource file = delegate.getFile(path);
						if (file != null) {
							return file;
						}
					}
					return null;
				}

				@Override public Locator getLocator() {
					return classes;
				}

				@Override public Enumerator getEnumerator() {
					//	TODO	implement
					return enumerator;
				}
			};
		}

		public static abstract class Enumerator {
			static Enumerator create(final java.io.File file) {
				return new Enumerator() {
					private java.io.File getDirectory(String prefix) {
						if (prefix == null) {
							return file.exists() && file.isDirectory() ? file : null;
						}
						java.io.File rv = new java.io.File(file, prefix);
						if (rv.isDirectory()) {
							return rv;
						}
						//	Not found or not directory
						return null;
					}

					@Override public String[] list(String prefix) {
						java.io.File dir = getDirectory(prefix);
						if (dir == null) return null;
						java.io.File[] files = dir.listFiles();
						ArrayList<String> rv = new ArrayList<String>();
						for (java.io.File file : files) {
							rv.add( (file.isDirectory()) ? file.getName() + "/" : file.getName() );
						}
						return rv.toArray(new String[rv.size()]);
					}
				};
			}

			static Enumerator bitbucketApiVersionOne(final URL base) {
				return new Enumerator() {
					@Override public String[] list(String prefix) {
						try {
							URL url = (prefix == null) ? base : new URL(base, prefix);
							BufferedReader lines = new BufferedReader(new InputStreamReader(url.openConnection().getInputStream()));
							List<String> rv = new ArrayList<String>();
							String line;
							while( (line = lines.readLine()) != null) {
								rv.add(line);
							}
							return rv.toArray(new String[0]);
						} catch (MalformedURLException e) {
							throw new RuntimeException(e);
						} catch (FileNotFoundException e) {
							return null;
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					}
				};
			}

			private static class TerribleGithubJsonParser {
				static abstract class JsonValue {}

				static class JsonNull extends JsonValue {
					static final JsonNull INSTANCE = new JsonNull();
				}

				static class JsonPrimitive extends JsonValue {
					static JsonPrimitive TRUE = new JsonPrimitive(true);
					static JsonPrimitive FALSE = new JsonPrimitive(false);

					static JsonPrimitive string(String s) {
						return new JsonPrimitive(s);
					}

					static JsonPrimitive number(Double d) {
						return new JsonPrimitive(d);
					}

					private Object o;

					private JsonPrimitive(Object o) {
						this.o = o;
					}

					private JsonPrimitive(boolean b) {
						o = Boolean.valueOf(b);
					}

					@Override public String toString() { return String.valueOf(o); }

					Object value() {
						return this.o;
					}
				}

				static abstract class JsonObject extends JsonValue {}

				static class JsonObjectLiteral extends JsonObject {
					private Map<String,JsonValue> properties;

					JsonObjectLiteral(Map<String,JsonValue> properties) {
						this.properties = properties;
					}

					@Override public String toString() { return "Object{" + this.properties + "}"; }

					JsonValue getProperty(String name) {
						return properties.get(name);
					}
				}

				static class JsonArrayLiteral extends JsonObject {
					private List<JsonValue> contents;

					JsonArrayLiteral(List<JsonValue> contents) {
						this.contents = contents;
					}

					@Override public String toString() { return "Array[" + this.contents + "]"; }

					List<JsonValue> values() { return this.contents; }
				}

				static class State {
					private String json;

					State(String json) {
						this.json = json;
					}

					@Override public String toString() {
						return "JSON[" + this.json + "]";
					}

					boolean startsWith(String prefix) {
						return this.json.startsWith(prefix);
					}

					boolean startsWithDigit() {
						char first = this.json.charAt(0);
						return first >= '0' && first <= '9';
					}

					String until(String substring) {
						int rv = this.json.indexOf(substring);
						if (rv == -1) throw new Error("Substring not found: " + substring);
						return this.json.substring(0, this.json.indexOf(substring));
					}

					void consume(String prefix) {
						if (!this.startsWith(prefix)) throw new RuntimeException("Does not start with " + prefix + ":" + this.json);
						this.json = this.json.substring(prefix.length());
					}

					String consume(int count) {
						String rv = this.json.substring(0,count);
						consume(rv);
						return rv;
					}
				}

				private String parseStringLiteral(State json) {
					json.consume("\"");
					String name = json.until("\"");
					json.consume(name + "\"");
					return name;
				}

				private JsonPrimitive parseBoolean(State json) {
					if (json.startsWith("true")) {
						json.consume("true");
						return JsonPrimitive.TRUE;
					}
					if (json.startsWith("false")) {
						json.consume("false");
						return JsonPrimitive.FALSE;
					}
					throw new RuntimeException();
				}

				private JsonNull parseNull(State json) {
					json.consume("null");
					return JsonNull.INSTANCE;
				}

				private JsonPrimitive parseNumber(State json) {
					String s = "";
					while(json.startsWithDigit()) {
						s += json.consume(1);
					}
					return JsonPrimitive.number(Double.parseDouble(s));
				}

				private JsonPrimitive parseString(State json) {
					String value = parseStringLiteral(json);
					return JsonPrimitive.string(value);
				}

				private static class JsonProperty {
					private String name;
					private JsonValue value;

					JsonProperty(String name, JsonValue value) {
						this.name = name;
						this.value = value;
					}

					String getName() { return this.name; }
					JsonValue getValue() { return this.value; }
				}

				private JsonProperty parseProperty(State json) {
					String name = parseStringLiteral(json);
					json.consume(":");
					JsonValue value = parse(json);
					return new JsonProperty(name, value);
				}

				JsonObjectLiteral parseObject(State json) {
					json.consume("{");
					HashMap<String,JsonValue> properties = new HashMap<String,JsonValue>();
					while(!json.startsWith("}")) {
						JsonProperty property = parseProperty(json);
						properties.put(property.getName(), property.getValue());
						if (json.startsWith(",")) json.consume(",");
					}
					json.consume("}");
					return new JsonObjectLiteral(properties);
				}

				JsonArrayLiteral parseArray(State json) {
					json.consume("[");
					ArrayList<JsonValue> rv = new ArrayList<JsonValue>();
					while(!json.startsWith("]")) {
						rv.add(parse(json));
						if (json.startsWith(",")) json.consume(",");
					}
					json.consume("]");
					return new JsonArrayLiteral(rv);
				}

				JsonValue parse(State json) {
					if (json.startsWith("[")) {
						return parseArray(json);
					} else if (json.startsWith("{")) {
						return parseObject(json);
					} else if (json.startsWith("null")) {
						return parseNull(json);
					} else if (json.startsWith("true") || json.startsWith("false")) {
						return parseBoolean(json);
					} else if (json.startsWithDigit()) {
						return parseNumber(json);
					} else if (json.startsWith("\"")) {
						return parseString(json);
					} else {
						throw new RuntimeException("Cannot parse: " + json);
					}
				}

				JsonValue parse(String json) {
					return parse(new State(json));
				}
			}

			static Enumerator githubApi(final URL base) {
				String path = base.getPath();
				String[] tokens = path.substring(1).split("\\/");
				final String user = tokens[0];
				final String repo = tokens[1];
				// String ref = tokens[2];
				return new Enumerator() {
					@Override public String[] list(String prefix) {
						//System.err.println("path = " + path + " tokens=" + Arrays.asList(tokens));
						try {
							String protocol = System.getProperty("jsh.github.api.protocol", "https");
							URL url = new java.net.URL(
								protocol,
								"api.github.com",
								-1,
								"/repos/" + user + "/" + repo + "/contents/" + prefix,
								Loader.Github.INSTANCE.getUrlStreamHandler()
							);
							String s = new inonit.script.runtime.io.Streams().readString(url.openConnection().getInputStream());
							//System.err.println("contents of " + prefix + " = " + s + " from " + url);
							TerribleGithubJsonParser parser = new TerribleGithubJsonParser();
							TerribleGithubJsonParser.JsonValue value = parser.parse(s);
							TerribleGithubJsonParser.JsonArrayLiteral items = (TerribleGithubJsonParser.JsonArrayLiteral)value;
							//System.err.println(items);
							ArrayList<String> rv = new ArrayList<String>();
							for (TerribleGithubJsonParser.JsonValue item: items.values()) {
								TerribleGithubJsonParser.JsonObjectLiteral entry = (TerribleGithubJsonParser.JsonObjectLiteral)item;
								TerribleGithubJsonParser.JsonPrimitive typeProperty = ((TerribleGithubJsonParser.JsonPrimitive)entry.getProperty("type"));
								TerribleGithubJsonParser.JsonPrimitive nameProperty = ((TerribleGithubJsonParser.JsonPrimitive)entry.getProperty("name"));
								String type = (String)typeProperty.value();
								String name = (String)nameProperty.value();
								if (type.equals("file")) {
									rv.add(name);
								} else if (type.equals("dir")) {
									rv.add(name + "/");
								} else {
									throw new Error("Unexpected type: " + entry);
								}
							}
							return rv.toArray(new String[0]);
						} catch (MalformedURLException e) {
							throw new RuntimeException(e);
						} catch (FileNotFoundException e) {
							return null;
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
						// try {
						// 	URL url = (prefix == null) ? base : new URL(base, prefix);
						// 	BufferedReader lines = new BufferedReader(new InputStreamReader(url.openConnection().getInputStream()));
						// 	List<String> rv = new ArrayList<String>();
						// 	String line;
						// 	while( (line = lines.readLine()) != null) {
						// 		rv.add(line);
						// 	}
						// 	return rv.toArray(new String[0]);
						// } catch (MalformedURLException e) {
						// 	throw new RuntimeException(e);
						// } catch (FileNotFoundException e) {
						// 	return null;
						// } catch (IOException e) {
						// 	throw new RuntimeException(e);
						// }
					}
				};
			}

			static Enumerator zip(final String sourceName, InputStream stream) throws IOException {
				java.util.zip.ZipInputStream in = new java.util.zip.ZipInputStream(stream);
				java.util.zip.ZipEntry entry;
				final HashMap<String,Loader.Resource> files = new HashMap<String,Loader.Resource>();
				while( (entry = in.getNextEntry()) != null) {
					final byte[] bytes = new inonit.script.runtime.io.Streams().readBytes(in, false);
					final String entryName = entry.getName();
					Loader.Resource f = new Loader.Resource() {
						public String toString() {
							return getClass().getName() + " length=" + bytes.length;
						}

						@Override public URI getURI() {
							LOG.log(Code.Loader.class, Level.FINE, "getURI()", null);
							throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
						}

						@Override public String getSourceName() {
							LOG.log(Code.Loader.class, Level.FINE, "getSourceName()", null);
							return sourceName + "!" + entryName;
//							throw new UnsupportedOperationException("Not supported yet in " + name + "."); //To change body of generated methods, choose Tools | Templates.
						}

						@Override public InputStream getInputStream() {
							return new ByteArrayInputStream(bytes);
						}

						@Override public Long getLength() {
							return Long.valueOf(bytes.length);
						}

						@Override public Date getLastModified() {
							//	TODO	there is a 1.8 implementation of this in ZipEntry but we won't use it unless we drop support
							//			for 1.7, otherwise we'll need to implement via reflection
							return null;
						}
					};
					files.put(entry.getName(), f);
				}
				final Enumerator enumerator = new Enumerator() {
					@Override public String[] list(String prefix) {
						String start = toPrefix(prefix);
						ArrayList<String> rv = new ArrayList<String>();
						for (String key : files.keySet()) {
							if (key.startsWith(start)) {
								if (key.endsWith("/")) {
									//	ignore
								} else {
									String suffix = key.substring(start.length());
									if (suffix.indexOf("/") != -1) {
										//	subdirectory, ignore
									} else {
										rv.add(suffix);
									}
								}
							}
						}
						return rv.toArray(new String[0]);
					}
				};
				return enumerator;
			}

			public abstract String[] list(String prefix);
		}

		/**
		 * Returns the resource located at the given path, or <code>null</code> if no resource is located at that path.
		 */
		public abstract Resource getFile(String path) throws IOException;
		public abstract Enumerator getEnumerator();
		public abstract Locator getLocator();

		private String getChildPrefix(String prefix) {
			if (prefix == null || prefix.length() == 0) return "";
			if (prefix.endsWith("/")) return prefix;
			return prefix + "/";
		}

		public final Loader child(final String prefix) {
			final String prepend = getChildPrefix(prefix);
			return new Code.Loader() {
				@Override public String toString() {
					return Code.Loader.class.getName() + " source=" + Loader.this + " prefix=" + prefix;
				}

				public Loader.Resource getFile(String path) throws IOException {
					return Loader.this.getFile(prepend + path);
				}

				public Locator getLocator() {
					final Locator delegate = Loader.this.getLocator();
					if (delegate == null) {
						return null;
					}
					return new Locator() {
						@Override public URL getResource(String path) {
							return delegate.getResource(prepend+path);
						}
					};
				}

				public Enumerator getEnumerator() {
					final Enumerator parent = Loader.this.getEnumerator();
					if (parent != null) {
						return new Enumerator() {
							@Override public String[] list(String subprefix) {
								String sub = (subprefix == null) ? "" : subprefix;
								return parent.list(prepend + sub);
							}
						};
					} else {
						return null;
					}
				}
			};
		}

		private static class MyUrlClassLoader extends URLClassLoader {
			private URL url;

			MyUrlClassLoader(URL url) {
				super(new URL[] { url });
				this.url = url;
			}

			@Override public URL findResource(String name) {
				Loader.Github github = Loader.Github.INSTANCE;
				if (github.hosts(this.url)) {
					try {
						URL url = new URL(this.url, name, github.getUrlStreamHandler());
						try {
							final URLConnection connection = url.openConnection();
							HttpURLConnection h = (HttpURLConnection)connection;
							try {
								int code = h.getResponseCode();
								if (code == 404) return null;
								return new URL(this.url, name, new URLStreamHandler() {
									@Override protected URLConnection openConnection(URL u) throws IOException {
										return connection;
									}
								});
							} catch (IOException e) {
								return null;
							}
						} catch (IOException e) {
							return null;
						}
					} catch (MalformedURLException e) {
						throw new RuntimeException(e);
					}
				}
				return super.findResource(name);
			}
		}

		private static class UrlBased extends Loader {
			private java.net.URL url;
			private Enumerator enumerator;
			private Locator classes;

			UrlBased(final java.net.URL url, Enumerator enumerator) {
				//	TODO	could this.url be replaced by calls to the created classes object?
				this.url = url;
				this.enumerator = enumerator;
				final URLClassLoader delegate = new MyUrlClassLoader(url);
				this.classes = new Locator() {
					@Override public URL getResource(String path) {
						return delegate.getResource(path);
					}
				};
			}

			@Override public String toString() {
				return Code.Loader.class.getName() + " url=" + url;
			}

			private static class FileRequest extends RuntimeException {
				FileRequest(String path) {
					super("Request for " + path);
				}
			}

			public Resource getFile(String path) throws IOException {
				//	When running locally, echoes every request along with a stack trace about who made it to help with analysis
				//	of whether requests can be reduced. The environment variable is set by the script that creates the client-
				//	side command, at rhino/tools/github/test/manual/jsh.jsh.js
				if (System.getenv("JSH_OPTIMIZE_REMOTE_SHELL") != null && url.toString().equals("http://raw.githubusercontent.com/davidpcaldwell/slime/master/")) {
					new FileRequest("getFile(" + path + ")").printStackTrace();
				}
				URL url = classes.getResource(path);
				if (url == null) return null;
				return Resource.create(url);
			}

			public Enumerator getEnumerator() {
				return enumerator;
			}

			public Locator getLocator() {
				return classes;
			}
		}
	}
}
