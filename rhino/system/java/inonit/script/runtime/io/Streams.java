//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.io;

import java.io.*;
import java.util.*;

public class Streams {
	private Characters characters = new Characters();

	public void copy(InputStream in, OutputStream out, boolean closeInputStream) throws IOException {
		in = new BufferedInputStream(in);
		out = new BufferedOutputStream(out);
		int i;
		while((i = in.read()) != -1) {
			out.write(i);
		}
		out.flush();
		if (closeInputStream) {
			in.close();
		}
	}

	public void copy(InputStream in, OutputStream out) throws IOException {
		copy(in,out,true);
	}

	public void copy(Reader in, Writer out) throws IOException {
		in = new BufferedReader(in);
		out = new BufferedWriter(out);
		int i;
		while((i = in.read()) != -1) {
			out.write(i);
		}
		out.flush();
		in.close();
	}

	public OutputStream split(OutputStream one, OutputStream two) {
		return Bytes.Splitter.create(one, two);
	}

	public byte[] readBytes(InputStream in) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		copy(in, out);
		return out.toByteArray();
	}

	public String readString(Reader in) throws IOException {
		StringWriter writer = new StringWriter();
		copy(in,writer);
		return writer.toString();
	}

	public String readString(InputStream in) throws IOException {
		return readString(new java.io.InputStreamReader(in));
	}

	public void writeString(String string, OutputStream out) throws IOException {
		Writer writer = new BufferedWriter( new OutputStreamWriter( out ) );
		writer.write(string);
		writer.flush();
	}

	public String readLine(java.io.Reader reader, String lineTerminator) throws java.io.IOException {
		return characters.readLine(reader, lineTerminator);
	}

	public static class Null {
		public static final InputStream INPUT_STREAM = new InputStream() {
			public int read() {
				return -1;
			}
		};

		public static final Reader READER = new Reader() {
			public void close() throws IOException {
			}

			public int read(char[] c, int i, int i0) {
				return -1;
			}
		};

		public static final OutputStream OUTPUT_STREAM = new OutputStream() {
			public void write(int i) {
			}
		};

		public static final Writer WRITER = new Writer() {
			public void flush() {
			}

			public void close() {
			}

			public void write(char[] c, int i, int i0) {
			}
		};
	}

	public static class Bytes {
		public static class Buffer {
			private LinkedList bytes = new LinkedList();
			private boolean closed;

			private MyInputStream in = new MyInputStream();
			private MyOutputStream out = new MyOutputStream();

			public String toString() {
				return super.toString() + " in=" + in + " out=" + out;
			}

			public InputStream getInputStream() {
				return in;
			}

			public OutputStream getOutputStream() {
				return out;
			}

			private synchronized int available() {
				return bytes.size();
			}

			private synchronized int read() {
				while (bytes.size() == 0 && !closed) {
					try {
						wait();
					} catch (InterruptedException e) {
						throw new RuntimeException(e);
					}
				}
				if (bytes.size() == 0 && closed) return -1;
				Byte bObject = (Byte)bytes.removeFirst();
				int b = bObject.byteValue();
				if (b < 0) {
					b += 256;
				}
				return b;
			}

			private synchronized int read(byte[] b, int off, int len) {
				int i = this.read();
				if (i == -1) {
					return -1;
				} else {
					b[off] = (byte)i;
					return 1;
				}
			}

			private synchronized void write(int i) {
				bytes.addLast( new Byte( (byte)i ) );
				notifyAll();
			}

			private synchronized void close() {
				closed = true;
				Buffer.this.notifyAll();
			}

			private class MyInputStream extends InputStream {
				public int read() {
					return Buffer.this.read();
				}

				public int read(byte[] b, int off, int len) {
					return Buffer.this.read(b,off,len);
				}

				public int read(byte[] b) {
					return this.read(b,0,1);
				}

				public int available() {
					return Buffer.this.available();
				}

				public void close() {
					Buffer.this.close();
				}
			}

			private class MyOutputStream extends OutputStream {
				public void write(int i) {
					Buffer.this.write(i);
				}

				public void close() {
					Buffer.this.close();
				}
			}
		}

		public static class Splitter extends OutputStream {
			public static Splitter create(final OutputStream a, final OutputStream b) {
				return new Splitter(a,b);
			}

			private OutputStream a;
			private OutputStream b;

			Splitter(OutputStream a, OutputStream b) {
				this.a = a;
				this.b = b;
			}

			public void write(int i) throws IOException {
				a.write(i);
				b.write(i);
			}
		}

		public static abstract class Flusher {
			public abstract void initialize(OutputStream out);
			public abstract void writing(OutputStream out, byte[] bytes);
			public abstract void wrote(OutputStream out, byte[] bytes) throws IOException;
			public abstract void flushing(OutputStream out);
			public abstract void flushed(OutputStream out);
			public abstract void closing(OutputStream out);
			public abstract void closed(OutputStream out);

			public static final Flusher ALWAYS = new Flusher() {
				@Override public void initialize(OutputStream out) {
				}

				@Override public void writing(OutputStream out, byte[] bytes) {
				}

				@Override public void wrote(OutputStream out, byte[] bytes) throws IOException {
					out.flush();
				}

				@Override public void flushing(OutputStream out) {
				}

				@Override public void flushed(OutputStream out) {
				}

				@Override public void closing(OutputStream out) {
				}

				@Override public void closed(OutputStream out) {
				}
			};

			public final OutputStream decorate(final OutputStream out) {
				this.initialize(out);
				return new OutputStream() {
					@Override public void write(int i) throws IOException {
						out.write(i);
						Flusher.this.wrote(out, new byte[] { (byte)i });
					}

					@Override public void close() throws IOException {
						Flusher.this.closing(out);
						out.close();
						Flusher.this.closed(out);
					}

					@Override public void flush() throws IOException {
						Flusher.this.flushing(out);
						out.flush();
						Flusher.this.flushed(out);
					}

					@Override public void write(byte[] bytes, int off, int len) throws IOException {
						byte[] portion = new byte[len];
						for (int i=off; i<off+len; i++) {
							portion[i] = bytes[off+i];
						}
						Flusher.this.writing(out, portion);
						out.write(bytes, off, len);
						Flusher.this.wrote(out, portion);
					}

					@Override public void write(byte[] bytes) throws IOException {
						Flusher.this.writing(out, bytes);
						out.write(bytes);
						Flusher.this.wrote(out, bytes);
					}
 				};
			}
		}
	}

	public static class Characters {
		public String readLine(Reader reader, String lineTerminator) throws IOException {
			String rv = "";
			while(true) {
				int i = reader.read();
				if (i == -1) {
					if (rv.length() == 0) {
						return null;
					} else {
						return rv;
					}
				}
				char c = (char)i;
				rv += c;
				if (rv.endsWith(lineTerminator)) {
					return rv.substring(0, rv.length() - lineTerminator.length());
				}
			}
		}
	}
}