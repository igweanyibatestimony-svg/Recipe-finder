const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultsSection = document.getElementById("search-results");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const mealDetailsView = document.getElementById("meal-details");
const mealDetailsContent = document.getElementById("meal-details-content");
const backButton = document.getElementById("back-btn");
const loadingSpinner = document.getElementById("loading-spinner");
const loadingMessage = document.getElementById("loading-message");

const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const REQUEST_TIMEOUT_MS = 10000;

let searchResults = [];
let lastSearchTerm = "";
let searchController;
let detailController;
let searchRequestId = 0;
let detailRequestId = 0;
let activeRecipeButton;

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function addIcon(parent, className) {
    const icon = createElement("i", className);
    icon.setAttribute("aria-hidden", "true");
    parent.append(icon);
}

function safeHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
        return "";
    }
}

function setImage(image, source, alt) {
    const safeSource = safeHttpUrl(source);
    image.alt = alt || "Recipe image";
    image.loading = "lazy";
    image.decoding = "async";
    if (safeSource) image.src = safeSource;
    else image.hidden = true;
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
}

function showLoading(message) {
    loadingMessage.textContent = message;
    loadingSpinner.hidden = false;
}

function hideLoading() {
    loadingSpinner.hidden = true;
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.hidden = false;
}

function clearError() {
    errorContainer.hidden = true;
    errorMessage.textContent = "";
}

async function fetchJson(url, controller) {
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`The recipe service returned ${response.status}.`);
        return await response.json();
    } catch (error) {
        if (timedOut) throw new Error("The recipe service took too long to respond. Please try again.");
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function renderResults(meals) {
    mealsContainer.replaceChildren();
    const fragment = document.createDocumentFragment();

    meals.forEach((meal) => {
        const card = createElement("button", "recipe-card");
        card.type = "button";
        card.dataset.mealId = meal.idMeal || "";
        card.setAttribute("aria-label", `View recipe for ${meal.strMeal || "this meal"}`);

        const image = createElement("img", "meal-img");
        setImage(image, meal.strMealThumb, meal.strMeal);

        const info = createElement("div", "meal-info");
        const title = createElement("h3", "", meal.strMeal || "Untitled recipe");
        const category = createElement("p", "meal-category");
        addIcon(category, "fas fa-tags");
        category.append(` ${meal.strCategory || "Uncategorized"}`);
        const label = createElement("span", "view-recipe-label", "View Recipe");

        info.append(title, category, label);
        card.append(image, info);
        fragment.append(card);
    });

    mealsContainer.append(fragment);
}

function showResults() {
    mealDetailsView.hidden = true;
    resultsSection.hidden = false;
}

function renderDetails(meal) {
    mealDetailsContent.replaceChildren();
    const textContainer = createElement("div", "details-text-container");
    const header = createElement("header", "meal-details-header");
    const title = createElement("h2", "", meal.strMeal || "Untitled recipe");
    title.id = "meal-details-title";
    title.tabIndex = -1;
    const category = createElement("p", "meal-details-category");
    const categoryBadge = createElement("span", "");
    addIcon(categoryBadge, "fas fa-tag");
    categoryBadge.append(` ${meal.strCategory || "Uncategorized"}`);
    category.append(categoryBadge);
    header.append(title, category);

    if (meal.strArea) {
        const area = createElement("p", "meal-details-area");
        addIcon(area, "fas fa-globe");
        area.append(" Origin: ");
        area.append(createElement("strong", "", meal.strArea));
        header.append(area);
    }

    const instructions = createElement("section", "meal-details-instructions");
    const instructionsHeading = createElement("h3", "");
    addIcon(instructionsHeading, "fas fa-clipboard-list");
    instructionsHeading.append(" Instructions");
    instructions.append(instructionsHeading, createElement("p", "", meal.strInstructions || "No instructions provided."));

    const ingredientsSection = createElement("section", "meal-details-ingredients");
    const ingredientsHeading = createElement("h3", "");
    addIcon(ingredientsHeading, "fas fa-mortar-pestle");
    ingredientsHeading.append(" Ingredients");
    const ingredientsList = createElement("ul", "ingredients-list");
    for (let index = 1; index <= 20; index += 1) {
        const ingredient = meal[`strIngredient${index}`]?.trim();
        if (!ingredient) continue;
        const item = createElement("li", "");
        addIcon(item, "fas fa-check-circle");
        const measure = meal[`strMeasure${index}`]?.trim();
        item.append(`${measure ? `${measure} ` : ""}${ingredient}`);
        ingredientsList.append(item);
    }
    ingredientsSection.append(ingredientsHeading, ingredientsList);
    textContainer.append(header, instructions, ingredientsSection);

    const videoUrl = safeHttpUrl(meal.strYoutube);
    if (videoUrl) {
        const videoContainer = createElement("p", "youtube-link");
        const videoLink = createElement("a", "button", " Watch Video");
        videoLink.href = videoUrl;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
        addIcon(videoLink, "fab fa-youtube");
        videoLink.append(createElement("span", "sr-only", " (opens in a new tab)"));
        videoContainer.append(videoLink);
        textContainer.append(videoContainer);
    }

    const image = createElement("img", "meal-details-img");
    setImage(image, meal.strMealThumb, meal.strMeal);
    mealDetailsContent.append(textContainer, image);
}

async function searchMeals(searchTerm) {
    const requestId = ++searchRequestId;
    searchController?.abort();
    detailRequestId += 1;
    detailController?.abort();
    detailController = undefined;
    searchController = new AbortController();
    searchButton.disabled = true;
    clearError();
    showResults();
    showLoading(`Searching for “${searchTerm}”…`);

    try {
        const data = await fetchJson(`${BASE_URL}search.php?s=${encodeURIComponent(searchTerm)}`, searchController);
        if (requestId !== searchRequestId) return;

        searchResults = Array.isArray(data.meals) ? data.meals : [];
        lastSearchTerm = searchTerm;
        if (searchResults.length === 0) {
            renderResults([]);
            resultHeading.textContent = "No meals found. Try another search term.";
            showError(`No meals found for “${searchTerm}”. Try another search term.`);
            return;
        }

        renderResults(searchResults);
        resultHeading.textContent = `Showing ${searchResults.length} recipe${searchResults.length === 1 ? "" : "s"} for “${searchTerm}”`;
        resultHeading.focus();
    } catch (error) {
        if (requestId !== searchRequestId || error.name === "AbortError") return;
        console.error("Search error:", error);
        showError(error.message || "Failed to connect to the recipe service. Check your connection and try again.");
    } finally {
        if (requestId === searchRequestId) {
            hideLoading();
            searchButton.disabled = false;
            searchController = undefined;
        }
    }
}

async function openRecipe(button) {
    const mealId = button.dataset.mealId;
    if (!mealId || detailController) return;

    const requestId = ++detailRequestId;
    const controller = new AbortController();
    detailController = controller;
    activeRecipeButton = button;
    clearError();
    showLoading("Loading recipe details…");

    try {
        const data = await fetchJson(`${BASE_URL}lookup.php?i=${encodeURIComponent(mealId)}`, controller);
        if (requestId !== detailRequestId || controller.signal.aborted) return;
        const meal = data.meals?.[0];
        if (!meal) throw new Error("Could not load recipe details. Please try again.");

        renderDetails(meal);
        resultsSection.hidden = true;
        mealDetailsView.hidden = false;
        document.getElementById("meal-details-title").focus();
    } catch (error) {
        if (requestId === detailRequestId && error.name !== "AbortError") {
            console.error("Recipe lookup error:", error);
            showError(error.message || "Failed to load recipe details. Please try again.");
        }
    } finally {
        if (requestId === detailRequestId) {
            hideLoading();
            detailController = undefined;
        }
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showError("Please enter a search term for a meal.");
        searchInput.focus();
        return;
    }
    searchMeals(searchTerm);
});

mealsContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".recipe-card");
    if (button) openRecipe(button);
});

backButton.addEventListener("click", () => {
    detailRequestId += 1;
    detailController?.abort();
    detailController = undefined;
    hideLoading();
    showResults();
    clearError();
    if (searchResults.length) {
        resultHeading.textContent = `Showing ${searchResults.length} recipe${searchResults.length === 1 ? "" : "s"} for “${lastSearchTerm}”`;
    }
    activeRecipeButton?.focus();
});
