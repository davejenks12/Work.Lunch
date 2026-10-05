# WorkLunch — Discover Perfect Nearby Lunch Spots 🍱

Live Website: **[https://worklunch.co.uk](https://worklunch.co.uk)**

WorkLunch is a modern single-page web app built with HTML, Tailwind CSS, and Vanilla JavaScript. It helps users quickly discover nearby lunch places tailored to dietary preferences, walking time durations, price ranges, and cravings.

## Features

- **Personalized Dietary Filters**: Saved in `localStorage` with a persistent active banner and a quick `🍽️ No Dietary Requirements` CTA button.
- **Location Input & Autocomplete**: HTML5 Geolocation API with automatic detected location badge, plus OpenStreetMap Nominatim live address autocomplete.
- **Walking Duration Selection**: Choose between `5 Mins`, `10 Mins`, `15 Mins`, and `20+ Mins` walking times.
- **100% Free Open-Source Map View (Default)**: Direct OpenStreetMap tile integration (`tile.openstreetmap.org`) styled with dark mode CSS filters.
- **Rich Restaurant Cards**: Displays Google Ratings (`⭐ 4.8 (240+ reviews)`), Google review summaries, photos, walk times, and directions links.
- **Pluggable Google Places API**: Configurable via `config.js` (`window.WORKLUNCH_CONFIG`) or in-app Settings modal.
- **Vercel Web Analytics**: Native Vercel Insights integration.

## License

Apache-2.0
