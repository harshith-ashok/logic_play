export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  /** RSVP / registration link. The RSVP button only shows when this is set. */
  link?: string;
  /** Short category label, e.g. "Hackathon", "Workshop". */
  tag?: string;
  /** Extra meta chips, e.g. ["Sat–Sun", "Tech Park, Lab 3", "In-person"]. */
  meta?: string[];
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
