export const CLOCK_ACTIVITIES_ENABLED = false;
const pausedChapters = new Set(['boatyard', 'theater']);
export const isChapterAvailable = id => !pausedChapters.has(id);
export const SCIENCE_ACTIVITIES_ENABLED = false;

export function isPracticeAvailable(subject) {
  if (subject === 'science') return SCIENCE_ACTIVITIES_ENABLED;
  if (subject === 'clock') return CLOCK_ACTIVITIES_ENABLED;
  return true;
}
