export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  link?: string;
  /** Optional photo. Drop the file in `public/events/` and reference it
   *  here as `/events/filename.jpg` — no import statement needed. */
  image?: string;
}

// No events shipped yet — first drop coming soon. Add entries here as
// they're scheduled; upcoming/past is derived from `date` at render time.
//
// To add an event photo later:
// 1. Drop the file in `public/events/` (e.g. `public/events/kickoff.jpg`)
// 2. Set `image: "/events/kickoff.jpg"` on the entry.
export const events: ClubEvent[] = [];
