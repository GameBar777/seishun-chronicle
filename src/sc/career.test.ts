import { describe, it, expect } from 'vitest';
import { jobN } from './engine';
describe('jobN', () => {
  it('rewords exam title/narration for 就職 only', () => {
    expect(jobN('受験', '就職')).toBe('採用試験');
    expect(jobN('受験', '大学')).toBe('受験');
    expect(jobN('試験当日の朝。手が冷たい。', '就職')).toContain('採用試験');
  });
});
