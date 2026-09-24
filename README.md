# Indal Pizzeria

A responsive, one-page Swedish menu website inspired by the supplied QuickFood references. Built with plain HTML, CSS, and JavaScript. No application dependencies, install step, framework, or build step.

## Run locally

Requires Node.js 24 or newer.

```sh
npm run dev
```

Open http://127.0.0.1:5173. Stop the server with Ctrl+C. The server binds to the local machine only; it is a development convenience, not a production server.

For static hosting, publish `index.html`, `styles.css`, `script.js`, and the `assets/` folder. Do not publish the repository or development files. No deployment has been configured.

## Update the menu

All menu content is directly in `index.html`, so it remains available without JavaScript. The seven categories are Pizza, Kebabmeny, Sallader, Grill & pasta, Hamburgare, Tillbehör, and Drycker. Each `.menu-category` section contains tables with one row per item; Pizza has separate tables for its eight groups. Change the item number, name, description, and price in each row. Preserve the printed menu numbers, including gaps, so customers can identify dishes from the paper menu. When adding or removing rows, also update the category counts in the category navigation and section heading.

The menu contains 97 food items: 58 pizzas, 9 kebab dishes, 11 salads, 8 grill/pasta dishes, 7 burgers, and 4 sides. All prices are in Swedish kronor. The six drinks cost 15 kr each. The burger ingredients, new burgers, sides, and drink prices were updated from the restaurant’s supplied instructions; the two existing Järde burgers are retained in the burger category. Ordering, payment, and delivery have not been added.

Source photos and transcription decisions:

- `1000219523.jpg`: standard, special, and vegetarian pizzas. The handwritten grouped prices are used: pizza numbers 1, 2, and 8 cost 115 kr; the other standard pizzas cost 120 kr. Special and vegetarian pizzas cost 130 kr.
- `1000219524.jpg`: pork fillet and favorite pizzas, priced at the handwritten 140 kr.
- `1000219525.jpg`: beef fillet pizzas at the handwritten 155 kr and Bagarens special at 145 kr.
- `1000219526.jpg`: kebab dishes and their handwritten prices, with the common included ingredients.
- `1000219527.jpg`: salads at the handwritten group price of 130 kr, with the common included ingredients.
- `1000219528.jpg`: grill/pasta dishes and their handwritten prices. Järde burgare 90 g costs 135 kr and 150 g costs 155 kr.
- `1000219529.jpg`: inbakade pizzas 26–28. The handwritten prices are 130 kr for Calzone and 135 kr each for Calzone Capri and Calzone Special.
- `1000219530.jpg`: ingredients for favorite pizzas 44 (Azteka) and 45 (Prinsessa Victoria). Their 140 kr price comes from the group heading in `1000219524.jpg`.

Handwritten prices take precedence over the older printed prices. Crossed/marked pizza numbers 19 (Tarantino) and 22 (Devita), Hamburgare 200 g, and the grill dish Oxfilé are omitted pending confirmation. The children's menu is only partially visible and has not been added. Desserts remain excluded as requested. Pasta Genovese retains the photo's printed ingredient `pasto` pending clarification; it has not been silently changed to `pesto`. Source photos are reference material, not website assets.

The `#hitta-hit` section in `index.html`, immediately after the menu, contains the address, telephone number, opening hours, amenities, and approximate price per person. These details come from the supplied screenshot and have not been independently verified against live information. Edit them directly in that section, keeping the Google Maps destination and `tel:` link in sync with the visible address and phone number. The directions button opens Google Maps; no map is embedded.

`styles.css` contains layout, responsive styles, and color variables. `script.js` manages category highlighting, the header, and video controls. The video starts muted, respects reduced-motion preferences, pauses offscreen, and falls back to the poster if it cannot load. Users can pause or manually play it.

## Verification

```sh
npm run check
npm test
```

The syntax check covers the site script and local server. The eight Node HTTP tests cover static files, MIME types, HEAD requests, private-file protection, malformed paths, unsupported methods, and video byte ranges. There is no compilation, typecheck, or lint tool because this is a dependency-free static site.

Browser regression checklist:

- At desktop, 390px, and 320px widths, verify all seven sections (Pizza, Kebabmeny, Sallader, Grill & pasta, Hamburgare, Tillbehör, and Drycker) and 103 rows: 58 pizzas, 9 kebab dishes, 11 salads, 8 grill/pasta dishes, 7 burgers, 4 sides, and 6 drinks. Verify navigation and section counts match, all eight pizza groups appear, and long ingredient lists wrap without horizontal overflow. Check item descriptions are 16px on desktop and 15px on mobile, with item names at 17px and 16px respectively.
- Check food prices use kr, standard pizzas 1/2/8 cost 115 kr and the other standard pizzas cost 120 kr, pizzas 26/27/28 cost 130/135/135 kr, pizzas 44/45 cost 140 kr, and the shared pizza/kebab/salad ingredient notes remain visible. Verify all six drinks cost 15 kr, including Festis Apelsin and Festis Päron. Check the burger ingredients and side portion sizes against the supplied menu updates. Check crossed/marked items have not reappeared accidentally.
- Follow the hero and category links, including the last category on a tall desktop viewport; headings should remain below the sticky navigation.
- At desktop, 390px, and 320px widths, check that the information section follows the menu without horizontal overflow. Verify Härevägen 2, 855 97 Indal; 060-922 57; all seven days at 11:00–21:00; Uteservering; and the approximate 100–200 kr price per person.
- Verify the Google Maps link targets the displayed address, announces its new tab, and the phone link uses `tel:+466092257`. Both links should have visible keyboard focus and activate with Enter. When the information section reaches the navigation, no menu category should retain `aria-current`; scrolling back should restore the appropriate category.
- Use Tab and Enter for links and video controls, and verify the skip link appears on focus.
- Verify muted playback, pause/resume, and the poster when the video request fails.
- Enable reduced motion and reload: the video should not load or autoplay until explicitly played.
- Disable JavaScript: the menu, information section, map and phone links, anchor navigation, and poster should remain usable.

These browser flows should be automated in a browser test runner if the site grows to include interactive ordering or other application behavior.

## Asset sources

The page markup, CSS, script, and pizza icon were created for this project. The requested reference media is stored locally so the site does not call external hosts at runtime.

- Design references: https://www.ansonika.com/quickfood/ and https://www.ansonika.com/quickfood/detail_page.html
- `assets/hero.mp4`: https://www.ansonika.com/quickfood/video/intro.mp4
- `assets/hero-poster.jpg`: https://www.ansonika.com/quickfood/img/sub_header_home.jpg
- Menu thumbnails: `https://www.ansonika.com/quickfood/img/menu-thumb-{number}.jpg`, using numbers 1–6 and 17–24.
- Local Lato fonts: Google Fonts, weights 300/400/700, Latin and Latin Extended. License: `assets/Lato-OFL.txt`.

The reference video and photos are third-party assets; their reuse rights have not been verified. Confirm the appropriate license before public deployment, or replace them with licensed restaurant media.
