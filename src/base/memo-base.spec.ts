import { DEFAULT_RESOLVER } from './memo-base.constants';

describe('memo-base.constants.ts', () => {

  describe('DEFAULT_RESOLVER', () => {

    it('should return any argument(s) we pass in as a square-bracket wrapped comma-n-space-separated list of stringified arguments', () => {
      const defaultResolver = DEFAULT_RESOLVER;

      // Single argument:
      expect(defaultResolver('foo')).toBe('[\'foo\']');
      expect(defaultResolver(42)).toBe('[42]');
      expect(defaultResolver(true)).toBe('[true]');
      expect(defaultResolver(false)).toBe('[false]');
      expect(defaultResolver(null)).toBe('[null]');
      expect(defaultResolver(undefined)).toBe('[undefined]');

      // Multi argument:
      expect(defaultResolver('foo', 42, true)).toBe('[\'foo\', 42, true]');
      expect(defaultResolver(42, true, false)).toBe('[42, true, false]');
      expect(defaultResolver(true, false, null)).toBe('[true, false, null]');
      expect(defaultResolver(false, null, undefined)).toBe('[false, null, undefined]');
      expect(defaultResolver(null, undefined, 'foo')).toBe('[null, undefined, \'foo\']');
      expect(defaultResolver(undefined, 'foo', 42)).toBe('[undefined, \'foo\', 42]');
    });

  });
});
