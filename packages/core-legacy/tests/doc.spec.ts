import { describe, expect, expectTypeOf, it } from 'vitest';

import { doc } from '../src/doc';

describe('doc', () => {
  describe('Basic functionality', () => {
    it('should strip common indentation from multi-line strings', () => {
      const result = doc`
        Hello world!
        This is a multi-line string
        that will be properly formatted.
      `;
      expect(result).toBe(
        'Hello world!\nThis is a multi-line string\nthat will be properly formatted.',
      );
    });

    it('should handle single line strings', () => {
      const result = doc`Hello world!`;
      expect(result).toBe('Hello world!');
    });

    it('should handle empty strings', () => {
      const result = doc``;
      expect(result).toBe('');
    });

    it('should handle strings with interpolation', () => {
      const name = 'World';
      const result = doc`
        Hello ${name}!
        Welcome to our application.
      `;
      expect(result).toBe('Hello World!\nWelcome to our application.');
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      const message = doc`
        Hello world!
        This is a multi-line string
        that will be properly formatted.
      `;
      expect(message).toBe(
        'Hello world!\nThis is a multi-line string\nthat will be properly formatted.',
      );
    });

    it('should handle strings with different indentation levels', () => {
      const result = doc`
        First line
          Second line with indent
            Third line with more indent
        Fourth line
      `;
      expect(result).toBe(
        'First line\n  Second line with indent\n    Third line with more indent\nFourth line',
      );
    });

    it('should handle strings with leading and trailing newlines', () => {
      const result = doc`

        Content here

      `;
      expect(result).toBe('Content here');
    });
  });

  describe('Edge cases', () => {
    it('should handle strings with mixed indentation (tabs and spaces)', () => {
      const result = doc`
  \t\tLine with tabs
    Line with spaces
  \t  Mixed tabs and spaces
      `;
      expect(result).toBe('Line with tabs\nLine with spaces\n Mixed tabs and spaces');
    });

    it('should handle strings with only tabs as indentation', () => {
      const result = doc`
\t\tfoo
\t\tbar
\t\tbaz
      `;
      expect(result).toBe('foo\nbar\nbaz');
    });

    it('should handle strings with no indentation on any line', () => {
      const result = doc`
Hello world!
This is a string
with no indentation.
      `;
      expect(result).toBe('Hello world!\nThis is a string\nwith no indentation.');
    });

    it('should handle strings with only empty lines', () => {
      const result = doc`


      `;
      expect(result).toBe('');
    });

    it('should handle strings with complex nested structures', () => {
      const result = doc`
        function example() {
          if (condition) {
            return true;
          }
          return false;
        }
      `;
      expect(result).toBe(
        'function example() {\n  if (condition) {\n    return true;\n  }\n  return false;\n}',
      );
    });

    it('should handle strings with interpolation at different indentation levels', () => {
      const name = 'John';
      const age = 30;
      const result = doc`
        User: ${name}
          Age: ${age}
        Status: Active
      `;
      expect(result).toBe('User: John\n  Age: 30\nStatus: Active');
    });

    it('should handle multiline interpolation', () => {
      const lines = 'line1\n  line2\n    line3';
      const result = doc`
    ${lines}
    end
  `;
      expect(result).toBe('  line1\nline2\n  line3\n  end');
    });

    it('should handle strings with empty lines between content during indentation processing', () => {
      const result = doc`
        First line

        Second line

        Third line
      `;
      expect(result).toBe('First line\n\nSecond line\n\nThird line');
    });

    it('should handle strings with empty lines that need indentation removal', () => {
      const result = doc`
        Line with content

        Another line with content
      `;
      expect(result).toBe('Line with content\n\nAnother line with content');
    });
  });

  describe('TypeScript support', () => {
    it('should have correct function signature', () => {
      expectTypeOf(doc).toBeFunction();
      expectTypeOf(doc).parameter(0).toEqualTypeOf<TemplateStringsArray>();
      expectTypeOf(doc).returns.toBeString();
    });

    it('should handle various interpolated value types', () => {
      const stringValue = 'string';
      const numberValue = 42;
      const booleanValue = true;
      const objectValue = { key: 'value' };
      const result = doc`
        String: ${stringValue}
        Number: ${numberValue}
        Boolean: ${booleanValue}
        Object: ${objectValue}
      `;
      expect(result).toBe('String: string\nNumber: 42\nBoolean: true\nObject: [object Object]');
    });
  });
});
