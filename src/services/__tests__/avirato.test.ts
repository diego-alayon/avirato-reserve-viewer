import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AviratoService } from '@/services/avirato';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AviratoService', () => {
  let service: AviratoService;

  beforeEach(() => {
    service = new AviratoService();
    mockFetch.mockReset();
  });

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns false when token is expired', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem('avirato_token', 'fake-token');
      localStorage.setItem('avirato_token_expiry', pastDate);
      localStorage.setItem('avirato_web_codes', JSON.stringify([1]));

      // New instance to pick up localStorage
      const freshService = new AviratoService();
      expect(freshService.isAuthenticated()).toBe(false);
    });

    it('returns true when token is valid and not expired', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      localStorage.setItem('avirato_token', 'valid-token');
      localStorage.setItem('avirato_token_expiry', futureDate);
      localStorage.setItem('avirato_web_codes', JSON.stringify([123]));

      const freshService = new AviratoService();
      expect(freshService.isAuthenticated()).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('stores token on successful auth', async () => {
      const mockResponse = {
        status: 'success',
        data: {
          token: 'test-token-123',
          web_codes: [456],
          expiry: new Date(Date.now() + 3600000).toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.authenticate({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result.status).toBe('success');
      expect(localStorage.getItem('avirato_token')).toBe('test-token-123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('throws on failed authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Invalid credentials'),
      });

      await expect(
        service.authenticate({ email: 'bad@test.com', password: 'wrong' })
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('clearToken', () => {
    it('removes all auth data from localStorage', () => {
      localStorage.setItem('avirato_token', 'token');
      localStorage.setItem('avirato_web_codes', '[1]');
      localStorage.setItem('avirato_token_expiry', 'date');

      service.clearToken();

      expect(localStorage.getItem('avirato_token')).toBeNull();
      expect(localStorage.getItem('avirato_web_codes')).toBeNull();
      expect(localStorage.getItem('avirato_token_expiry')).toBeNull();
    });
  });

  describe('getWebCodes', () => {
    it('returns empty array when not authenticated', () => {
      expect(service.getWebCodes()).toEqual([]);
    });

    it('returns web codes from localStorage', () => {
      localStorage.setItem('avirato_web_codes', JSON.stringify([100, 200]));
      const freshService = new AviratoService();
      expect(freshService.getWebCodes()).toEqual([100, 200]);
    });
  });

  describe('getReservations', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getReservations()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getBillingForReservation', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getBillingForReservation(1, 1)).rejects.toThrow('Not authenticated');
    });
  });

  describe('getPaymentsByReservation', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getPaymentsByReservation(1, 1)).rejects.toThrow('Not authenticated');
    });
  });

  describe('getRegimes', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getRegimes(1)).rejects.toThrow('Not authenticated');
    });
  });

  describe('getOperators', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getOperators(1)).rejects.toThrow('Not authenticated');
    });
  });

  describe('getExtras', () => {
    it('throws when not authenticated', async () => {
      await expect(service.getExtras(1)).rejects.toThrow('Not authenticated');
    });
  });
});
