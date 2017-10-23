/*
 * StringStream
 * Copyright (C) 2016 Sofian Audry -- info(@)sofianaudry(.)com
 *
 * This library is mainly used for debugging purposes. It writes and reads
 * from a single/common buffer, allowing to test your functions and algorithms.
 *
 * Example use:
 * <code>
 * StringStream stream;
 * stream.write(42);
 * int val = stream.read(); // <-- variable "val" will contain value 42
 * </code>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
#ifndef STRING_STREAM_H_
#define STRING_STREAM_H_

#include <Stream.h>

#define STRING_STREAM_BUFFER_SIZE 128

class StringStream : public Stream
{
public:
  StringStream() : writePos(0), readPos(0), length(0) {}

  // Stream methods
  virtual int available() { return length; }

  virtual int read() {
    int val = peek();
    if (val >= 0) {
      readPos = (readPos+1) % STRING_STREAM_BUFFER_SIZE;
      length--;
    }
    return val;
  }

  virtual int peek() {
    return ( available() == 0 ? (-1) : (int)buffer[readPos] );
  }

  virtual void flush() { }

  virtual size_t write(uint8_t c) {
    if (length >= STRING_STREAM_BUFFER_SIZE)
      return 0; // buffer is full
    else
    {
      buffer[writePos] = c;
      writePos = (writePos+1) % STRING_STREAM_BUFFER_SIZE;
      length++;
      return 1;
    }
  }


private:
  uint8_t buffer[STRING_STREAM_BUFFER_SIZE];
  int writePos;
  int readPos;
  int length;
};

#endif
