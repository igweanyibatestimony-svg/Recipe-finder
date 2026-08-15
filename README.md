# Recipe Finder

Recipe Finder is a lightweight static website for finding meals and viewing recipe details from TheMealDB.

## What it does

Enter a meal name or keyword, such as `chicken` or `pizza`, to search for matching recipes. Select a recipe card to view its ingredients, measurements, instructions, category, area of origin when available, and a YouTube video link when TheMealDB provides one.

## Main features

- Searches recipes by keyword.
- Shows responsive recipe cards with an image, title, and category.
- Opens a detailed recipe view without losing the search results.
- Returns to the previous search results with the Back to Recipes button.
- Handles empty searches, no matches, slow requests, request failures, and cancelled/stale requests.
- Supports mouse, touch, and keyboard interaction.

## How recipe search works

The app sends the encoded search term to TheMealDB's `search.php?s=` endpoint. It displays the returned meals as cards. Starting a new search cancels an earlier request so an older response cannot replace newer results.

## Recipe details

Selecting a card requests the selected meal from TheMealDB's `lookup.php?i=` endpoint. The details view displays up to 20 ingredient and measurement pairs, recipe instructions, and an optional external YouTube link. If loading details fails, the current search results remain available.

## Technologies

- HTML5
- CSS3, including responsive media queries
- Vanilla JavaScript using the Fetch API and DOM APIs
- Font Awesome icons and the Inter web font

## TheMealDB API

Recipe data is provided by [TheMealDB](https://www.themealdb.com/api.php). This project uses its public recipe search and lookup endpoints directly from the browser. Availability and completeness of recipe data depend on TheMealDB.

## Project structure

```
index.html  # Page structure and external asset references
style.css   # Site styling and responsive layout
script.js   # Search, detail, state, and API logic
README.md   # Project documentation
```

## Run locally

This is a static website with no installation or build step.

1. Download or clone the repository.
2. Open `index.html` in a modern browser, or serve the repository directory with any static web server.
3. Use the search field to find a meal.

An internet connection is required for TheMealDB, Font Awesome, and the Inter font.

## Responsive behavior

The layout is mobile-first. It uses a single recipe-card column on small phones, two columns on larger phones and tablets, and three columns on wider desktop screens. Recipe details stack on small screens and place the image beside the content on tablet and desktop screens.

## Limitations

- The app only searches and displays data supplied by TheMealDB.
- It does not save favorites, search history, or recipes locally.
- A recipe may omit fields such as an image, origin, instructions, or a video link.
- Third-party font and icon CDNs must be reachable for their enhanced typography and icons to load.
