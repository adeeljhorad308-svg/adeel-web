import { describe, expect, it } from 'vitest';
import { validateUpload } from '@/lib/media/validation';

/**
 * Media upload validation tests (Stage 5 §21; OWASP file-upload defense). Builds
 * minimal real magic-number headers rather than mocking, so the test exercises
 * the actual byte-sniffing logic.
 */
describe('validateUpload', () => {
  it('accepts a valid PNG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0]);
    const result = validateUpload(png, 'image/png', 1000);
    expect(result.sniffedMime).toBe('image/png');
    expect(result.category).toBe('image');
  });

  it('accepts a valid PDF', () => {
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateUpload(pdf, 'application/pdf', 5000);
    expect(result.category).toBe('document');
  });

  it('rejects a Windows executable disguised with an image extension', () => {
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);
    expect(() => validateUpload(exe, 'image/png', 1000)).toThrow();
  });

  it('rejects an ELF executable', () => {
    const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]);
    expect(() => validateUpload(elf, 'application/octet-stream', 1000)).toThrow();
  });

  it('rejects a shell script disguised as a document', () => {
    const script = Buffer.from('#!/bin/bash\nrm -rf /', 'utf8');
    expect(() => validateUpload(script, 'application/pdf', 100)).toThrow();
  });

  it('rejects a mismatched declared MIME vs actual content', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => validateUpload(png, 'application/pdf', 1000)).toThrow();
  });

  it('rejects a file exceeding the size limit for its category', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const tooLarge = 50 * 1024 * 1024; // over the 10MB image cap
    expect(() => validateUpload(png, 'image/png', tooLarge)).toThrow();
  });

  it('rejects unrecognizable content', () => {
    const junk = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    expect(() => validateUpload(junk, 'image/png', 100)).toThrow();
  });
});
