export interface Announcement {
  text: string;
  link?: string;
}

// Small banner shown at the top of the hero. Set to `null` to hide it
// entirely (e.g. when there's nothing to announce). Swap `text`/`link`
// here whenever there's club news — no other file needs to change.
export const announcement: Announcement | null = {
  text: "Recruiting is open for our first batch of members.",
  link: "#join",
};
