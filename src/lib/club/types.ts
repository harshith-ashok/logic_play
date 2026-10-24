export interface ClubEvent {
  id: string;
  slug: string;
  title: string;
  tag: string | null;
  summary: string | null;
  details: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  rsvp_link: string | null;
  cover_url: string | null;
  published: boolean;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  note: string | null;
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  path: string | null;
  caption: string | null;
}

export interface Album {
  id: string;
  event_id: string | null;
  title: string;
  album_date: string | null;
  /** Filled by the list query: first photo and total count. */
  cover: string | null;
  count: number;
}

export type EventInput = Omit<ClubEvent, "id">;
