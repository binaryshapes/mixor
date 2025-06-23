import { describe, expect, it } from 'vitest';

import { getMetadata, setMetadata } from '../src/metadata';

describe('Metadata', () => {
  describe('setMetadata', () => {
    it('should set metadata on an object', () => {
      const obj = {};
      const metadata = { name: 'test', version: 1 };

      const result = setMetadata(obj, metadata);

      expect(result).toBe(obj);
      expect(getMetadata(result)).toEqual(metadata);
    });

    it('should overwrite existing metadata', () => {
      const obj = {};
      const initialMetadata = { name: 'initial' };
      const newMetadata = { name: 'updated', version: 2 };

      setMetadata(obj, initialMetadata, { mode: 'overwrite' });
      const result = setMetadata(obj, newMetadata);

      expect(result).toBe(obj);
      expect(getMetadata(result)).toEqual(newMetadata);
    });

    it('should merge existing metadata', () => {
      const obj = {};
      const initialMetadata = { name: 'initial', description: 'initial description' };
      const newMetadata = { name: 'updated', version: 2 };

      setMetadata(obj, initialMetadata, { mode: 'merge' });
      const result = setMetadata(obj, newMetadata, { mode: 'merge' });

      expect(result).toBe(obj);
      expect(getMetadata(result)).toEqual({
        name: 'updated',
        description: 'initial description',
        version: 2,
      });
    });

    it('should throw TypeError when trying to overwrite non-writable metadata', () => {
      const obj = {};
      const initialMetadata = { name: 'initial' };
      const newMetadata = { name: 'updated' };

      setMetadata(obj, initialMetadata);

      expect(() => setMetadata(obj, newMetadata)).toThrow(
        'Metadata already exists, cannot be overwritten',
      );
    });

    it('should work with complex objects', () => {
      const obj = { value: 42 };
      const metadata = {
        tags: ['test', 'metadata'],
        config: { enabled: true, timeout: 1000 },
      };

      const result = setMetadata(obj, metadata);

      expect(result).toBe(obj);
      expect(getMetadata(result)).toEqual(metadata);
    });
  });

  describe('getMetadata', () => {
    it('should retrieve metadata from an object', () => {
      const obj = {};
      const metadata = { name: 'test' };

      setMetadata(obj, metadata);
      const result = getMetadata(obj);

      expect(result).toEqual(metadata);
    });

    it('should throw error when no metadata exists', () => {
      const obj = {};
      expect(() => getMetadata(obj)).toThrow('Metadata not found');
    });

    it('should preserve metadata type information', () => {
      interface TestMetadata extends Record<string, unknown> {
        id: number;
        name: string;
      }

      const obj = {};
      const metadata: TestMetadata = { id: 1, name: 'test' };

      setMetadata<TestMetadata>(obj, metadata);
      const result = getMetadata<TestMetadata>(obj);

      expect(result).toEqual(metadata);
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });

    it('should work with empty metadata object', () => {
      const obj = {};
      const metadata = {};

      setMetadata(obj, metadata);
      const result = getMetadata(obj);

      expect(result).toEqual({});
    });
  });
});
