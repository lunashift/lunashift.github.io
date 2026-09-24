// The official Luna Shift captures, each composited into the real iPhone render by
// scripts/optimize-images.mjs. Rendered size is 870x1800 (device, not screen).
export type ScreenId =
  | 'today-home-hero'
  | 'today-factors'
  | 'hormone-therapy-overview'
  | 'log-a-dose'
  | 'patterns-calendar-hot-flash'
  | 'patterns-trend-time-of-day'
  | 'patterns-night-sweat-trend'
  | 'patterns-sleep-and-heart'
  | 'patterns-apple-health'
  | 'insights-weekly-summary'
  | 'insights-whats-shifting'
  | 'settings-and-connections'
  | 'no-account'
  | 'paced-breathing'
  | 'paced-breathing-complete'

export const PHONE_W = 870
export const PHONE_H = 1800

export const screenAlt: Record<ScreenId, string> = {
  'today-home-hero':
    'Luna Shift Today screen: a greeting, a 7 out of 10 score marked easing, 54 entries logged this week, and one-tap buttons for hot flash, night sweat, mood, sleep and brain fog',
  'today-factors':
    "Today's factors on the Today screen: alcohol, poor sleep, exercise and supplement, with a gentle note on what today may mean and a cooling suggestion",
  'hormone-therapy-overview':
    'Hormone Therapy screen: the next estrogen patch dose in 9 hours, a Log a dose button, supplement scanning, and 89% adherence over the last four weeks',
  'log-a-dose':
    'Log a dose sheet with hormone, how it is taken, amount, status, date and time, and an optional note',
  'patterns-calendar-hot-flash':
    'Patterns screen: a September calendar shaded by symptom load with plum dots for logged doses, above a 30-day hot flash trend',
  'patterns-trend-time-of-day':
    'A 30-day hot flash trend and a time-of-day chart showing hot flashes most often logged between 13:00 and 16:00',
  'patterns-night-sweat-trend':
    'Patterns calendar with a 30-day night sweat trend in purple below it',
  'patterns-sleep-and-heart':
    'A 30-day sleep trend beside Apple Health context: resting heart rate 58 bpm, HRV 48 ms, 7.7k steps a day and 115 minutes of workouts',
  'patterns-apple-health':
    'An Apple Health summary of the last 7 days with resting heart rate, HRV, steps, workouts, sleep and weight, shown for context only',
  'insights-weekly-summary':
    'Insights screen: hot flashes down 53% this week, 8 versus 17 last week, with a shareable card and a symptom check-in scoring 8 of 44',
  'insights-whats-shifting':
    'Symptom check-in results split by category, above a list of what is shifting: night sweats down 33%, sleep steady, insomnia down 50%',
  'settings-and-connections':
    'Settings sheet with a daily check-in reminder and Apple Health connections for sleep, menstrual flow, heart rate and weight, each switched on by choice',
  'no-account':
    'A No account needed screen: a shield above the line that what you log stays on your phone and backs up to your own iCloud, with nothing to sign up for and no copy of your health data on any server',
  'paced-breathing': 'The paced breathing exercise part-way through, on cycle 4 of 9',
  'paced-breathing-complete':
    'The paced breathing exercise on its final cycle, with 15 sessions and 43 calm minutes logged',
}

export const screenSrc = (id: ScreenId, w: 520 | 870) => `${import.meta.env.BASE_URL}screens/${id}-${w}.webp`
