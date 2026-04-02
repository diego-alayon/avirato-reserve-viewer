import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/utils/logger';

describe('logger', () => {
  it('exposes debug, info, warn, error, and log methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.log).toBe('function');
  });

  it('warn calls console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warning');
    expect(spy).toHaveBeenCalledWith('[WARN]', 'test warning');
  });

  it('error calls console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(spy).toHaveBeenCalledWith('[ERROR]', 'test error');
  });
});
