export interface GalleryItem {
  id: string;
  title: string;
  /** Path to the image. Drop the file in `public/gallery/` and reference it
   *  here as `/gallery/filename.jpg` — no import statement needed. */
  image: string;
  alt: string;
  /** ISO date string (e.g. "2026-03-14") — shown as the tile's caption date. */
  date?: string;
  /** Optional filter bucket, e.g. "hackathon", "workshop", "talk", "social".
   *  The filter bar on the Gallery page is built from whatever is used here
   *  and hidden entirely when no item sets it. */
  category?: string;
}

// Empty-state-first: zero real photos yet. The grid renders placeholder
// tiles for any remaining empty slots.
//
// To add a photo later:
// 1. Drop the file in `public/gallery/` (e.g. `public/gallery/build-night.jpg`)
// 2. Add an entry below, e.g.:
//    {
//      id: "build-night-2026",
//      title: "Build Night",
//      image: "/gallery/build-night.jpg",
//      alt: "Members working on laptops during the first build night",
//      date: "2026-03-14",
//      category: "social",
//    }
export const galleryItems: GalleryItem[] = [];
