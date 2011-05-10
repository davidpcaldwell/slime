//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader for rhino.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.script.runtime.io;

import java.io.*;
import java.util.*;

public class Streams {
	private Characters characters = new Characters();
	
	public void copy(InputStream in, OutputStream out) throws IOException {
		in = new BufferedInputStream(in);
		out = new BufferedOutputStream(out);
		int i;
		while((i = in.read()) != -1) {
			out.write(i);
		}
		out.flush();
		in.close();
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
					int i = this.read();
					if (i == -1) {
						return 0;
					} else {
						b[off] = (byte)i;
						return 1;
					}
				}
				
				public int read(byte[] b) {
					return read(b,0,1);
				}
				
				public int available() {
					return Buffer.this.available();
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
