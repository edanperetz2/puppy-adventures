export const CLOCK_ACTIVITIES_ENABLED = false;

export const isPracticeAvailable = subject => subject !== 'clock' || CLOCK_ACTIVITIES_ENABLED;
