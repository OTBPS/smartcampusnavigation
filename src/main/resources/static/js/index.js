(function () {
const NUIST_CAMPUS_CENTER = [118.716051, 32.202484];
    const WEATHER_REFRESH_INTERVAL_MS = 60 * 1000;
const MAX_ROUTE_WAYPOINTS = 5;
    const SAVED_STORAGE_KEY = "smartCampus.savedPlaces.v1";
    const SAVED_UNCATEGORIZED_KEY = "Uncategorized";
    const MAX_SAVED_PLACE_NAME_LENGTH = 80;
    const CLASS_PERIOD_STARTS = [
        { period: 1, minuteOfDay: 8 * 60 },
        { period: 2, minuteOfDay: 10 * 60 + 10 },
        { period: 3, minuteOfDay: 13 * 60 + 45 },
        { period: 4, minuteOfDay: 15 * 60 + 55 },
        { period: 5, minuteOfDay: 18 * 60 + 45 },
        { period: 6, minuteOfDay: 20 * 60 + 35 }
    ];
    const CLASS_PEAK_LEAD_MINUTES = 20;
    const DRAWER_MODES = {
        SEARCH_HOME: "search-home",
        SEARCH_RESULTS: "search-results",
        POI_DETAIL: "poi-detail",
        ROUTE_PLANNING: "route-planning",
        SAVED: "saved",
        RECENTS: "recents",
        WEATHER: "weather"
    };
    const DRAWER_TITLES = {
        "search-home": "Search",
        "search-results": "Search Results",
        "poi-detail": "POI Details",
        "route-planning": "Route Planning",
        "saved": "Saved",
        "recents": "Recents",
        "weather": "Current Weather"
    };
    const DRAWER_SUBTITLES = {
        "search-home": "Find places and start navigation.",
        "search-results": "Browse matched POIs and choose your next action.",
        "poi-detail": "Review location details before planning a route.",
        "route-planning": "Set route points and compare available options.",
        "saved": "Browse saved places grouped by exact POI type.",
        "recents": "Reuse, edit, or clean recent navigation records.",
        "weather": "Live campus weather from the existing weather service."
    };

    const state = {
        pois: [],
        allPoiTypes: [],
        selectedPoiId: null,
        selectedPoi: null,
        weather: null,
        map: null,
        marker: null,
        currentLocationMarker: null,
        currentLocation: null,
        infoWindow: null,
        mapReady: false,
        routeStartPoi: null,
        routeEndPoi: null,
        routeViaPois: [],
        routeStartMarker: null,
        routeEndMarker: null,
        routeViaMarkers: [],
        routeLine: null,
        routeMode: "walking",
        routeAlternatives: [],
        selectedRouteAlternativeIndex: 0,
        routePanelState: "empty",
        routeAdvice: null,
        routePlanRequestId: 0,
        pendingRecommendedApply: false,
        recommendedApplyBackup: null,
        activeCategory: "",
        routeHistories: [],
        historyKeyword: "",
        historyRouteMode: false,
        searchCardsVisible: false,
        pendingMapClickPoi: null,
        weatherRefreshTimer: null,
        weatherLoading: false,
        mapStatusTimer: null,
        mapToastTimer: null,
        savedPlaces: [],
        savedActiveType: "",
        savedSelectedRecordKey: "",
        uiMode: DRAWER_MODES.SEARCH_HOME,
        uiBackStack: [],
        searchContext: null,
        searchSuggestions: [],
        searchSuggestionLoading: false,
        searchSuggestionKeyword: "",
        highlightedSuggestionIndex: -1,
        searchSuggestionRequestId: 0,
        searchSuggestionDebounceTimer: null,
        searchInputFocused: false,
        searchHomeOverlayActive: false
    };

    const elements = {
        mainLayout: document.querySelector(".main-layout"),
        iconRail: document.getElementById("icon-rail"),
        railItems: Array.from(document.querySelectorAll("[data-rail-mode]")),
        drawerHeader: document.getElementById("drawer-header"),
        drawerBackBtn: document.getElementById("drawer-back-btn"),
        drawerTitle: document.getElementById("drawer-title"),
        drawerSubtitle: document.getElementById("drawer-subtitle"),
        searchForm: document.getElementById("poi-search-form"),
        leftPanel: document.getElementById("left-panel"),
        searchCard: document.getElementById("search-card"),
        resetBtn: document.getElementById("reset-btn"),
        searchName: document.getElementById("search-name"),
        searchType: document.getElementById("search-type"),
        searchClearBtn: document.getElementById("search-clear-btn"),
        searchOpenRouteBtn: document.getElementById("search-open-route-btn"),
        searchSuggestionPanel: document.getElementById("search-suggestion-panel"),
        searchSuggestionList: document.getElementById("search-suggestion-list"),
        searchSuggestionEmpty: document.getElementById("search-suggestion-empty"),
        searchFeedback: document.getElementById("search-feedback"),
        resultsCard: document.getElementById("results-card"),
        detailCard: document.getElementById("detail-card"),
        routeCard: document.getElementById("route-card"),
        resultCount: document.getElementById("result-count"),
        resultList: document.getElementById("result-list"),
        resultEmpty: document.getElementById("result-empty"),
        detailEmpty: document.getElementById("detail-empty"),
        detailContent: document.getElementById("detail-content"),
        detailName: document.getElementById("detail-name"),
        detailType: document.getElementById("detail-type"),
        detailDescription: document.getElementById("detail-description"),
        detailOpeningHours: document.getElementById("detail-opening-hours"),
        detailEnabled: document.getElementById("detail-enabled"),
        detailHeroSubtitle: document.getElementById("detail-hero-subtitle"),
        detailCoordinates: document.getElementById("detail-coordinates"),
        detailCoordinatesItem: document.getElementById("detail-coordinates-item"),
        setStartBtn: document.getElementById("set-start-btn"),
        setEndBtn: document.getElementById("set-end-btn"),
        setViaBtn: document.getElementById("set-via-btn"),
        openRouteBtn: document.getElementById("open-route-btn"),
        detailSaveBtn: document.getElementById("detail-save-btn"),
        detailContext: document.getElementById("detail-context"),
        locateCurrentBtn: document.getElementById("locate-current-btn"),
        routeStartName: document.getElementById("route-start-name"),
        routeEndName: document.getElementById("route-end-name"),
        routeStartClearBtn: document.getElementById("route-start-clear-btn"),
        routeEndClearBtn: document.getElementById("route-end-clear-btn"),
        routeWaypointList: document.getElementById("route-waypoint-list"),
        addWaypointBtn: document.getElementById("add-waypoint-btn"),
        routeSwapBtn: document.getElementById("route-swap-btn"),
        routeMode: document.getElementById("route-mode"),
        routeModeWalkingBtn: document.getElementById("route-mode-walking-btn"),
        routeModeCyclingBtn: document.getElementById("route-mode-cycling-btn"),
        routeUseCurrentStartBtn: document.getElementById("route-use-current-start-btn"),
        planRouteBtn: document.getElementById("plan-route-btn"),
        clearRouteBtn: document.getElementById("clear-route-btn"),
        routeFeedback: document.getElementById("route-feedback"),
        routeAlternativeWrap: document.getElementById("route-alternative-wrap"),
        routeAlternativeList: document.getElementById("route-alternative-list"),
        routeAdviceBlock: document.getElementById("route-advice-block"),
        routeAdviceRisk: document.getElementById("route-advice-risk"),
        routeAdviceText: document.getElementById("route-advice-text"),
        routeAdviceWaypoint: document.getElementById("route-advice-waypoint"),
        routeAdviceApplyBtn: document.getElementById("route-advice-apply-btn"),
        routeSummary: document.getElementById("route-summary"),
        routeDistance: document.getElementById("route-distance"),
        routeDuration: document.getElementById("route-duration"),
        routeSteps: document.getElementById("route-steps"),
        routeEmptyState: document.getElementById("route-empty-state"),
        weatherCard: document.getElementById("weather-card"),
        weatherDetailContent: document.getElementById("weather-detail-content"),
        weatherStatus: document.getElementById("weather-status"),
        weatherEmptyState: document.getElementById("weather-empty-state"),
        weatherText: document.getElementById("weather-text"),
        weatherTemp: document.getElementById("weather-temp"),
        weatherFeelsLike: document.getElementById("weather-feels-like"),
        weatherHumidity: document.getElementById("weather-humidity"),
        weatherWind: document.getElementById("weather-wind"),
        weatherUpdated: document.getElementById("weather-updated"),
        mapWeatherText: document.getElementById("map-weather-text"),
        mapWeatherTemp: document.getElementById("map-weather-temp"),
        mapWeatherWind: document.getElementById("map-weather-wind"),
        mapContainer: document.getElementById("map-container"),
        mapPanel: document.querySelector(".map-panel"),
        mapRoutePointMenu: document.getElementById("map-route-point-menu"),
        mapMenuSetStart: document.getElementById("map-menu-set-start"),
        mapMenuSetEnd: document.getElementById("map-menu-set-end"),
        mapMenuSetVia: document.getElementById("map-menu-set-via"),
        mapMenuSavePlace: document.getElementById("map-menu-save-place"),
        mapCategoryQuickPanel: document.getElementById("map-category-quick-panel"),
        mapCategoryButtons: Array.from(document.querySelectorAll(".map-category-btn")),
        historyCount: document.getElementById("history-count"),
        historyStatus: document.getElementById("history-status"),
        historyPanel: document.getElementById("history-panel"),
        historySearchInput: document.getElementById("history-search-input"),
        historySearchBtn: document.getElementById("history-search-btn"),
        historyResetBtn: document.getElementById("history-reset-btn"),
        historyList: document.getElementById("history-list"),
        historyEmpty: document.getElementById("history-empty"),
        historyCleanModal: document.getElementById("history-clean-modal"),
        historyCleanConfirmBtn: document.getElementById("history-clean-confirm-btn"),
        historyCleanCancelBtn: document.getElementById("history-clean-cancel-btn"),
        savedCard: document.getElementById("saved-card"),
        savedLayout: document.getElementById("saved-layout"),
        savedTypeList: document.getElementById("saved-type-list"),
        savedTypeEmpty: document.getElementById("saved-type-empty"),
        savedItemTitle: document.getElementById("saved-item-title"),
        savedItemList: document.getElementById("saved-item-list"),
        savedItemEmpty: document.getElementById("saved-item-empty"),
        suggestionCard: document.getElementById("suggestion-card"),
        suggestionTitle: document.getElementById("suggestion-title"),
        suggestionList: document.getElementById("suggestion-list"),
        suggestionStatus: document.getElementById("suggestion-status"),
        classPeakStatus: document.getElementById("class-peak-status"),
        mapToast: document.getElementById("map-toast"),
        mapStatus: document.getElementById("map-status")
    };

    async function init() {
        bindEvents();
        loadSavedPlacesFromStorage();
        setUiMode(DRAWER_MODES.SEARCH_HOME, {force: true, resetBackStack: true});
        setSearchCardsVisible(false);
        setActiveCategoryButton("");
        handleSearchInputChanged();
        await loadPoiTypes();
        renderRouteSelection();
        loadWeatherSummary();
        startWeatherAutoRefresh();
        updateClassPeakStatus();
        await loadRouteHistoryList("");
        loadContextSuggestions({
            sceneType: "home"
        });
        await initMap();
        requestCurrentLocationOnEntry();
    }

    function bindEvents() {
        if (elements.iconRail) {
            elements.iconRail.addEventListener("click", function (event) {
                const railButton = event.target.closest("[data-rail-mode]");
                if (!railButton) {
                    return;
                }
                const mode = normalizeInput(railButton.dataset.railMode).toLowerCase();
                if (!mode) {
                    return;
                }
                if (mode === "search") {
                    setUiMode(DRAWER_MODES.SEARCH_HOME, {resetBackStack: true});
                    return;
                }
                if (mode === DRAWER_MODES.SAVED
                    || mode === DRAWER_MODES.RECENTS
                    || mode === DRAWER_MODES.WEATHER) {
                    setUiMode(mode, {resetBackStack: true});
                }
            });
        }

        if (elements.drawerBackBtn) {
            elements.drawerBackBtn.addEventListener("click", function () {
                goBackDrawerMode();
            });
        }

        elements.searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            if (trySelectSuggestionWithKeyboard()) {
                return;
            }
            runSearch();
        });

        if (elements.searchName) {
            elements.searchName.addEventListener("input", function () {
                handleSearchInputChanged();
            });

            elements.searchName.addEventListener("focus", function () {
                state.searchInputFocused = true;
                handleSearchInputChanged();
                syncSearchHomeOverlayLayout();
            });

            elements.searchName.addEventListener("blur", function () {
                window.setTimeout(function () {
                    state.searchInputFocused = false;
                    const keyword = normalizeInput(elements.searchName ? elements.searchName.value : "");
                    if (keyword.length < 2 && !isSearchSuggestionPanelVisible()) {
                        setSearchSuggestionPanelVisible(false);
                    }
                    syncSearchHomeOverlayLayout();
                }, 80);
            });

            elements.searchName.addEventListener("keydown", function (event) {
                handleSuggestionKeyDown(event);
            });
        }

        if (elements.searchSuggestionList) {
            elements.searchSuggestionList.addEventListener("mousedown", function (event) {
                const item = event.target.closest("[data-suggestion-index]");
                if (!item) {
                    return;
                }
                event.preventDefault();
                const index = Number(item.dataset.suggestionIndex);
                selectSearchSuggestionByIndex(index);
            });
        }

        if (elements.searchClearBtn) {
            elements.searchClearBtn.addEventListener("click", function () {
                clearSearchInputAndSuggestions();
            });
        }

        if (elements.searchOpenRouteBtn) {
            elements.searchOpenRouteBtn.addEventListener("click", function () {
                ensureRoutePlanningCardVisible({pushSearchFlow: true});
            });
        }

        if (elements.resetBtn) {
            elements.resetBtn.addEventListener("click", function () {
                setUiMode(DRAWER_MODES.SEARCH_HOME, {resetBackStack: true});
                elements.searchName.value = "";
                elements.searchType.value = "";
                state.activeCategory = "";
                setActiveCategoryButton("");
                state.selectedPoi = null;
                state.selectedPoiId = null;
                state.pois = [];
                clearSearchSuggestions(true);
                renderResultList();
                clearDetail(false);
                setHistoryRouteMode(false);
                setSearchCardsVisible(false);
                clearRouteAll(true);
                setFeedback("Ready.");
            });
        }

        elements.resultList.addEventListener("click", function (event) {
            const actionButton = event.target.closest("[data-result-action]");
            if (actionButton) {
                const poiIdFromAction = Number(actionButton.dataset.poiId);
                if (!Number.isFinite(poiIdFromAction)) {
                    return;
                }
                const action = normalizeInput(actionButton.dataset.resultAction).toLowerCase();
                if (action === "view") {
                    selectPoi(poiIdFromAction);
                    return;
                }
                if (action === "route") {
                    setRouteDestinationFromResult(poiIdFromAction);
                    return;
                }
            }

            const item = event.target.closest("[data-poi-id]");
            if (!item) {
                return;
            }
            const poiId = Number(item.dataset.poiId);
            if (!Number.isFinite(poiId)) {
                return;
            }
            selectPoi(poiId);
        });

        elements.setStartBtn.addEventListener("click", function () {
            assignRoutePoint("start");
        });

        elements.setEndBtn.addEventListener("click", function () {
            assignRoutePoint("end");
        });

        elements.setViaBtn.addEventListener("click", function () {
            assignRoutePoint("via");
        });

        if (elements.openRouteBtn) {
            elements.openRouteBtn.addEventListener("click", function () {
                openRoutePlannerFromDetail();
            });
        }

        if (elements.detailSaveBtn) {
            elements.detailSaveBtn.addEventListener("click", function () {
                if (!state.selectedPoi) {
                    window.alert("Please select a place first.");
                    return;
                }
                const saved = savePlaceToSavedList(state.selectedPoi, "poi-detail");
                showMapToast("Saved \"" + saved.name + "\".");
                refreshDetailSaveButtonState();
            });
        }

        if (elements.locateCurrentBtn) {
            elements.locateCurrentBtn.addEventListener("click", function () {
                locateCurrentPosition();
            });
        }

        elements.planRouteBtn.addEventListener("click", function () {
            planWalkingRoute();
        });

        if (elements.routeMode) {
            elements.routeMode.addEventListener("change", function () {
                setRouteMode(elements.routeMode.value, true);
            });
        }

        if (elements.routeModeWalkingBtn) {
            elements.routeModeWalkingBtn.addEventListener("click", function () {
                setRouteMode("walking", true);
            });
        }

        if (elements.routeModeCyclingBtn) {
            elements.routeModeCyclingBtn.addEventListener("click", function () {
                setRouteMode("cycling", true);
            });
        }

        if (elements.routeUseCurrentStartBtn) {
            elements.routeUseCurrentStartBtn.addEventListener("click", function () {
                useCurrentLocationAsRouteStart();
            });
        }

        if (elements.routeSwapBtn) {
            elements.routeSwapBtn.addEventListener("click", function () {
                swapRouteEndpoints();
            });
        }

        if (elements.routeStartClearBtn) {
            elements.routeStartClearBtn.addEventListener("click", function () {
                clearRoutePoint("start");
            });
        }

        if (elements.routeEndClearBtn) {
            elements.routeEndClearBtn.addEventListener("click", function () {
                clearRoutePoint("end");
            });
        }

        elements.clearRouteBtn.addEventListener("click", function () {
            clearRouteAll(false);
        });

        if (elements.addWaypointBtn) {
            elements.addWaypointBtn.addEventListener("click", function () {
                addEmptyWaypointSlot();
            });
        }

        if (elements.routeWaypointList) {
            elements.routeWaypointList.addEventListener("click", function (event) {
                const removeButton = event.target.closest("[data-waypoint-remove]");
                if (!removeButton) {
                    return;
                }
                const index = Number(removeButton.dataset.waypointRemove);
                if (!Number.isFinite(index)) {
                    return;
                }
                removeWaypointSlot(index);
            });
        }

        if (elements.historySearchBtn) {
            elements.historySearchBtn.addEventListener("click", function () {
                runHistorySearch();
            });
        }

        if (elements.historyResetBtn) {
            elements.historyResetBtn.addEventListener("click", function () {
                openHistoryCleanModal();
            });
        }

        if (elements.historyCleanCancelBtn) {
            elements.historyCleanCancelBtn.addEventListener("click", function () {
                closeHistoryCleanModal();
            });
        }

        if (elements.historyCleanConfirmBtn) {
            elements.historyCleanConfirmBtn.addEventListener("click", function () {
                handleHistoryCleanConfirm();
            });
        }

        if (elements.historyCleanModal) {
            elements.historyCleanModal.addEventListener("click", function (event) {
                const isBusy = elements.historyCleanConfirmBtn && elements.historyCleanConfirmBtn.disabled;
                if (isBusy) {
                    return;
                }
                if (event.target === elements.historyCleanModal) {
                    closeHistoryCleanModal();
                }
            });
        }

        if (elements.historySearchInput) {
            elements.historySearchInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    runHistorySearch();
                }
            });
        }

        if (elements.historyList) {
            elements.historyList.addEventListener("click", function (event) {
                const actionButton = event.target.closest("[data-history-action]");
                if (!actionButton) {
                    return;
                }
                const action = actionButton.dataset.historyAction;
                const id = Number(actionButton.dataset.historyId);
                if (!Number.isFinite(id)) {
                    return;
                }
                if (action === "use") {
                    useRouteHistory(id);
                    return;
                }
                if (action === "edit") {
                    editRouteHistoryTitle(id);
                    return;
                }
                if (action === "delete") {
                    deleteRouteHistory(id);
                }
            });
        }

        if (elements.routeAlternativeList) {
            elements.routeAlternativeList.addEventListener("click", function (event) {
                const altButton = event.target.closest("[data-alt-index]");
                if (!altButton) {
                    return;
                }
                const altIndex = Number(altButton.dataset.altIndex);
                if (!Number.isFinite(altIndex)) {
                    return;
                }
                selectRouteAlternative(altIndex);
            });
        }

        if (elements.routeAdviceApplyBtn) {
            elements.routeAdviceApplyBtn.addEventListener("click", function () {
                applyRecommendedWaypoint();
            });
        }

        if (elements.mapMenuSetStart) {
            elements.mapMenuSetStart.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                applyMapClickRoutePoint("start");
            });
        }

        if (elements.mapMenuSetEnd) {
            elements.mapMenuSetEnd.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                applyMapClickRoutePoint("end");
            });
        }

        if (elements.mapMenuSetVia) {
            elements.mapMenuSetVia.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                applyMapClickRoutePoint("via");
            });
        }

        if (elements.mapMenuSavePlace) {
            elements.mapMenuSavePlace.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                applyMapClickSavePlace();
            });
        }

        if (elements.mapRoutePointMenu) {
            ["mousedown", "mouseup", "click", "dblclick", "contextmenu"].forEach(function (eventName) {
                elements.mapRoutePointMenu.addEventListener(eventName, function (event) {
                    if (eventName === "contextmenu") {
                        event.preventDefault();
                    }
                    event.stopPropagation();
                });
            });
        }

        if (elements.mapPanel) {
            elements.mapPanel.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            });
        }

        if (elements.mapCategoryQuickPanel) {
            elements.mapCategoryQuickPanel.addEventListener("click", function (event) {
                const button = event.target.closest("[data-category]");
                if (!button) {
                    return;
                }
                const category = normalizeInput(button.dataset.category || "").toLowerCase();
                if (!category) {
                    return;
                }
                runCategoryQuickSearch(category);
            });
        }

        if (elements.savedTypeList) {
            elements.savedTypeList.addEventListener("click", function (event) {
                const typeButton = event.target.closest("[data-saved-type]");
                if (!typeButton) {
                    return;
                }
                const typeKey = normalizeInput(typeButton.dataset.savedType);
                setSavedActiveType(typeKey);
            });
        }

        if (elements.savedItemList) {
            elements.savedItemList.addEventListener("click", function (event) {
                const actionButton = event.target.closest("[data-saved-action]");
                if (actionButton) {
                    const action = normalizeInput(actionButton.dataset.savedAction).toLowerCase();
                    const recordKey = normalizeInput(actionButton.dataset.savedKey);
                    if (!recordKey) {
                        return;
                    }
                    if (action === "select") {
                        setSavedSelectedRecord(recordKey);
                        return;
                    }
                    if (action === "remove") {
                        removeSavedPlace(recordKey);
                        return;
                    }
                    if (action === "rename") {
                        renameSavedPlace(recordKey);
                        return;
                    }
                }

                const item = event.target.closest("[data-saved-key]");
                if (!item) {
                    return;
                }
                const recordKey = normalizeInput(item.dataset.savedKey);
                if (!recordKey) {
                    return;
                }
                setSavedSelectedRecord(recordKey);
            });
        }

        document.addEventListener("mousedown", function (event) {
            if (elements.searchCard && !elements.searchCard.contains(event.target)) {
                state.searchInputFocused = false;
                setSearchSuggestionPanelVisible(false);
                syncSearchHomeOverlayLayout();
            }
            if (!elements.mapRoutePointMenu || elements.mapRoutePointMenu.hidden) {
                return;
            }
            const inMenu = event.target && event.target.closest
                ? event.target.closest("#map-route-point-menu")
                : null;
            if (inMenu) {
                return;
            }
            hideMapRoutePointMenu();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                hideMapRoutePointMenu(true);
                const isBusy = elements.historyCleanConfirmBtn && elements.historyCleanConfirmBtn.disabled;
                if (!isBusy) {
                    closeHistoryCleanModal();
                }
            }
        });
    }

    function handleSearchInputChanged() {
        const inSearchHome = state.uiMode === DRAWER_MODES.SEARCH_HOME;
        const keyword = normalizeInput(elements.searchName ? elements.searchName.value : "");
        if (elements.searchClearBtn) {
            elements.searchClearBtn.hidden = keyword.length === 0;
        }

        if (keyword.length < 2) {
            clearSearchSuggestions(false);
            if (inSearchHome && state.searchInputFocused) {
                renderSearchSuggestions(keyword.length === 0
                    ? "Type to search campus places."
                    : "Type at least 2 characters.");
                setSearchSuggestionPanelVisible(true);
            } else {
                setSearchSuggestionPanelVisible(false);
            }
            return;
        }

        queueSearchSuggestions(keyword);
    }

    function queueSearchSuggestions(keyword) {
        const normalizedKeyword = normalizeInput(keyword);
        if (!normalizedKeyword || normalizedKeyword.length < 2) {
            clearSearchSuggestions(true);
            return;
        }

        state.searchSuggestionKeyword = normalizedKeyword;
        state.searchSuggestionLoading = true;
        renderSearchSuggestions();
        setSearchSuggestionPanelVisible(true);

        if (state.searchSuggestionDebounceTimer) {
            window.clearTimeout(state.searchSuggestionDebounceTimer);
        }
        state.searchSuggestionDebounceTimer = window.setTimeout(function () {
            loadSearchSuggestions(normalizedKeyword);
        }, 250);
    }

    async function loadSearchSuggestions(keyword) {
        const normalizedKeyword = normalizeInput(keyword);
        if (!normalizedKeyword || normalizedKeyword.length < 2) {
            clearSearchSuggestions(true);
            return;
        }

        const requestId = state.searchSuggestionRequestId + 1;
        state.searchSuggestionRequestId = requestId;

        try {
            const params = new URLSearchParams();
            params.set("enabled", "true");
            params.set("name", normalizedKeyword);
            const pois = await fetchApi("/api/v1/pois?" + params.toString());
            if (requestId !== state.searchSuggestionRequestId) {
                return;
            }

            state.searchSuggestions = Array.isArray(pois) ? pois.slice(0, 8) : [];
            state.highlightedSuggestionIndex = state.searchSuggestions.length > 0 ? 0 : -1;
            state.searchSuggestionLoading = false;
            renderSearchSuggestions();
            setSearchSuggestionPanelVisible(state.searchSuggestions.length > 0 || normalizedKeyword.length >= 2);
        } catch (error) {
            if (requestId !== state.searchSuggestionRequestId) {
                return;
            }
            state.searchSuggestionLoading = false;
            state.searchSuggestions = [];
            state.highlightedSuggestionIndex = -1;
            renderSearchSuggestions(normalizeErrorMessage(error, "Unable to load suggestions right now."));
            setSearchSuggestionPanelVisible(true);
        }
    }

    function renderSearchSuggestions(errorMessage) {
        if (!elements.searchSuggestionList || !elements.searchSuggestionEmpty) {
            return;
        }

        const list = elements.searchSuggestionList;
        list.innerHTML = "";

        if (state.searchSuggestionLoading) {
            elements.searchSuggestionEmpty.textContent = "Searching places...";
            elements.searchSuggestionEmpty.classList.remove("hidden");
            return;
        }

        if (errorMessage) {
            elements.searchSuggestionEmpty.textContent = errorMessage;
            elements.searchSuggestionEmpty.classList.remove("hidden");
            return;
        }

        if (!Array.isArray(state.searchSuggestions) || state.searchSuggestions.length === 0) {
            elements.searchSuggestionEmpty.textContent = "No matching places.";
            elements.searchSuggestionEmpty.classList.remove("hidden");
            return;
        }

        elements.searchSuggestionEmpty.classList.add("hidden");
        state.searchSuggestions.forEach(function (poi, index) {
            const item = document.createElement("li");
            item.className = "search-suggestion-item" + (index === state.highlightedSuggestionIndex ? " active" : "");
            item.dataset.suggestionIndex = String(index);

            const name = normalizeText(poi && poi.name ? poi.name : "", "Unnamed POI");
            const type = normalizeText(poi && poi.type ? poi.type : "", "unknown");
            const description = normalizeText(poi && poi.description ? poi.description : "", "");

            item.innerHTML =
                "<span class=\"search-suggestion-icon\" aria-hidden=\"true\"></span>" +
                "<span class=\"search-suggestion-main\">" +
                "<span class=\"search-suggestion-title\">" + escapeHtml(name) + "</span>" +
                "<span class=\"search-suggestion-subtitle\">" + escapeHtml(description || ("Type: " + type)) + "</span>" +
                "</span>";
            list.appendChild(item);
        });
    }

    function handleSuggestionKeyDown(event) {
        if (!event) {
            return;
        }
        const visible = isSearchSuggestionPanelVisible();
        if (!visible) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveSuggestionHighlight(1);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            moveSuggestionHighlight(-1);
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            trySelectSuggestionWithKeyboard();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            setSearchSuggestionPanelVisible(false);
        }
    }

    function moveSuggestionHighlight(step) {
        if (!Array.isArray(state.searchSuggestions) || state.searchSuggestions.length === 0) {
            return;
        }
        const maxIndex = state.searchSuggestions.length - 1;
        let next = state.highlightedSuggestionIndex;
        if (!Number.isInteger(next) || next < 0 || next > maxIndex) {
            next = 0;
        } else {
            next += step;
            if (next > maxIndex) {
                next = 0;
            }
            if (next < 0) {
                next = maxIndex;
            }
        }
        state.highlightedSuggestionIndex = next;
        renderSearchSuggestions();
    }

    function trySelectSuggestionWithKeyboard() {
        if (!isSearchSuggestionPanelVisible()) {
            return false;
        }
        if (!Array.isArray(state.searchSuggestions) || state.searchSuggestions.length === 0) {
            return false;
        }
        let index = state.highlightedSuggestionIndex;
        if (!Number.isInteger(index) || index < 0 || index >= state.searchSuggestions.length) {
            index = 0;
        }
        return selectSearchSuggestionByIndex(index);
    }

    function selectSearchSuggestionByIndex(index) {
        if (!Array.isArray(state.searchSuggestions) || state.searchSuggestions.length === 0) {
            return false;
        }
        if (!Number.isInteger(index) || index < 0 || index >= state.searchSuggestions.length) {
            return false;
        }
        const selectedPoi = state.searchSuggestions[index];
        if (!selectedPoi || !Number.isFinite(Number(selectedPoi.id))) {
            return false;
        }

        if (elements.searchName) {
            elements.searchName.value = normalizeText(selectedPoi.name, "");
        }
        setSearchSuggestionPanelVisible(false);
        clearSearchSuggestions(true);
        state.searchContext = {
            source: "suggestion",
            keyword: normalizeText(selectedPoi.name, ""),
            type: normalizeText(selectedPoi.type, ""),
            category: "",
            total: state.searchSuggestions.length
        };
        selectPoi(Number(selectedPoi.id));
        return true;
    }

    function clearSearchInputAndSuggestions() {
        if (elements.searchName) {
            elements.searchName.value = "";
            elements.searchName.focus();
        }
        clearSearchSuggestions(true);
        if (elements.searchClearBtn) {
            elements.searchClearBtn.hidden = true;
        }
        setFeedback("Ready.");
    }

    function clearSearchSuggestions(forceHide) {
        if (state.searchSuggestionDebounceTimer) {
            window.clearTimeout(state.searchSuggestionDebounceTimer);
            state.searchSuggestionDebounceTimer = null;
        }
        state.searchSuggestionLoading = false;
        state.searchSuggestionKeyword = "";
        state.searchSuggestions = [];
        state.highlightedSuggestionIndex = -1;
        if (elements.searchSuggestionList) {
            elements.searchSuggestionList.innerHTML = "";
        }
        if (elements.searchSuggestionEmpty) {
            elements.searchSuggestionEmpty.classList.add("hidden");
        }
        if (forceHide === true) {
            setSearchSuggestionPanelVisible(false);
        }
    }

    function isSearchSuggestionPanelVisible() {
        if (!elements.searchSuggestionPanel) {
            return false;
        }
        return !elements.searchSuggestionPanel.classList.contains("hidden");
    }

    function setSearchSuggestionPanelVisible(visible) {
        if (!elements.searchSuggestionPanel) {
            return;
        }
        const shouldShow = visible === true;
        elements.searchSuggestionPanel.classList.toggle("hidden", !shouldShow);
        syncSearchHomeOverlayLayout();
    }

    async function runSearch() {
        setUiMode(DRAWER_MODES.SEARCH_HOME, {resetBackStack: true});
        setSearchSuggestionPanelVisible(false);
        state.activeCategory = "";
        setActiveCategoryButton("");
        setHistoryRouteMode(false);
        setFeedback("Searching...");
        try {
            const params = new URLSearchParams();
            const name = normalizeInput(elements.searchName.value);
            const type = normalizeInput(elements.searchType.value);

            params.set("enabled", "true");
            if (name) {
                params.set("name", name);
            }
            if (type) {
                params.set("type", type);
            }

            const query = params.toString() ? "?" + params.toString() : "";
            const pois = await fetchApi("/api/v1/pois" + query);
            state.pois = Array.isArray(pois) ? pois : [];
            state.selectedPoiId = null;
            state.selectedPoi = null;
            state.searchContext = {
                source: "search",
                keyword: name,
                type: type,
                category: "",
                total: state.pois.length
            };

            renderResultList();
            clearDetail(false);
            setSearchCardsVisible(true);
            setUiMode(DRAWER_MODES.SEARCH_RESULTS, {pushSearchFlow: true});
            setFeedback("Loaded " + state.pois.length + " POI(s).");

            if (state.pois.length === 0) {
                clearRouteAll(true);
                return;
            }
        } catch (error) {
            resetPageStateAfterSearchError();
            state.searchContext = null;
            setUiMode(DRAWER_MODES.SEARCH_HOME, {force: true, resetBackStack: true});
            setSearchCardsVisible(false);
            setFeedback(normalizeErrorMessage(error, "We couldn't load places right now. Please try again."));
        }
    }

    async function runCategoryQuickSearch(category) {
        setUiMode(DRAWER_MODES.SEARCH_HOME, {resetBackStack: true});
        setSearchSuggestionPanelVisible(false);
        if (!category) {
            return;
        }

        if (state.activeCategory === category) {
            state.activeCategory = "";
            setActiveCategoryButton("");
            state.searchContext = null;
            clearSearchCardsForCategoryReset();
            setFeedback("Category filter cleared.");
            return;
        }

        state.activeCategory = category;
        setActiveCategoryButton(category);
        setHistoryRouteMode(false);
        setFeedback("Loading " + category + " POIs...");

        try {
            const params = new URLSearchParams();
            params.set("category", category);
            params.set("enabled", "true");
            const pois = await fetchApi("/api/v1/pois?" + params.toString());
            state.pois = Array.isArray(pois) ? pois : [];
            state.selectedPoiId = null;
            state.selectedPoi = null;
            state.searchContext = {
                source: "category",
                keyword: "",
                type: "",
                category: category,
                total: state.pois.length
            };
            renderResultList();
            clearDetail(false);
            setSearchCardsVisible(true);
            setUiMode(DRAWER_MODES.SEARCH_RESULTS, {pushSearchFlow: true});
            setFeedback("Loaded " + state.pois.length + " POI(s) from " + category + ".");
        } catch (error) {
            setFeedback(normalizeErrorMessage(error, "We couldn't load this category right now. Please try again."));
        }
    }

    function clearSearchCardsForCategoryReset() {
        state.pois = [];
        state.selectedPoi = null;
        state.selectedPoiId = null;
        renderResultList();
        clearDetail(false);
        setSearchCardsVisible(false);
        setUiMode(DRAWER_MODES.SEARCH_HOME, {force: true, resetBackStack: true});
    }

    function setActiveCategoryButton(category) {
        if (!elements.mapCategoryButtons || elements.mapCategoryButtons.length === 0) {
            return;
        }
        elements.mapCategoryButtons.forEach(function (button) {
            const value = normalizeInput(button.dataset.category || "").toLowerCase();
            button.classList.toggle("active", !!category && value === category);
        });
    }

    async function loadPoiTypes() {
        try {
            const types = await fetchApi("/api/v1/pois/types");
            state.allPoiTypes = Array.isArray(types) ? types : [];
            renderTypeOptions(state.allPoiTypes, normalizeInput(elements.searchType.value));
        } catch (error) {
            state.allPoiTypes = [];
            renderTypeOptions(state.allPoiTypes, "");
            setFeedback(normalizeErrorMessage(error, "We couldn't load place types right now. Please try again."));
        }
    }

    async function selectPoi(id, options) {
        const refreshSuggestion = !options || options.refreshSuggestion !== false;
        try {
            setSearchSuggestionPanelVisible(false);
            const poi = await fetchApi("/api/v1/pois/" + id);
            state.selectedPoiId = poi.id;
            state.selectedPoi = poi;
            renderResultList();
            renderDetail(poi);
            setSearchCardsVisible(true);
            setUiMode(DRAWER_MODES.POI_DETAIL, {pushSearchFlow: true});
            updateMapMarker(poi);
            if (refreshSuggestion) {
                loadContextSuggestions({
                    sceneType: "poi_detail",
                    poiId: poi.id
                });
            }
        } catch (error) {
            setFeedback(normalizeErrorMessage(error, "We couldn't load place details right now. Please try again."));
        }
    }

    function renderResultList() {
        elements.resultList.innerHTML = "";
        elements.resultCount.textContent = String(state.pois.length);

        if (state.pois.length === 0) {
            elements.resultEmpty.classList.remove("hidden");
            return;
        }

        elements.resultEmpty.classList.add("hidden");
        state.pois.forEach(function (poi) {
            const item = document.createElement("li");
            item.className = "result-item" + (poi.id === state.selectedPoiId ? " active" : "");
            item.dataset.poiId = String(poi.id);

            const poiName = normalizeText(poi.name, "Unnamed POI");
            const poiType = normalizeText(poi.type, "unknown");
            const description = normalizeText(poi.description, "No description available.");
            const openingHours = normalizeText(poi.openingHours, "");
            const statusText = poi.enabled === false
                ? "Unavailable right now"
                : (openingHours ? ("Open hours: " + openingHours) : "Open hours not listed");

            item.innerHTML =
                "<div class=\"result-main\">" +
                "<div class=\"result-title-wrap\">" +
                "<span class=\"result-name\">" + escapeHtml(poiName) + "</span>" +
                "<span class=\"result-subtitle\">Campus point of interest</span>" +
                "</div>" +
                "<span class=\"result-type-tag\">" + escapeHtml(poiType) + "</span>" +
                "</div>" +
                "<p class=\"result-description\">" + escapeHtml(description) + "</p>" +
                "<div class=\"result-meta-row\">" +
                "<span class=\"result-status-line\">" + escapeHtml(statusText) + "</span>" +
                "<div class=\"result-actions\">" +
                "<button type=\"button\" class=\"result-action-btn\" data-result-action=\"view\" data-poi-id=\"" + String(poi.id) + "\">View details</button>" +
                "<button type=\"button\" class=\"result-action-btn primary\" data-result-action=\"route\" data-poi-id=\"" + String(poi.id) + "\">Route</button>" +
                "</div>" +
                "</div>";
            elements.resultList.appendChild(item);
        });
    }

    function setRouteDestinationFromResult(poiId) {
        const poi = state.pois.find(function (item) {
            return Number(item.id) === Number(poiId);
        });
        if (!poi) {
            setFeedback("Selected POI is not available.");
            return;
        }

        state.selectedPoiId = poi.id;
        state.selectedPoi = poi;
        renderResultList();
        setRoutePointFromPoi("end", poi, "Destination set from search result.");
    }

    function renderTypeOptions(types, selectedType) {
        const current = normalizeText(selectedType, "");
        const uniqueTypes = Array.isArray(types) ? types : [];
        elements.searchType.innerHTML = "";

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All types";
        elements.searchType.appendChild(allOption);

        uniqueTypes.forEach(function (type) {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            elements.searchType.appendChild(option);
        });

        elements.searchType.value = current;
    }

    function renderDetail(poi) {
        elements.detailEmpty.classList.add("hidden");
        elements.detailContent.classList.remove("hidden");

        elements.detailName.textContent = poi.name || "-";
        elements.detailType.textContent = poi.type || "-";
        elements.detailDescription.textContent = poi.description || "-";
        elements.detailOpeningHours.textContent = poi.openingHours || "-";

        const enabled = poi.enabled === true;
        elements.detailEnabled.textContent = enabled ? "Enabled" : "Disabled";
        elements.detailEnabled.className = "status-pill " + (enabled ? "enabled" : "disabled");

        if (elements.detailHeroSubtitle) {
            const heroParts = [];
            if (poi.type) {
                heroParts.push(poi.type);
            }
            if (poi.openingHours) {
                heroParts.push(poi.openingHours);
            }
            elements.detailHeroSubtitle.textContent = heroParts.length > 0
                ? heroParts.join(" | ")
                : "Campus destination details";
        }

        const lng = normalizeCoordinate(poi.longitude);
        const lat = normalizeCoordinate(poi.latitude);
        if (lng !== null && lat !== null) {
            elements.detailCoordinates.textContent = lng + ", " + lat;
            if (elements.detailCoordinatesItem) {
                elements.detailCoordinatesItem.hidden = false;
            }
        } else {
            elements.detailCoordinates.textContent = "-";
            if (elements.detailCoordinatesItem) {
                elements.detailCoordinatesItem.hidden = true;
            }
        }

        if (elements.detailContext) {
            elements.detailContext.textContent = buildDetailContextText();
        }
        refreshDetailSaveButtonState();
    }

    function clearDetail(keepSelection) {
        const keep = keepSelection === true;
        elements.detailEmpty.classList.remove("hidden");
        elements.detailContent.classList.add("hidden");
        if (elements.detailCoordinatesItem) {
            elements.detailCoordinatesItem.hidden = true;
        }
        elements.detailEnabled.className = "status-pill";
        if (elements.detailContext) {
            elements.detailContext.textContent = "From search results.";
        }
        if (elements.detailHeroSubtitle) {
            elements.detailHeroSubtitle.textContent = "Campus destination details";
        }
        if (elements.detailSaveBtn) {
            elements.detailSaveBtn.textContent = "Save";
            elements.detailSaveBtn.classList.remove("saved-active");
        }
        state.selectedPoi = null;
        if (!keep) {
            state.selectedPoiId = null;
            clearMapMarker();
            renderResultList();
        }
    }

    function buildDetailContextText() {
        if (!state.searchContext) {
            return "From search results.";
        }
        if (state.searchContext.source === "saved") {
            const savedType = normalizeText(state.searchContext.type, "");
            if (savedType) {
                return "From saved places: " + savedType;
            }
            return "From saved places.";
        }
        const total = Number.isFinite(Number(state.searchContext.total))
            ? Number(state.searchContext.total)
            : state.pois.length;
        if (state.searchContext.category) {
            return "From category results: " + state.searchContext.category + " (" + total + ")";
        }
        const parts = [];
        if (state.searchContext.keyword) {
            parts.push("\"" + state.searchContext.keyword + "\"");
        }
        if (state.searchContext.type) {
            parts.push("type \"" + state.searchContext.type + "\"");
        }
        if (parts.length > 0) {
            return "From search results: " + parts.join(", ") + " (" + total + ")";
        }
        return "From search results.";
    }

    function refreshDetailSaveButtonState() {
        if (!elements.detailSaveBtn) {
            return;
        }
        const poi = state.selectedPoi;
        if (!poi) {
            elements.detailSaveBtn.textContent = "Save";
            elements.detailSaveBtn.classList.remove("saved-active");
            return;
        }
        const alreadySaved = isPoiAlreadySaved(poi);
        elements.detailSaveBtn.textContent = alreadySaved ? "Saved" : "Save";
        elements.detailSaveBtn.classList.toggle("saved-active", alreadySaved);
    }

    function isPoiAlreadySaved(poi) {
        if (!poi || !Array.isArray(state.savedPlaces) || state.savedPlaces.length === 0) {
            return false;
        }
        const poiId = poi.id !== undefined && poi.id !== null ? String(poi.id).trim() : "";
        const poiLng = Number(poi.longitude);
        const poiLat = Number(poi.latitude);

        return state.savedPlaces.some(function (record) {
            if (!record) {
                return false;
            }
            const recordId = normalizeText(record.id, "");
            if (poiId && recordId && poiId === recordId) {
                return true;
            }
            if (!Number.isFinite(poiLng) || !Number.isFinite(poiLat)) {
                return false;
            }
            if (!Number.isFinite(record.longitude) || !Number.isFinite(record.latitude)) {
                return false;
            }
            return Math.abs(Number(record.longitude) - poiLng) < 0.000001
                && Math.abs(Number(record.latitude) - poiLat) < 0.000001;
        });
    }

    async function initMap() {
        const key = readConfig("amapJsKey");
        const securityJsCode = readConfig("amapSecurityJsCode");

        if (!key || key === "your_amap_js_key") {
            showMapStatus("AMap JS key is not configured. Please check amap.js-key in application.yml.");
            return;
        }

        try {
            showMapStatus("Loading map...");
            applyAmapSecurityConfig(securityJsCode);
            await loadAmapScript(key);

            state.map = new AMap.Map("map-container", {
                zoom: 17,
                center: NUIST_CAMPUS_CENTER,
                resizeEnable: true
            });
            state.map.on("rightclick", handleMapRightClickForRouteSelection);
            state.map.on("click", function (event) {
                if (isEventFromMapRoutePointMenu(event)) {
                    return;
                }
                hideMapRoutePointMenu(false);
            });
            state.map.on("movestart", function () {
                hideMapRoutePointMenu(false);
            });
            state.map.on("zoomstart", function () {
                hideMapRoutePointMenu(false);
            });
            state.mapReady = true;
            hideMapStatus();
        } catch (error) {
            showMapStatus("Map failed to load. Check key, securityJsCode, and network.");
        }
    }

    function applyAmapSecurityConfig(securityJsCode) {
        if (!securityJsCode || securityJsCode === "your_amap_security_js_code") {
            return;
        }
        window._AMapSecurityConfig = {
            securityJsCode: securityJsCode
        };
    }

    function updateMapMarker(poi) {
        if (!state.mapReady || !state.map) {
            return;
        }

        clearMapMarker();

        const lng = Number(poi.longitude);
        const lat = Number(poi.latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            showMapStatus("This POI has no valid coordinates.");
            return;
        }

        hideMapStatus();

        state.marker = new AMap.Marker({
            position: [lng, lat],
            title: poi.name || "Campus POI"
        });
        state.map.add(state.marker);

        const infoContent =
            "<div class=\"amap-info-window\">" +
            "<div><strong>" + escapeHtml(poi.name || "Unnamed POI") + "</strong></div>" +
            "<div style=\"margin-top:4px;color:#4b5563;\">" + escapeHtml(poi.type || "-") + "</div>" +
            "</div>";

        if (!state.infoWindow) {
            state.infoWindow = new AMap.InfoWindow({
                offset: new AMap.Pixel(0, -28)
            });
        }

        state.infoWindow.setContent(infoContent);
        state.marker.on("click", function () {
            state.infoWindow.open(state.map, state.marker.getPosition());
        });

        state.map.setCenter([lng, lat]);
        state.map.setZoom(17);
        state.infoWindow.open(state.map, state.marker.getPosition());
    }

    function clearMapMarker() {
        if (state.infoWindow) {
            state.infoWindow.close();
        }
        if (!state.map || !state.marker) {
            return;
        }
        state.map.remove(state.marker);
        state.marker = null;
    }

    function resetPageStateAfterSearchError() {
        state.pois = [];
        renderResultList();
        clearDetail(false);
        clearRouteAll(true);
    }

    function setSearchCardsVisible(visible) {
        state.searchCardsVisible = visible === true;
        applyDrawerModeVisibility();
    }

    function setHistoryRouteMode(enabled) {
        state.historyRouteMode = enabled === true;
        applyDrawerModeVisibility();
    }

    function applyHistoryRouteVisibility() {
        // Compatibility layer kept for existing call sites.
        if (!state.historyRouteMode) {
            return;
        }
        if (state.uiMode !== DRAWER_MODES.ROUTE_PLANNING) {
            setUiMode(DRAWER_MODES.ROUTE_PLANNING, {force: true});
        }
    }

    function runHistorySearch() {
        const keyword = elements.historySearchInput ? normalizeInput(elements.historySearchInput.value) : "";
        loadRouteHistoryList(keyword);
    }

    async function loadRouteHistoryList(keyword) {
        state.historyKeyword = normalizeInput(keyword || "");
        const query = new URLSearchParams();
        if (state.historyKeyword) {
            query.set("keyword", state.historyKeyword);
        }
        const url = query.toString()
            ? "/api/v1/route-histories?" + query.toString()
            : "/api/v1/route-histories";

        try {
            const responseData = await fetchApi(url);
            const items = responseData && Array.isArray(responseData.items) ? responseData.items : [];
            const totalCount = responseData && Number.isFinite(Number(responseData.totalCount))
                ? Number(responseData.totalCount)
                : items.length;
            state.routeHistories = items;
            renderRouteHistoryList(items, totalCount);
            setHistoryStatus("History loaded.");
        } catch (error) {
            state.routeHistories = [];
            renderRouteHistoryList([], 0);
            setHistoryStatus(error.message || "Failed to load history records.");
        }
    }

    function renderRouteHistoryList(items, totalCount) {
        const histories = Array.isArray(items) ? items : [];
        if (elements.historyCount) {
            elements.historyCount.textContent = String(Math.max(0, Number(totalCount) || 0));
        }
        if (!elements.historyList || !elements.historyEmpty) {
            return;
        }

        elements.historyList.innerHTML = "";
        if (histories.length === 0) {
            elements.historyEmpty.classList.remove("hidden");
            return;
        }

        elements.historyEmpty.classList.add("hidden");
        histories.forEach(function (item) {
            const historyItem = document.createElement("li");
            historyItem.className = "history-item";

            const title = normalizeText(item.title, normalizeText(item.startName, "Start") + " -> " + normalizeText(item.endName, "Destination"));
            const mode = normalizeRouteMode(item.mode);
            const distance = formatDistance(item.distance);
            const duration = formatDuration(item.duration);
            const createdAt = formatWeatherTime(item.updatedAt || item.createdAt);

            historyItem.innerHTML =
                "<div class=\"history-item-title\">" + escapeHtml(title) + "</div>" +
                "<div class=\"history-item-meta\">" +
                escapeHtml(normalizeText(item.startName, "Start")) + " -> " + escapeHtml(normalizeText(item.endName, "Destination")) +
                " | " + escapeHtml(capitalizeRouteMode(mode)) +
                " | " + escapeHtml(distance) +
                " | " + escapeHtml(duration) +
                " | " + escapeHtml(createdAt) +
                "</div>" +
                "<div class=\"history-item-actions\">" +
                "<button type=\"button\" class=\"history-action-btn\" data-history-action=\"use\" data-history-id=\"" + String(item.id) + "\">Use</button>" +
                "<button type=\"button\" class=\"history-action-btn\" data-history-action=\"edit\" data-history-id=\"" + String(item.id) + "\">Edit</button>" +
                "<button type=\"button\" class=\"history-action-btn delete\" data-history-action=\"delete\" data-history-id=\"" + String(item.id) + "\">Delete</button>" +
                "</div>";

            elements.historyList.appendChild(historyItem);
        });
    }

    function setHistoryStatus(message) {
        if (!elements.historyStatus) {
            return;
        }
        elements.historyStatus.textContent = message || "History ready.";
    }

    function openHistoryCleanModal() {
        if (!elements.historyCleanModal) {
            return;
        }
        setHistoryCleanModalBusy(false);
        elements.historyCleanModal.hidden = false;
    }

    function closeHistoryCleanModal() {
        if (!elements.historyCleanModal) {
            return;
        }
        elements.historyCleanModal.hidden = true;
        setHistoryCleanModalBusy(false);
    }

    function setHistoryCleanModalBusy(isBusy) {
        const busy = !!isBusy;
        if (elements.historyCleanConfirmBtn) {
            elements.historyCleanConfirmBtn.disabled = busy;
            elements.historyCleanConfirmBtn.textContent = busy ? "Clearing..." : "Yes";
        }
        if (elements.historyCleanCancelBtn) {
            elements.historyCleanCancelBtn.disabled = busy;
        }
    }

    function handleHistoryCleanConfirm() {
        const isBusy = elements.historyCleanConfirmBtn && elements.historyCleanConfirmBtn.disabled;
        if (isBusy) {
            return;
        }
        clearAllRouteHistories();
    }

    async function clearAllRouteHistories() {
        setHistoryCleanModalBusy(true);
        setHistoryStatus("Clearing history...");
        try {
            const response = await fetchApi("/api/v1/route-histories", {
                method: "DELETE"
            });
            closeHistoryCleanModal();
            if (elements.historySearchInput) {
                elements.historySearchInput.value = "";
            }
            state.historyKeyword = "";
            state.routeHistories = [];
            renderRouteHistoryList([], 0);
            await loadRouteHistoryList("");
            const cleared = response && Number.isFinite(Number(response.cleared))
                ? Number(response.cleared)
                : null;
            if (cleared === null) {
                setHistoryStatus("History cleared.");
            } else {
                setHistoryStatus("History cleared. " + String(cleared) + " record(s) removed.");
            }
        } catch (error) {
            closeHistoryCleanModal();
            const detail = normalizeErrorMessage(error, "Failed to clear history records.");
            setHistoryStatus(detail);
            window.alert("Failed to clear history: " + detail);
        }
    }

    function buildHistoryPoi(record, type) {
        if (!record) {
            return null;
        }
        const isStart = type === "start";
        const lng = Number(isStart ? record.startLng : record.endLng);
        const lat = Number(isStart ? record.startLat : record.endLat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
        }
        return {
            id: "__history_" + type + "_" + String(record.id),
            name: isStart ? normalizeText(record.startName, "Start") : normalizeText(record.endName, "Destination"),
            type: "history_point",
            longitude: lng,
            latitude: lat,
            description: "Route history point",
            openingHours: "-",
            enabled: true
        };
    }

    function useRouteHistory(historyId) {
        const record = state.routeHistories.find(function (item) {
            return item.id === historyId;
        });
        if (!record) {
            setHistoryStatus("History record not found.");
            return;
        }

        const startPoi = buildHistoryPoi(record, "start");
        const endPoi = buildHistoryPoi(record, "end");
        if (!startPoi || !endPoi) {
            setHistoryStatus("History coordinates are invalid.");
            return;
        }

        invalidateRoutePlanRequests();
        clearRouteDrawing();
        clearRouteAdvice();
        state.routeStartPoi = startPoi;
        state.routeEndPoi = endPoi;
        state.routeViaPois = [];
        state.routeMode = normalizeRouteMode(record.mode);
        if (elements.routeMode) {
            elements.routeMode.value = state.routeMode;
        }

        renderRouteSelection();
        renderRouteEndpointMarkers();
        fitRouteView();
        setRouteFeedback("History loaded. Click Start Route Planning.", "info");
        setHistoryStatus("History applied.");
        setSearchCardsVisible(true);
        setHistoryRouteMode(false);
        setUiMode(DRAWER_MODES.ROUTE_PLANNING, {force: true, resetBackStack: true});
    }

    async function editRouteHistoryTitle(historyId) {
        const record = state.routeHistories.find(function (item) {
            return item.id === historyId;
        });
        if (!record) {
            return;
        }
        const nextTitle = window.prompt("Edit history title", normalizeText(record.title, ""));
        if (nextTitle === null) {
            return;
        }
        const title = normalizeInput(nextTitle);
        if (!title) {
            window.alert("Title cannot be empty.");
            return;
        }

        try {
            await fetchApi("/api/v1/route-histories/" + historyId, {
                method: "PUT",
                body: {title: title}
            });
            setHistoryStatus("History title updated.");
            await loadRouteHistoryList(state.historyKeyword);
        } catch (error) {
            setHistoryStatus(error.message || "Failed to update history title.");
        }
    }

    async function deleteRouteHistory(historyId) {
        const confirmed = window.confirm("Delete this route history?");
        if (!confirmed) {
            return;
        }
        try {
            await fetchApi("/api/v1/route-histories/" + historyId, {
                method: "DELETE"
            });
            setHistoryStatus("History record deleted.");
            await loadRouteHistoryList(state.historyKeyword);
        } catch (error) {
            setHistoryStatus(error.message || "Failed to delete history record.");
        }
    }

    async function saveCurrentRouteHistory(routeData) {
        if (!state.routeStartPoi || !state.routeEndPoi) {
            return;
        }
        const viaPayload = getAssignedWaypoints()
            .map(function (poi) {
                return {
                    name: poi.name,
                    longitude: Number(poi.longitude),
                    latitude: Number(poi.latitude)
                };
            }).filter(function (poi) {
                return Number.isFinite(poi.longitude) && Number.isFinite(poi.latitude);
            });

        const payload = {
            title: normalizeText(state.routeStartPoi.name, "Start") + " -> " + normalizeText(state.routeEndPoi.name, "Destination"),
            mode: normalizeRouteMode(state.routeMode),
            startName: normalizeText(state.routeStartPoi.name, "Start"),
            startLng: Number(state.routeStartPoi.longitude),
            startLat: Number(state.routeStartPoi.latitude),
            endName: normalizeText(state.routeEndPoi.name, "Destination"),
            endLng: Number(state.routeEndPoi.longitude),
            endLat: Number(state.routeEndPoi.latitude),
            viaJson: JSON.stringify(viaPayload),
            distance: Number(routeData && routeData.distance ? routeData.distance : 0),
            duration: Number(routeData && routeData.duration ? routeData.duration : 0)
        };

        await fetchApi("/api/v1/route-histories", {
            method: "POST",
            body: payload
        });
    }

    function loadSavedPlacesFromStorage() {
        const raw = readLocalStorageValue(SAVED_STORAGE_KEY);
        if (!raw) {
            state.savedPlaces = [];
            state.savedActiveType = "";
            state.savedSelectedRecordKey = "";
            refreshDetailSaveButtonState();
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            const records = Array.isArray(parsed) ? parsed : [];
            state.savedPlaces = records
                .map(function (record) {
                    return normalizeSavedRecord(record);
                })
                .filter(function (record) {
                    return !!record;
                })
                .sort(function (a, b) {
                    return Date.parse(b.savedAt) - Date.parse(a.savedAt);
                });
            state.savedActiveType = "";
            state.savedSelectedRecordKey = "";
        } catch (error) {
            state.savedPlaces = [];
            state.savedActiveType = "";
            state.savedSelectedRecordKey = "";
        }
        refreshDetailSaveButtonState();
    }

    function savePlaceToSavedList(poi, source) {
        const record = buildSavedRecordFromPoi(poi, source);
        const existingIndex = findSavedPlaceIndex(record);
        if (existingIndex >= 0) {
            const existing = state.savedPlaces[existingIndex];
            const merged = Object.assign({}, existing, record, {
                recordKey: existing.recordKey,
                savedAt: new Date().toISOString()
            });
            state.savedPlaces.splice(existingIndex, 1);
            state.savedPlaces.unshift(merged);
            state.savedSelectedRecordKey = merged.recordKey;
        } else {
            state.savedPlaces.unshift(record);
            state.savedSelectedRecordKey = record.recordKey;
        }

        persistSavedPlaces();
        state.savedActiveType = state.savedPlaces[0].categoryKey;
        if (state.uiMode === DRAWER_MODES.SAVED) {
            renderSavedView();
        }
        return state.savedPlaces[0];
    }

    function removeSavedPlace(recordKey) {
        const key = normalizeInput(recordKey);
        if (!key) {
            return;
        }
        const index = state.savedPlaces.findIndex(function (record) {
            return record.recordKey === key;
        });
        if (index < 0) {
            return;
        }
        const removed = state.savedPlaces[index];
        state.savedPlaces.splice(index, 1);
        persistSavedPlaces();

        if (state.savedSelectedRecordKey === key) {
            state.savedSelectedRecordKey = "";
        }

        const hasType = state.savedPlaces.some(function (record) {
            return record.categoryKey === removed.categoryKey;
        });
        if (!hasType) {
            state.savedActiveType = "";
        }

        if (state.uiMode === DRAWER_MODES.SAVED) {
            renderSavedView();
        }
        refreshDetailSaveButtonState();
        showMapToast("Saved place removed.");
    }

    function renameSavedPlace(recordKey) {
        const key = normalizeInput(recordKey);
        if (!key) {
            return;
        }

        const index = state.savedPlaces.findIndex(function (record) {
            return record.recordKey === key;
        });
        if (index < 0) {
            return;
        }

        const target = state.savedPlaces[index];
        if (!target || normalizeText(target.categoryKey, "") !== SAVED_UNCATEGORIZED_KEY) {
            return;
        }

        const renamedRaw = window.prompt("Rename saved place:", normalizeText(target.name, "Saved Place"));
        if (renamedRaw === null) {
            return;
        }

        const renamed = normalizeText(renamedRaw, "");
        if (!renamed) {
            window.alert("Name cannot be empty.");
            return;
        }
        if (renamed.length > MAX_SAVED_PLACE_NAME_LENGTH) {
            window.alert("Name is too long. Maximum 80 characters.");
            return;
        }
        if (renamed === normalizeText(target.name, "")) {
            return;
        }

        const updated = Object.assign({}, target, {name: renamed});
        state.savedPlaces.splice(index, 1, updated);
        persistSavedPlaces();

        if (state.uiMode === DRAWER_MODES.SAVED) {
            renderSavedView();
        }
        syncSavedRenameToOpenedDetail(updated);
        showMapToast("Saved place renamed.");
    }

    function buildSavedRecordFromPoi(poi, source) {
        const lng = Number(poi && poi.longitude);
        const lat = Number(poi && poi.latitude);
        const normalizedSource = normalizeText(source, "poi-detail");
        const type = normalizeText(poi && poi.type, "");
        const isMapSource = normalizedSource === "map-right-click";
        const categoryKey = resolveSavedCategoryKey(type, isMapSource);
        const recordKey = buildSavedRecordKey(poi, lng, lat);
        return {
            recordKey: recordKey,
            id: poi && poi.id !== undefined ? String(poi.id) : "",
            name: normalizeText(poi && poi.name, "Unnamed Place"),
            type: type || "",
            categoryKey: categoryKey,
            longitude: Number.isFinite(lng) ? Number(lng.toFixed(6)) : null,
            latitude: Number.isFinite(lat) ? Number(lat.toFixed(6)) : null,
            openingHours: normalizeText(poi && poi.openingHours, "-"),
            description: normalizeText(poi && poi.description, "-"),
            source: normalizedSource,
            savedAt: new Date().toISOString()
        };
    }

    function normalizeSavedRecord(record) {
        if (!record || typeof record !== "object") {
            return null;
        }
        const lng = Number(record.longitude);
        const lat = Number(record.latitude);
        const savedAtValue = normalizeText(record.savedAt, "");
        const normalizedSavedAt = savedAtValue && !Number.isNaN(Date.parse(savedAtValue))
            ? new Date(savedAtValue).toISOString()
            : new Date().toISOString();
        const normalizedSource = normalizeText(record.source, "poi-detail");
        const type = normalizeText(record.type, "");
        const categoryKey = resolveSavedCategoryKey(type, normalizedSource === "map-right-click");
        const fallbackPoi = {
            id: record.id || "",
            longitude: lng,
            latitude: lat
        };
        const recordKey = normalizeText(record.recordKey, "")
            || buildSavedRecordKey(fallbackPoi, lng, lat);

        return {
            recordKey: recordKey,
            id: normalizeText(record.id, ""),
            name: normalizeText(record.name, "Unnamed Place"),
            type: type,
            categoryKey: categoryKey,
            longitude: Number.isFinite(lng) ? Number(lng.toFixed(6)) : null,
            latitude: Number.isFinite(lat) ? Number(lat.toFixed(6)) : null,
            openingHours: normalizeText(record.openingHours, "-"),
            description: normalizeText(record.description, "-"),
            source: normalizedSource,
            savedAt: normalizedSavedAt
        };
    }

    function resolveSavedCategoryKey(type, forceUncategorized) {
        if (forceUncategorized) {
            return SAVED_UNCATEGORIZED_KEY;
        }
        const normalizedType = normalizeText(type, "");
        if (!normalizedType) {
            return SAVED_UNCATEGORIZED_KEY;
        }
        const normalizedLower = normalizedType.toLowerCase();
        if (normalizedLower === "unknown"
            || normalizedLower === "uncategorized"
            || normalizedLower === "map_point"
            || normalizedLower === "-"
            || normalizedLower === "null"
            || normalizedLower === "undefined") {
            return SAVED_UNCATEGORIZED_KEY;
        }
        return normalizedType;
    }

    function buildSavedRecordKey(poi, lng, lat) {
        if (poi && poi.id !== undefined && poi.id !== null && String(poi.id).trim() !== "") {
            return "poi:" + String(poi.id).trim();
        }
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
            return "coord:" + Number(lng).toFixed(6) + "," + Number(lat).toFixed(6);
        }
        return "saved:" + String(Date.now()) + ":" + String(Math.floor(Math.random() * 100000));
    }

    function findSavedPlaceIndex(record) {
        if (!record) {
            return -1;
        }

        const byKeyIndex = state.savedPlaces.findIndex(function (item) {
            return item.recordKey === record.recordKey;
        });
        if (byKeyIndex >= 0) {
            return byKeyIndex;
        }

        if (record.id) {
            const byIdIndex = state.savedPlaces.findIndex(function (item) {
                return normalizeText(item.id, "") !== ""
                    && normalizeText(item.id, "") === normalizeText(record.id, "");
            });
            if (byIdIndex >= 0) {
                return byIdIndex;
            }
        }

        if (Number.isFinite(record.longitude) && Number.isFinite(record.latitude)) {
            const byCoordinateIndex = state.savedPlaces.findIndex(function (item) {
                if (!Number.isFinite(item.longitude) || !Number.isFinite(item.latitude)) {
                    return false;
                }
                return Math.abs(item.longitude - record.longitude) < 0.000001
                    && Math.abs(item.latitude - record.latitude) < 0.000001;
            });
            if (byCoordinateIndex >= 0) {
                return byCoordinateIndex;
            }
        }

        return -1;
    }

    function persistSavedPlaces() {
        const serialized = JSON.stringify(state.savedPlaces);
        writeLocalStorageValue(SAVED_STORAGE_KEY, serialized);
        refreshDetailSaveButtonState();
    }

    function renderSavedView() {
        const grouped = groupSavedPlacesByType(state.savedPlaces);
        const typeKeys = grouped.map(function (group) {
            return group.typeKey;
        });

        if (typeKeys.length === 0) {
            state.savedActiveType = "";
            state.savedSelectedRecordKey = "";
            renderSavedTypeList(grouped);
            renderSavedItemList([], "");
            return;
        }

        if (!typeKeys.includes(state.savedActiveType)) {
            state.savedActiveType = typeKeys[0];
        }

        const activeGroup = grouped.find(function (group) {
            return group.typeKey === state.savedActiveType;
        }) || grouped[0];

        renderSavedTypeList(grouped);
        renderSavedItemList(activeGroup.records, activeGroup.typeKey);

        const selectedRecord = getSavedRecordByKey(state.savedSelectedRecordKey);
        if (!selectedRecord || selectedRecord.categoryKey !== activeGroup.typeKey) {
            state.savedSelectedRecordKey = "";
        }
    }

    function renderSavedTypeList(groups) {
        if (!elements.savedTypeList || !elements.savedTypeEmpty) {
            return;
        }
        elements.savedTypeList.innerHTML = "";
        if (!Array.isArray(groups) || groups.length === 0) {
            elements.savedTypeEmpty.classList.remove("hidden");
            return;
        }
        elements.savedTypeEmpty.classList.add("hidden");
        groups.forEach(function (group) {
            const item = document.createElement("li");
            item.className = "saved-type-item";
            item.innerHTML =
                "<button type=\"button\" class=\"saved-type-btn" + (group.typeKey === state.savedActiveType ? " active" : "") + "\" data-saved-type=\"" + escapeHtml(group.typeKey) + "\">" +
                "<span class=\"saved-type-name\">" + escapeHtml(group.typeKey) + "</span>" +
                "<span class=\"saved-type-count\">" + String(group.records.length) + "</span>" +
                "</button>";
            elements.savedTypeList.appendChild(item);
        });
    }

    function renderSavedItemList(records, typeKey) {
        if (!elements.savedItemList || !elements.savedItemEmpty || !elements.savedItemTitle) {
            return;
        }
        elements.savedItemList.innerHTML = "";
        const normalizedType = normalizeText(typeKey, "Saved Places");
        const canRename = normalizedType === SAVED_UNCATEGORIZED_KEY;
        elements.savedItemTitle.textContent = normalizedType === SAVED_UNCATEGORIZED_KEY
            ? "Saved Places | Uncategorized"
            : "Saved Places | " + normalizedType;

        if (!Array.isArray(records) || records.length === 0) {
            elements.savedItemEmpty.classList.remove("hidden");
            return;
        }

        elements.savedItemEmpty.classList.add("hidden");
        records.forEach(function (record) {
            const savedAt = formatWeatherTime(record.savedAt);
            const coordinateText = formatSavedCoordinate(record.longitude, record.latitude);
            const item = document.createElement("li");
            item.className = "saved-item" + (record.recordKey === state.savedSelectedRecordKey ? " active" : "");
            item.dataset.savedKey = record.recordKey;
            item.innerHTML =
                "<div class=\"saved-item-main\">" +
                "<span class=\"saved-item-name\">" + escapeHtml(record.name) + "</span>" +
                "<span class=\"saved-item-meta\">" + escapeHtml(coordinateText) + "</span>" +
                "<span class=\"saved-item-meta\">" + escapeHtml(savedAt) + "</span>" +
                "</div>" +
                "<div class=\"saved-item-actions\">" +
                "<button type=\"button\" class=\"saved-item-action\" data-saved-action=\"select\" data-saved-key=\"" + escapeHtml(record.recordKey) + "\">View</button>" +
                (canRename
                    ? ("<button type=\"button\" class=\"saved-item-action\" data-saved-action=\"rename\" data-saved-key=\"" + escapeHtml(record.recordKey) + "\">Edit</button>")
                    : "") +
                "<button type=\"button\" class=\"saved-item-action danger\" data-saved-action=\"remove\" data-saved-key=\"" + escapeHtml(record.recordKey) + "\">Remove</button>" +
                "</div>";
            elements.savedItemList.appendChild(item);
        });
    }

    function setSavedSelectedRecord(recordKey) {
        const key = normalizeInput(recordKey);
        if (!key) {
            return;
        }
        const record = getSavedRecordByKey(key);
        if (!record) {
            return;
        }
        state.savedSelectedRecordKey = key;
        renderSavedView();
        openSavedRecordInPoiDetail(record);
    }

    function setSavedActiveType(typeKey) {
        const normalized = normalizeText(typeKey, "");
        if (!normalized) {
            return;
        }
        state.savedActiveType = normalized;
        state.savedSelectedRecordKey = "";
        renderSavedView();
    }

    function openSavedRecordInPoiDetail(record) {
        const poi = buildPoiFromSavedRecord(record);
        if (!poi) {
            setFeedback("Saved place coordinates are invalid.");
            return;
        }

        const lastMode = state.uiBackStack.length > 0
            ? state.uiBackStack[state.uiBackStack.length - 1]
            : "";
        if (state.uiMode === DRAWER_MODES.SAVED && lastMode !== DRAWER_MODES.SAVED) {
            state.uiBackStack.push(DRAWER_MODES.SAVED);
            if (state.uiBackStack.length > 20) {
                state.uiBackStack.shift();
            }
        }

        state.searchContext = {
            source: "saved",
            keyword: "",
            type: normalizeText(record.categoryKey, ""),
            category: "",
            total: 1
        };
        state.selectedPoi = poi;
        state.selectedPoiId = poi.id;
        renderDetail(poi);
        setSearchCardsVisible(true);
        setUiMode(DRAWER_MODES.POI_DETAIL, {force: true});
        updateMapMarker(poi);

        const numericPoiId = Number(record.id);
        if (Number.isFinite(numericPoiId) && numericPoiId > 0) {
            loadContextSuggestions({
                sceneType: "poi_detail",
                poiId: numericPoiId
            });
            return;
        }
        loadContextSuggestions({
            sceneType: "poi_detail"
        });
    }

    function syncSavedRenameToOpenedDetail(record) {
        if (!record || !state.selectedPoi || !state.searchContext || state.searchContext.source !== "saved") {
            return;
        }

        const selectedKey = normalizeInput(state.savedSelectedRecordKey);
        if (selectedKey && selectedKey !== record.recordKey) {
            return;
        }

        const currentPoiId = normalizeText(state.selectedPoi.id, "");
        const recordId = normalizeText(record.id, "");
        const savedPseudoId = "__saved__" + record.recordKey;

        let matched = false;
        if (currentPoiId && recordId && currentPoiId === recordId) {
            matched = true;
        } else if (currentPoiId === savedPseudoId) {
            matched = true;
        } else {
            const selectedLng = Number(state.selectedPoi.longitude);
            const selectedLat = Number(state.selectedPoi.latitude);
            const recordLng = Number(record.longitude);
            const recordLat = Number(record.latitude);
            if (Number.isFinite(selectedLng)
                && Number.isFinite(selectedLat)
                && Number.isFinite(recordLng)
                && Number.isFinite(recordLat)) {
                matched = Math.abs(selectedLng - recordLng) < 0.000001
                    && Math.abs(selectedLat - recordLat) < 0.000001;
            }
        }

        if (!matched) {
            return;
        }

        state.selectedPoi = Object.assign({}, state.selectedPoi, {
            name: record.name
        });
        renderDetail(state.selectedPoi);
    }

    function groupSavedPlacesByType(records) {
        const groupsMap = new Map();
        const safeRecords = Array.isArray(records) ? records : [];
        safeRecords.forEach(function (record) {
            const typeKey = resolveSavedCategoryKey(record.type, record.source === "map-right-click");
            if (!groupsMap.has(typeKey)) {
                groupsMap.set(typeKey, []);
            }
            groupsMap.get(typeKey).push(record);
        });

        const groups = Array.from(groupsMap.entries()).map(function (entry) {
            return {
                typeKey: entry[0],
                records: entry[1].slice().sort(function (a, b) {
                    return Date.parse(b.savedAt) - Date.parse(a.savedAt);
                })
            };
        });

        groups.sort(function (a, b) {
            if (a.typeKey === SAVED_UNCATEGORIZED_KEY) {
                return 1;
            }
            if (b.typeKey === SAVED_UNCATEGORIZED_KEY) {
                return -1;
            }
            return a.typeKey.localeCompare(b.typeKey);
        });
        return groups;
    }

    function getSavedRecordByKey(recordKey) {
        const key = normalizeInput(recordKey);
        if (!key) {
            return null;
        }
        return state.savedPlaces.find(function (record) {
            return record.recordKey === key;
        }) || null;
    }

    function buildPoiFromSavedRecord(record) {
        if (!record) {
            return null;
        }
        const lng = Number(record.longitude);
        const lat = Number(record.latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
        }
        return {
            id: normalizeText(record.id, "") || ("__saved__" + record.recordKey),
            name: normalizeText(record.name, "Saved Place"),
            type: normalizeText(record.type, "saved_place"),
            longitude: Number(lng.toFixed(6)),
            latitude: Number(lat.toFixed(6)),
            description: normalizeText(record.description, "Saved place"),
            openingHours: normalizeText(record.openingHours, "-"),
            enabled: true
        };
    }

    function formatSavedCoordinate(lng, lat) {
        const lngNum = Number(lng);
        const latNum = Number(lat);
        if (!Number.isFinite(lngNum) || !Number.isFinite(latNum)) {
            return "-";
        }
        return lngNum.toFixed(6) + ", " + latNum.toFixed(6);
    }

    function readLocalStorageValue(key) {
        try {
            return window.localStorage ? window.localStorage.getItem(key) : null;
        } catch (error) {
            return null;
        }
    }

    function writeLocalStorageValue(key, value) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (error) {
            // Ignore quota/storage errors to avoid breaking main flows.
        }
    }

    async function loadWeatherSummary() {
        if (state.weatherLoading) {
            return;
        }
        state.weatherLoading = true;
        elements.weatherStatus.textContent = "Loading weather...";
        setWeatherEmptyStateVisible(false);
        try {
            const weather = await fetchApi("/api/v1/weather/current");
            state.weather = weather || null;
            renderWeatherSummary(weather);
        } catch (error) {
            state.weather = null;
            const detail = normalizeErrorMessage(error, "Weather unavailable");
            renderWeatherFallback("Weather unavailable: " + detail);
        } finally {
            state.weatherLoading = false;
        }
    }

    function startWeatherAutoRefresh() {
        if (state.weatherRefreshTimer) {
            window.clearInterval(state.weatherRefreshTimer);
        }
        state.weatherRefreshTimer = window.setInterval(function () {
            loadWeatherSummary();
            updateClassPeakStatus();
        }, WEATHER_REFRESH_INTERVAL_MS);
    }

    function updateClassPeakStatus() {
        if (!elements.classPeakStatus) {
            return;
        }

        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const minuteOfDay = hour * 60 + minute;

        const isWorkday = day >= 1 && day <= 5;
        const currentPeak = findCurrentClassPeak(minuteOfDay);
        const inClassPeak = isWorkday && currentPeak !== null;

        if (inClassPeak) {
            elements.classPeakStatus.textContent =
                "Class peak (Period " + currentPeak.period + " starts at " + currentPeak.startLabel + "): leave 20 min earlier.";
            elements.classPeakStatus.className = "class-peak-status peak-on";
            return;
        }

        if (isWorkday) {
            elements.classPeakStatus.textContent = "Not in class peak period.";
        } else {
            elements.classPeakStatus.textContent = "Not in class peak period (weekend).";
        }
        elements.classPeakStatus.className = "class-peak-status peak-off";
    }

    function findCurrentClassPeak(minuteOfDay) {
        for (let i = 0; i < CLASS_PERIOD_STARTS.length; i += 1) {
            const period = CLASS_PERIOD_STARTS[i];
            const peakStart = period.minuteOfDay - CLASS_PEAK_LEAD_MINUTES;
            if (minuteOfDay >= peakStart && minuteOfDay < period.minuteOfDay) {
                return {
                    period: period.period,
                    startLabel: formatMinuteOfDay(period.minuteOfDay)
                };
            }
        }
        return null;
    }

    function formatMinuteOfDay(minuteOfDay) {
        const hh = Math.floor(minuteOfDay / 60);
        const mm = minuteOfDay % 60;
        return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    }

    function renderWeatherSummary(weather) {
        if (!weather) {
            renderWeatherFallback("Weather data is empty.");
            return;
        }

        const weatherText = normalizeText(weather.weatherText || weather.text, "-");
        const temp = formatNumericValue(weather.temp, "\u00b0C");
        const feelsLike = formatNumericValue(weather.feelsLike, "\u00b0C");
        const humidity = formatNumericValue(weather.humidity, "%");
        const windText = [normalizeText(weather.windDir, ""), normalizeText(weather.windScale, "")]
            .filter(function (part) {
                return part && part !== "-";
            })
            .join(" ");

        elements.weatherText.textContent = weatherText;
        elements.weatherTemp.textContent = temp;
        elements.weatherFeelsLike.textContent = feelsLike;
        elements.weatherHumidity.textContent = humidity;
        elements.weatherWind.textContent = windText || "-";
        elements.weatherUpdated.textContent = formatWeatherTime(weather.obsTime);
        elements.weatherStatus.textContent = "Weather loaded.";
        setWeatherEmptyStateVisible(false);
        if (elements.mapWeatherText) {
            elements.mapWeatherText.textContent = "Weather: " + weatherText;
        }
        if (elements.mapWeatherTemp) {
            elements.mapWeatherTemp.textContent = "Temp: " + temp;
        }
        if (elements.mapWeatherWind) {
            elements.mapWeatherWind.textContent = "Wind: " + (windText || "-");
        }
    }

    function renderWeatherFallback(message) {
        elements.weatherText.textContent = "-";
        elements.weatherTemp.textContent = "-";
        elements.weatherFeelsLike.textContent = "-";
        elements.weatherHumidity.textContent = "-";
        elements.weatherWind.textContent = "-";
        elements.weatherUpdated.textContent = "-";
        elements.weatherStatus.textContent = message || "Weather unavailable.";
        setWeatherEmptyStateVisible(true);
        if (elements.mapWeatherText) {
            elements.mapWeatherText.textContent = "Weather: -";
        }
        if (elements.mapWeatherTemp) {
            elements.mapWeatherTemp.textContent = "Temp: -";
        }
        if (elements.mapWeatherWind) {
            elements.mapWeatherWind.textContent = "Wind: -";
        }
    }

    function setWeatherEmptyStateVisible(visible) {
        if (!elements.weatherEmptyState) {
            return;
        }
        elements.weatherEmptyState.classList.toggle("hidden", visible !== true);
    }

    async function loadContextSuggestions(context) {
        const query = buildSuggestionQuery(context);
        const url = query ? "/api/v1/suggestions/context?" + query : "/api/v1/suggestions/context";
        elements.suggestionStatus.textContent = "Loading suggestions...";
        try {
            const suggestionData = await fetchApi(url);
            renderSuggestions(suggestionData);
        } catch (error) {
            const detail = normalizeErrorMessage(error, "Suggestions unavailable");
            renderSuggestionFallback("Suggestions unavailable: " + detail);
        }
    }

    function buildSuggestionQuery(context) {
        const params = new URLSearchParams();
        const safeContext = context || {};

        if (safeContext.sceneType) {
            params.set("sceneType", safeContext.sceneType);
        }
        if (safeContext.poiId !== null && safeContext.poiId !== undefined) {
            params.set("poiId", String(safeContext.poiId));
        }
        if (safeContext.routeDistance !== null && safeContext.routeDistance !== undefined) {
            params.set("routeDistance", String(safeContext.routeDistance));
        }
        if (safeContext.routeDuration !== null && safeContext.routeDuration !== undefined) {
            params.set("routeDuration", String(safeContext.routeDuration));
        }
        return params.toString();
    }

    function renderSuggestions(suggestionData) {
        const title = suggestionData && suggestionData.title ? suggestionData.title : "Route Suggestions";
        const suggestions = suggestionData && Array.isArray(suggestionData.suggestions)
            ? suggestionData.suggestions
            : [];

        elements.suggestionTitle.textContent = title;
        elements.suggestionList.innerHTML = "";

        if (suggestions.length === 0) {
            const item = document.createElement("li");
            item.textContent = "No suggestions yet. Continue searching POIs or planning a route.";
            elements.suggestionList.appendChild(item);
        } else {
            suggestions.slice(0, 3).forEach(function (text) {
                const item = document.createElement("li");
                item.textContent = normalizeText(text, "-");
                elements.suggestionList.appendChild(item);
            });
        }
        elements.suggestionStatus.textContent = "Suggestions updated.";
    }

    function renderSuggestionFallback(message) {
        elements.suggestionTitle.textContent = "Route Suggestions";
        elements.suggestionList.innerHTML = "";
        const item = document.createElement("li");
        item.textContent = "Suggestions are temporarily unavailable. Please try again later.";
        elements.suggestionList.appendChild(item);
        elements.suggestionStatus.textContent = message || "Suggestions unavailable.";
    }

    function refreshSuggestionsAfterRouteClear() {
        if (state.selectedPoiId !== null && state.selectedPoiId !== undefined) {
            loadContextSuggestions({
                sceneType: "poi_detail",
                poiId: state.selectedPoiId
            });
            return;
        }
        loadContextSuggestions({
            sceneType: "home"
        });
    }

    function openRoutePlannerFromDetail() {
        if (!state.selectedPoi) {
            ensureRoutePlanningCardVisible({pushSearchFlow: true});
            setRouteFeedback("Select a POI to set destination, or set route points manually.", "info");
            return;
        }
        ensureRoutePlanningCardVisible({pushSearchFlow: true});

        state.routeEndPoi = state.selectedPoi;

        const startConflict = isSamePoiOrCoordinate(state.routeStartPoi, state.routeEndPoi);
        if (startConflict) {
            state.routeStartPoi = null;
            clearRouteDrawing();
            state.routeAlternatives = [];
            state.selectedRouteAlternativeIndex = 0;
        }

        state.routeViaPois = state.routeViaPois.map(function (item) {
            if (!item) {
                return null;
            }
            if (isSamePoiOrCoordinate(item, state.routeStartPoi) || isSamePoiOrCoordinate(item, state.routeEndPoi)) {
                return null;
            }
            return item;
        });

        clearRouteAdvice();
        invalidateRoutePlanRequests();
        renderRouteSelection();
        renderRouteEndpointMarkers();

        if (!state.routeStartPoi) {
            setRouteFeedback("Destination set from POI details. Please choose a start point.", "info");
            return;
        }

        setRouteFeedback("Destination set from POI details.", "info");
        tryAutoReplanRoute();
    }

    function setRouteMode(mode, fromUserAction) {
        const normalizedMode = normalizeRouteMode(mode);
        state.routeMode = normalizedMode;
        if (elements.routeMode) {
            elements.routeMode.value = normalizedMode;
        }
        syncRouteModeButtons();
        clearRouteAdvice();
        invalidateRoutePlanRequests();
        if (fromUserAction) {
            setRouteFeedback(capitalizeRouteMode(normalizedMode) + " mode selected.", "info");
            tryAutoReplanRoute();
        }
    }

    function syncRouteModeButtons() {
        if (!elements.routeModeWalkingBtn || !elements.routeModeCyclingBtn) {
            return;
        }
        const activeMode = normalizeRouteMode(state.routeMode);
        elements.routeModeWalkingBtn.classList.toggle("active", activeMode === "walking");
        elements.routeModeCyclingBtn.classList.toggle("active", activeMode === "cycling");
        elements.routeModeWalkingBtn.setAttribute("aria-pressed", activeMode === "walking" ? "true" : "false");
        elements.routeModeCyclingBtn.setAttribute("aria-pressed", activeMode === "cycling" ? "true" : "false");
    }

    function swapRouteEndpoints() {
        if (!state.routeStartPoi && !state.routeEndPoi) {
            setRouteFeedback("Please set start and destination first.", "error");
            return;
        }
        ensureRoutePlanningCardVisible({pushSearchFlow: false});

        const currentStart = state.routeStartPoi;
        state.routeStartPoi = state.routeEndPoi;
        state.routeEndPoi = currentStart;
        state.routeViaPois = state.routeViaPois.map(function (item) {
            if (!item) {
                return null;
            }
            if (isSamePoiOrCoordinate(item, state.routeStartPoi) || isSamePoiOrCoordinate(item, state.routeEndPoi)) {
                return null;
            }
            return item;
        });

        clearRouteAdvice();
        invalidateRoutePlanRequests();
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback("Start and destination swapped.", "info");
        tryAutoReplanRoute();
    }

    function assignRoutePoint(type) {
        if (type === "start" && state.currentLocation) {
            const currentPoi = buildCurrentLocationPoi();
            setRoutePointFromPoi(type, currentPoi, "Start point set to current location.");
            return;
        }

        if (!state.selectedPoi) {
            window.alert("Please select a POI first.");
            return;
        }

        setRoutePointFromPoi(type, state.selectedPoi, "Route point updated.");
    }

    function setRoutePointFromPoi(type, poi, feedbackMessage) {
        if (!poi) {
            window.alert("Please select a POI first.");
            return false;
        }
        ensureRoutePlanningCardVisible();

        if (type === "start") {
            state.routeStartPoi = poi;
            state.routeViaPois = state.routeViaPois.map(function (item) {
                if (!item) {
                    return null;
                }
                return isSamePoiOrCoordinate(item, state.routeStartPoi) ? null : item;
            });
        } else if (type === "end") {
            state.routeEndPoi = poi;
            state.routeViaPois = state.routeViaPois.map(function (item) {
                if (!item) {
                    return null;
                }
                return isSamePoiOrCoordinate(item, state.routeEndPoi) ? null : item;
            });
        } else if (type === "via") {
            if (isSamePoiOrCoordinate(poi, state.routeStartPoi) || isSamePoiOrCoordinate(poi, state.routeEndPoi)) {
                window.alert("Waypoint cannot be the same as start or destination.");
                return false;
            }
            if (state.routeViaPois.some(function (item) { return item && isSamePoiOrCoordinate(item, poi); })) {
                window.alert("This location is already added as a waypoint.");
                return false;
            }
            const firstEmptyIndex = findFirstEmptyWaypointIndex();
            if (firstEmptyIndex >= 0) {
                state.routeViaPois[firstEmptyIndex] = poi;
            } else {
                if (state.routeViaPois.length >= MAX_ROUTE_WAYPOINTS) {
                    window.alert("Too many waypoints.");
                    return false;
                }
                state.routeViaPois.push(poi);
            }
        } else {
            return false;
        }

        clearRouteAdvice();
        invalidateRoutePlanRequests();
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback(feedbackMessage || "Route point updated.", "info");
        tryAutoReplanRoute();
        return true;
    }

    function clearRoutePoint(type) {
        let feedbackMessage = "";
        if (type === "start") {
            if (!state.routeStartPoi) {
                setRouteFeedback("Start is already empty.", "info");
                return;
            }
            state.routeStartPoi = null;
            feedbackMessage = "Start point cleared.";
        } else if (type === "end") {
            if (!state.routeEndPoi) {
                setRouteFeedback("Destination is already empty.", "info");
                return;
            }
            state.routeEndPoi = null;
            feedbackMessage = "Destination point cleared.";
        } else {
            return;
        }

        clearRouteAdvice();
        invalidateRoutePlanRequests();
        clearRouteDrawing();
        state.routeAlternatives = [];
        state.selectedRouteAlternativeIndex = 0;
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback(feedbackMessage, "info");
        refreshSuggestionsAfterRouteClear();
    }

    function addEmptyWaypointSlot() {
        ensureRoutePlanningCardVisible();
        if (state.routeViaPois.length >= MAX_ROUTE_WAYPOINTS) {
            window.alert("Too many waypoints.");
            return;
        }
        state.routeViaPois.push(null);
        clearRouteAdvice();
        invalidateRoutePlanRequests();
        renderRouteSelection();
        setRouteFeedback("Waypoint slot added.", "info");
    }

    function removeWaypointSlot(index) {
        ensureRoutePlanningCardVisible();
        if (!Number.isInteger(index) || index < 0 || index >= state.routeViaPois.length) {
            return;
        }
        state.routeViaPois.splice(index, 1);
        clearRouteAdvice();
        invalidateRoutePlanRequests();
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback("Waypoint removed.", "info");
        tryAutoReplanRoute();
    }

    function findFirstEmptyWaypointIndex() {
        for (let i = 0; i < state.routeViaPois.length; i += 1) {
            if (!state.routeViaPois[i]) {
                return i;
            }
        }
        return -1;
    }

    function getAssignedWaypoints() {
        if (!Array.isArray(state.routeViaPois)) {
            return [];
        }
        return state.routeViaPois.filter(function (poi) {
            return !!poi;
        });
    }

    function tryAutoReplanRoute() {
        if (!state.routeStartPoi || !state.routeEndPoi) {
            return;
        }
        planWalkingRoute();
    }

    function handleMapRightClickForRouteSelection(event) {
        if (isEventFromMapRoutePointMenu(event)) {
            return;
        }
        if (!event || !event.lnglat) {
            return;
        }
        const rawEvent = event.originEvent || event.domEvent || event.originalEvent;
        if (rawEvent && typeof rawEvent.preventDefault === "function") {
            rawEvent.preventDefault();
        }

        const lng = Number(typeof event.lnglat.getLng === "function" ? event.lnglat.getLng() : event.lnglat.lng);
        const lat = Number(typeof event.lnglat.getLat === "function" ? event.lnglat.getLat() : event.lnglat.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            window.alert("Invalid map coordinate.");
            return;
        }

        state.pendingMapClickPoi = buildMapClickPoi(lng, lat);
        showMapRoutePointMenu(event);
    }

    function applyMapClickRoutePoint(type) {
        const mapPoi = readMapRoutePointFromMenu() || state.pendingMapClickPoi;
        hideMapRoutePointMenu(true);
        if (!mapPoi) {
            return;
        }
        const messages = {
            start: "Start point set from map.",
            end: "Destination set from map.",
            via: "Waypoint set from map."
        };
        const updated = setRoutePointFromPoi(type, mapPoi, messages[type] || "Route point updated.");
        if (!updated) {
            return;
        }
    }

    function applyMapClickSavePlace() {
        const mapPoi = readMapRoutePointFromMenu() || state.pendingMapClickPoi;
        hideMapRoutePointMenu(true);
        if (!mapPoi) {
            return;
        }
        const saved = savePlaceToSavedList(mapPoi, "map-right-click");
        showMapToast("Saved \"" + saved.name + "\".");
    }

    function showMapRoutePointMenu(event) {
        if (!elements.mapRoutePointMenu || !elements.mapPanel) {
            return;
        }
        const menu = elements.mapRoutePointMenu;
        const panel = elements.mapPanel;
        const panelWidth = panel.clientWidth;
        const panelHeight = panel.clientHeight;
        const pixel = getMapClickPixel(event);
        let left = pixel[0] + 14;
        let top = pixel[1] - 4;

        if (event && event.lnglat) {
            const lng = Number(typeof event.lnglat.getLng === "function" ? event.lnglat.getLng() : event.lnglat.lng);
            const lat = Number(typeof event.lnglat.getLat === "function" ? event.lnglat.getLat() : event.lnglat.lat);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                menu.dataset.lng = Number(lng).toFixed(6);
                menu.dataset.lat = Number(lat).toFixed(6);
            }
        }

        menu.hidden = false;
        menu.style.left = left + "px";
        menu.style.top = top + "px";

        const menuWidth = menu.offsetWidth || 190;
        const menuHeight = menu.offsetHeight || 130;
        const minPadding = 8;
        const maxLeft = Math.max(minPadding, panelWidth - menuWidth - minPadding);
        const maxTop = Math.max(minPadding, panelHeight - menuHeight - minPadding);
        left = Math.min(Math.max(minPadding, left), maxLeft);
        top = Math.min(Math.max(minPadding, top), maxTop);
        menu.style.left = left + "px";
        menu.style.top = top + "px";
    }

    function hideMapRoutePointMenu(clearPending) {
        const shouldClearPending = clearPending === true;
        if (shouldClearPending) {
            state.pendingMapClickPoi = null;
        }
        if (!elements.mapRoutePointMenu) {
            return;
        }
        if (shouldClearPending) {
            delete elements.mapRoutePointMenu.dataset.lng;
            delete elements.mapRoutePointMenu.dataset.lat;
        }
        elements.mapRoutePointMenu.hidden = true;
    }

    function readMapRoutePointFromMenu() {
        if (!elements.mapRoutePointMenu) {
            return null;
        }
        const lng = Number(elements.mapRoutePointMenu.dataset.lng);
        const lat = Number(elements.mapRoutePointMenu.dataset.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
        }
        return buildMapClickPoi(lng, lat);
    }

    function isEventFromMapRoutePointMenu(event) {
        const rawEvent = event && (event.originEvent || event.domEvent || event.originalEvent);
        const target = rawEvent && rawEvent.target;
        if (!target || typeof target.closest !== "function") {
            return false;
        }
        return Boolean(target.closest("#map-route-point-menu"));
    }

    function getMapClickPixel(event) {
        if (event && event.pixel) {
            if (typeof event.pixel.getX === "function" && typeof event.pixel.getY === "function") {
                return [Number(event.pixel.getX()) || 0, Number(event.pixel.getY()) || 0];
            }
            const x = Number(event.pixel.x);
            const y = Number(event.pixel.y);
            if (Number.isFinite(x) && Number.isFinite(y)) {
                return [x, y];
            }
        }
        if (state.map && event && event.lnglat && typeof state.map.lngLatToContainer === "function") {
            const p = state.map.lngLatToContainer(event.lnglat);
            if (p) {
                const x = Number(typeof p.getX === "function" ? p.getX() : p.x);
                const y = Number(typeof p.getY === "function" ? p.getY() : p.y);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    return [x, y];
                }
            }
        }
        return [16, 16];
    }

    function buildMapClickPoi(lng, lat) {
        const normalizedLng = Number(lng).toFixed(6);
        const normalizedLat = Number(lat).toFixed(6);
        return {
            id: "__map_click__" + normalizedLng + "_" + normalizedLat,
            name: "Map Point (" + normalizedLng + ", " + normalizedLat + ")",
            type: "map_point",
            longitude: Number(normalizedLng),
            latitude: Number(normalizedLat),
            description: "Point selected from map click",
            openingHours: "-",
            enabled: true
        };
    }

    function isSamePoiOrCoordinate(a, b) {
        if (!a || !b) {
            return false;
        }
        if (a.id !== undefined && b.id !== undefined && a.id === b.id) {
            return true;
        }
        const aPosition = getPoiPosition(a);
        const bPosition = getPoiPosition(b);
        if (!aPosition || !bPosition) {
            return false;
        }
        return Math.abs(aPosition[0] - bPosition[0]) < 0.000001
            && Math.abs(aPosition[1] - bPosition[1]) < 0.000001;
    }

    function ensureRoutePlanningCardVisible(options) {
        const pushSearchFlow = !options || options.pushSearchFlow !== false;
        state.historyRouteMode = false;
        setSearchCardsVisible(true);
        setUiMode(DRAWER_MODES.ROUTE_PLANNING, pushSearchFlow ? {pushSearchFlow: true} : undefined);

        if (elements.routeCard && typeof elements.routeCard.scrollIntoView === "function") {
            elements.routeCard.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    }

    async function planWalkingRoute() {
        if (!state.routeStartPoi || !state.routeEndPoi) {
            clearRouteAdvice();
            setRouteFeedback("Please set both start and destination.", "error");
            return;
        }
        state.routeMode = normalizeRouteMode(elements.routeMode ? elements.routeMode.value : state.routeMode);
        const requestId = invalidateRoutePlanRequests({
            keepRecommendedApplyContext: state.pendingRecommendedApply
        });
        clearRouteAdvice();
        clearRouteDrawing();

        const startPosition = getPoiPosition(state.routeStartPoi);
        const endPosition = getPoiPosition(state.routeEndPoi);
        if (!startPosition || !endPosition) {
            clearRouteAdvice();
            setRouteFeedback("Start or destination has invalid coordinates.", "error");
            return;
        }
        const viaPois = getAssignedWaypoints();
        const viaPositions = [];
        for (let i = 0; i < viaPois.length; i += 1) {
            const viaPoi = viaPois[i];
            const viaPosition = getPoiPosition(viaPoi);
            if (!viaPosition) {
                clearRouteAdvice();
                setRouteFeedback("Waypoint has invalid coordinates.", "error");
                return;
            }
            viaPositions.push(viaPosition);
        }

        if (state.routeStartPoi.id === state.routeEndPoi.id) {
            clearRouteAdvice();
            setRouteFeedback("Please choose two different POIs.", "error");
            return;
        }

        const params = new URLSearchParams();
        params.set("originLng", String(startPosition[0]));
        params.set("originLat", String(startPosition[1]));
        params.set("destinationLng", String(endPosition[0]));
        params.set("destinationLat", String(endPosition[1]));
        const originType = readRouteEndpointType(state.routeStartPoi);
        const destinationType = readRouteEndpointType(state.routeEndPoi);
        if (originType) {
            params.set("originType", originType);
        }
        if (destinationType) {
            params.set("destinationType", destinationType);
        }
        viaPositions.forEach(function (viaPosition) {
            params.append("viaLng", String(viaPosition[0]));
            params.append("viaLat", String(viaPosition[1]));
        });
        const routeEndpoint = state.routeMode === "cycling"
            ? "/api/v1/routes/cycling"
            : "/api/v1/routes/walking";

        try {
            setRouteFeedback("Planning " + state.routeMode + " route...", "info");
            const routeData = await fetchApi(routeEndpoint + "?" + params.toString());
            if (requestId !== state.routePlanRequestId) {
                return;
            }
            const alternatives = normalizeRouteAlternatives(routeData);
            if (alternatives.length === 0) {
                if (handleRecommendedApplyFailureFallback("No " + state.routeMode + " route alternatives returned.", requestId)) {
                    return;
                }
                clearRouteAdvice();
                setRouteFeedback("No " + state.routeMode + " route alternatives returned.", "error");
                refreshSuggestionsAfterRouteClear();
                return;
            }

            state.routeAlternatives = alternatives;
            state.selectedRouteAlternativeIndex = 0;
            const selectedRoute = alternatives[0];

            drawRoutePolyline(selectedRoute.routePolyline, state.routeMode);
            renderRouteEndpointMarkers();
            renderRouteSummary(selectedRoute);
            renderRouteAlternatives();
            renderRouteAdviceFromRouteData(routeData);
            fitRouteView();
            let routeMessage = capitalizeRouteMode(state.routeMode) + " route planned.";
            try {
                await saveCurrentRouteHistory(selectedRoute);
                await loadRouteHistoryList(state.historyKeyword);
            } catch (historyError) {
                routeMessage += " Route save failed, route remains available.";
            }
            setRouteFeedback(routeMessage, "success");
            clearRecommendedApplyContext();
            loadContextSuggestions({
                sceneType: "route_planning",
                poiId: state.routeEndPoi ? state.routeEndPoi.id : null,
                routeDistance: selectedRoute.distance,
                routeDuration: selectedRoute.duration
            });
        } catch (error) {
            if (requestId !== state.routePlanRequestId) {
                return;
            }
            if (handleRecommendedApplyFailureFallback(error.message, requestId)) {
                return;
            }
            clearRouteAdvice();
            setRouteFeedback(error.message || (capitalizeRouteMode(state.routeMode) + " route planning failed."), "error");
            refreshSuggestionsAfterRouteClear();
        }
    }

    function clearRouteAll(silent) {
        const isSilent = silent === true;
        invalidateRoutePlanRequests();
        clearRouteDrawing();
        clearRouteAdvice();
        clearRouteEndpointMarkers();
        state.routeStartPoi = null;
        state.routeEndPoi = null;
        state.routeViaPois = [];
        state.routeAlternatives = [];
        state.selectedRouteAlternativeIndex = 0;
        setRoutePanelState("empty");
        renderRouteSelection();
        if (!isSilent) {
            setRouteFeedback("Route cleared.", "info");
        }
        refreshSuggestionsAfterRouteClear();
    }

    function clearRouteDrawing() {
        hideRouteSummary();
        if (!state.map || !state.routeLine) {
            state.routeLine = null;
            return;
        }
        state.map.remove(state.routeLine);
        state.routeLine = null;
    }

    function drawRoutePolyline(path, mode) {
        if (!state.mapReady || !state.map) {
            return;
        }
        const normalizedMode = normalizeRouteMode(mode);
        const strokeColor = normalizedMode === "cycling" ? "#0f9d58" : "#1a73e8";

        state.routeLine = new AMap.Polyline({
            path: path,
            strokeColor: strokeColor,
            strokeWeight: 6,
            lineJoin: "round",
            lineCap: "round"
        });
        state.map.add(state.routeLine);
    }

    function renderRouteEndpointMarkers() {
        if (!state.mapReady || !state.map) {
            return;
        }

        clearRouteEndpointMarkers();

        const startPos = getPoiPosition(state.routeStartPoi);
        if (startPos) {
            state.routeStartMarker = createEndpointMarker(startPos, "start", state.routeStartPoi.name || "Start");
            state.map.add(state.routeStartMarker);
        }

        const endPos = getPoiPosition(state.routeEndPoi);
        if (endPos) {
            state.routeEndMarker = createEndpointMarker(endPos, "end", state.routeEndPoi.name || "Destination");
            state.map.add(state.routeEndMarker);
        }

        state.routeViaMarkers = [];
        let viaMarkerOrder = 0;
        state.routeViaPois.forEach(function (viaPoi) {
            const viaPos = getPoiPosition(viaPoi);
            if (!viaPos) {
                return;
            }
            viaMarkerOrder += 1;
            const marker = createEndpointMarker(viaPos, "via", viaPoi.name || "Waypoint", "V" + viaMarkerOrder);
            state.routeViaMarkers.push(marker);
            state.map.add(marker);
        });
    }

    function clearRouteEndpointMarkers() {
        if (!state.map) {
            return;
        }
        if (state.routeStartMarker) {
            state.map.remove(state.routeStartMarker);
            state.routeStartMarker = null;
        }
        if (state.routeEndMarker) {
            state.map.remove(state.routeEndMarker);
            state.routeEndMarker = null;
        }
        if (Array.isArray(state.routeViaMarkers) && state.routeViaMarkers.length > 0) {
            state.routeViaMarkers.forEach(function (marker) {
                state.map.remove(marker);
            });
        }
        state.routeViaMarkers = [];
    }

    function createEndpointMarker(position, type, title, customLabel) {
        const label = customLabel || (type === "start" ? "S" : type === "end" ? "E" : "V");
        return new AMap.Marker({
            position: position,
            title: title,
            content: "<div class='endpoint-marker " + type + "'>" + label + "</div>",
            offset: new AMap.Pixel(-12, -12)
        });
    }

    function renderRouteSelection() {
        if (elements.routeMode) {
            elements.routeMode.value = normalizeRouteMode(state.routeMode);
        }
        syncRouteModeButtons();
        if (elements.routeStartName) {
            elements.routeStartName.value = state.routeStartPoi ? state.routeStartPoi.name : "Not selected";
        }
        if (elements.routeStartClearBtn) {
            elements.routeStartClearBtn.disabled = !state.routeStartPoi;
        }
        if (elements.routeEndName) {
            elements.routeEndName.value = state.routeEndPoi ? state.routeEndPoi.name : "Not selected";
        }
        if (elements.routeEndClearBtn) {
            elements.routeEndClearBtn.disabled = !state.routeEndPoi;
        }
        renderWaypointRows();
        updateRoutePlanningEmptyState();
    }

    function updateRoutePlanningEmptyState() {
        if (!elements.routeEmptyState) {
            return;
        }
        const hasStart = !!state.routeStartPoi;
        const hasEnd = !!state.routeEndPoi;
        const hasWaypoints = getAssignedWaypoints().length > 0;
        const hasSummary = !!(elements.routeSummary && !elements.routeSummary.classList.contains("hidden"));
        const computedState = resolveRoutePanelState(hasStart, hasEnd, hasWaypoints, hasSummary);
        setRoutePanelState(computedState);

        if (hasSummary) {
            elements.routeEmptyState.classList.add("hidden");
            return;
        }

        const titleElement = elements.routeEmptyState.querySelector(".empty-state-title");
        const bodyElement = elements.routeEmptyState.querySelector(".empty-state-body");
        const hintElement = elements.routeEmptyState.querySelector(".empty-state-hint");

        if (computedState === "failed") {
            if (titleElement) {
                titleElement.textContent = "Route planning failed";
            }
            if (bodyElement) {
                bodyElement.textContent = "No valid route is available with the current route points.";
            }
            if (hintElement) {
                hintElement.textContent = "Hint: adjust start, destination, or waypoints and try again.";
            }
            elements.routeEmptyState.classList.remove("hidden");
            return;
        }

        if (!hasStart && !hasEnd && !hasWaypoints) {
            if (titleElement) {
                titleElement.textContent = "No route points selected";
            }
            if (bodyElement) {
                bodyElement.textContent = "Please choose a start point and destination first.";
            }
            if (hintElement) {
                hintElement.textContent = "Hint: set points from POI details, map right-click, or recents.";
            }
            elements.routeEmptyState.classList.remove("hidden");
            return;
        }

        if (titleElement) {
            titleElement.textContent = "Ready to plan route";
        }
        if (bodyElement) {
            bodyElement.textContent = hasStart && hasEnd
                ? "Start and destination are set. Click Start Route Planning."
                : "Route points are partially selected. Complete both start and destination.";
        }
        if (hintElement) {
            hintElement.textContent = "Hint: add up to 5 waypoints for multi-stop planning.";
        }
        elements.routeEmptyState.classList.remove("hidden");
    }

    function renderWaypointRows() {
        if (!elements.routeWaypointList) {
            return;
        }
        const slots = Array.isArray(state.routeViaPois) ? state.routeViaPois : [];
        elements.routeWaypointList.innerHTML = "";

        slots.forEach(function (poi, index) {
            const wrapper = document.createElement("div");
            wrapper.className = "route-point route-waypoint-item" + (!poi ? " empty" : "");
            wrapper.innerHTML =
                "<span class=\"route-point-label\">Waypoint " + (index + 1) + "</span>" +
                "<div class=\"route-waypoint-row\">" +
                "<input type=\"text\" class=\"route-point-input\" readonly value=\"" + escapeHtml(poi ? poi.name : "Not selected") + "\">" +
                "<button type=\"button\" class=\"route-waypoint-remove-btn\" data-waypoint-remove=\"" + index + "\" aria-label=\"Remove waypoint\">-</button>" +
                "</div>";
            elements.routeWaypointList.appendChild(wrapper);
        });

        if (elements.addWaypointBtn) {
            elements.addWaypointBtn.disabled = slots.length >= MAX_ROUTE_WAYPOINTS;
            elements.addWaypointBtn.textContent = slots.length >= MAX_ROUTE_WAYPOINTS
                ? "Max 5 waypoints"
                : "+ Add Waypoint";
        }
    }

    function renderRouteSummary(routeData) {
        elements.routeDistance.textContent = formatDistance(routeData.distance);
        elements.routeDuration.textContent = formatDuration(routeData.duration);

        const steps = Array.isArray(routeData.steps) ? routeData.steps : [];
        elements.routeSteps.innerHTML = "";
        const preview = steps.slice(0, 5);
        preview.forEach(function (step) {
            const li = document.createElement("li");
            const instruction = step && step.instruction ? step.instruction : "Continue";
            li.textContent = instruction;
            elements.routeSteps.appendChild(li);
        });

        elements.routeSummary.classList.remove("hidden");
        setRoutePanelState("planned");
        updateRoutePlanningEmptyState();
    }

    function hideRouteSummary() {
        elements.routeSummary.classList.add("hidden");
        elements.routeSteps.innerHTML = "";
        elements.routeDistance.textContent = "-";
        elements.routeDuration.textContent = "-";
        if (elements.routeAlternativeWrap) {
            elements.routeAlternativeWrap.classList.add("hidden");
        }
        if (elements.routeAlternativeList) {
            elements.routeAlternativeList.innerHTML = "";
        }
        updateRoutePlanningEmptyState();
    }

    function normalizeRouteAlternatives(routeData) {
        const candidates = Array.isArray(routeData && routeData.alternatives) && routeData.alternatives.length > 0
            ? routeData.alternatives
            : [routeData];

        const result = [];
        candidates.slice(0, 3).forEach(function (candidate) {
            const polyline = normalizeRoutePolyline(candidate ? candidate.routePolyline : null);
            if (polyline.length === 0) {
                return;
            }
            result.push({
                distance: candidate && candidate.distance ? candidate.distance : 0,
                duration: candidate && candidate.duration ? candidate.duration : 0,
                steps: Array.isArray(candidate && candidate.steps) ? candidate.steps : [],
                routePolyline: polyline
            });
        });
        return result;
    }

    function renderRouteAlternatives() {
        if (!elements.routeAlternativeWrap || !elements.routeAlternativeList) {
            return;
        }
        const alternatives = Array.isArray(state.routeAlternatives) ? state.routeAlternatives : [];
        if (alternatives.length <= 1) {
            elements.routeAlternativeWrap.classList.add("hidden");
            elements.routeAlternativeList.innerHTML = "";
            return;
        }

        elements.routeAlternativeWrap.classList.remove("hidden");
        elements.routeAlternativeList.innerHTML = "";
        alternatives.forEach(function (route, index) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "route-alt-btn" + (index === state.selectedRouteAlternativeIndex ? " active" : "");
            btn.dataset.altIndex = String(index);
            const title = document.createElement("span");
            title.className = "route-alt-title";
            title.textContent = "Route " + (index + 1);

            const meta = document.createElement("span");
            meta.className = "route-alt-meta";
            meta.textContent = formatDistance(route.distance) + " | " + formatDuration(route.duration);

            btn.appendChild(title);
            btn.appendChild(meta);
            elements.routeAlternativeList.appendChild(btn);
        });
    }

    function selectRouteAlternative(index) {
        const alternatives = Array.isArray(state.routeAlternatives) ? state.routeAlternatives : [];
        if (index < 0 || index >= alternatives.length) {
            return;
        }
        const selectedRoute = alternatives[index];
        state.selectedRouteAlternativeIndex = index;
        clearRouteDrawing();
        drawRoutePolyline(selectedRoute.routePolyline, state.routeMode);
        renderRouteSummary(selectedRoute);
        renderRouteAlternatives();
        renderRouteEndpointMarkers();
        fitRouteView();
        setRouteFeedback("Switched to route " + (index + 1) + ".", "info");
    }

    function invalidateRoutePlanRequests(options) {
        const keepRecommendedApplyContext = !!(options && options.keepRecommendedApplyContext);
        if (!keepRecommendedApplyContext) {
            clearRecommendedApplyContext();
        }
        state.routePlanRequestId += 1;
        return state.routePlanRequestId;
    }

    function readRouteEndpointType(poi) {
        if (!poi || typeof poi.type !== "string") {
            return "";
        }
        return normalizeInput(poi.type);
    }

    function renderRouteAdviceFromRouteData(routeData) {
        const advice = buildRouteAdviceFromResponse(routeData);
        renderRouteAdvice(advice);
    }

    function buildRouteAdviceFromResponse(routeData) {
        if (!routeData || typeof routeData !== "object") {
            return null;
        }
        const adviceText = normalizeText(routeData.smartTravelAdvice, "");
        if (!adviceText) {
            return null;
        }
        const waypointName = normalizeText(routeData.recommendedWaypointName, "");
        const waypointLng = Number(routeData.recommendedWaypointLng);
        const waypointLat = Number(routeData.recommendedWaypointLat);
        const hasWaypointCoordinate = Number.isFinite(waypointLng) && Number.isFinite(waypointLat);
        return {
            weatherRiskLevel: normalizeText(routeData.weatherRiskLevel, "LOW").toUpperCase(),
            weatherRiskType: normalizeText(routeData.weatherRiskType, ""),
            smartTravelAdvice: adviceText,
            recommendedWaypointName: waypointName,
            recommendedStrategyTag: normalizeText(routeData.recommendedStrategyTag, ""),
            recommendedWaypointLng: hasWaypointCoordinate ? waypointLng : null,
            recommendedWaypointLat: hasWaypointCoordinate ? waypointLat : null
        };
    }

    function clearRouteAdvice() {
        state.routeAdvice = null;
        if (elements.routeAdviceBlock) {
            elements.routeAdviceBlock.classList.add("hidden");
        }
        if (elements.routeAdviceRisk) {
            elements.routeAdviceRisk.textContent = "-";
            elements.routeAdviceRisk.classList.remove("risk-high", "risk-medium", "risk-low");
        }
        if (elements.routeAdviceText) {
            elements.routeAdviceText.textContent = "-";
        }
        if (elements.routeAdviceWaypoint) {
            elements.routeAdviceWaypoint.textContent = "-";
            elements.routeAdviceWaypoint.classList.add("hidden");
        }
        if (elements.routeAdviceApplyBtn) {
            elements.routeAdviceApplyBtn.classList.add("hidden");
            elements.routeAdviceApplyBtn.disabled = false;
            delete elements.routeAdviceApplyBtn.dataset.recommendedLng;
            delete elements.routeAdviceApplyBtn.dataset.recommendedLat;
            delete elements.routeAdviceApplyBtn.dataset.recommendedName;
        }
    }

    function renderRouteAdvice(advice) {
        if (!elements.routeAdviceBlock) {
            return;
        }
        if (!advice || !normalizeText(advice.smartTravelAdvice, "")) {
            clearRouteAdvice();
            return;
        }

        state.routeAdvice = advice;
        elements.routeAdviceBlock.classList.remove("hidden");

        const riskLevel = normalizeText(advice.weatherRiskLevel, "LOW").toUpperCase();
        const riskType = normalizeText(advice.weatherRiskType, "");
        const badgeText = riskType ? (riskLevel + " | " + riskType.replace(/_/g, " ")) : riskLevel;
        if (elements.routeAdviceRisk) {
            elements.routeAdviceRisk.textContent = badgeText;
            elements.routeAdviceRisk.classList.remove("risk-high", "risk-medium", "risk-low");
            if (riskLevel === "HIGH") {
                elements.routeAdviceRisk.classList.add("risk-high");
            } else if (riskLevel === "MEDIUM") {
                elements.routeAdviceRisk.classList.add("risk-medium");
            } else {
                elements.routeAdviceRisk.classList.add("risk-low");
            }
        }

        if (elements.routeAdviceText) {
            elements.routeAdviceText.textContent = advice.smartTravelAdvice;
        }

        const waypointName = normalizeText(advice.recommendedWaypointName, "");
        const hasWaypointCoord = Number.isFinite(Number(advice.recommendedWaypointLng))
            && Number.isFinite(Number(advice.recommendedWaypointLat));
        if (elements.routeAdviceWaypoint) {
            if (waypointName) {
                elements.routeAdviceWaypoint.textContent = "Recommended waypoint: " + waypointName;
                elements.routeAdviceWaypoint.classList.remove("hidden");
            } else {
                elements.routeAdviceWaypoint.textContent = "-";
                elements.routeAdviceWaypoint.classList.add("hidden");
            }
        }

        if (!elements.routeAdviceApplyBtn) {
            return;
        }
        if (!hasWaypointCoord) {
            elements.routeAdviceApplyBtn.classList.add("hidden");
            return;
        }

        const rejectMessage = getRecommendedWaypointApplyRejectReason({
            name: waypointName || "Recommended waypoint",
            longitude: Number(advice.recommendedWaypointLng),
            latitude: Number(advice.recommendedWaypointLat),
            id: "__recommended_waypoint__" + String(advice.recommendedWaypointLng) + "_" + String(advice.recommendedWaypointLat),
            type: "recommended_waypoint",
            description: "Weather-aware recommended waypoint",
            openingHours: "-",
            enabled: true
        });
        if (rejectMessage) {
            elements.routeAdviceApplyBtn.classList.add("hidden");
            return;
        }

        elements.routeAdviceApplyBtn.classList.remove("hidden");
        elements.routeAdviceApplyBtn.dataset.recommendedLng = String(advice.recommendedWaypointLng);
        elements.routeAdviceApplyBtn.dataset.recommendedLat = String(advice.recommendedWaypointLat);
        elements.routeAdviceApplyBtn.dataset.recommendedName = waypointName || "Recommended waypoint";
    }

    function getRecommendedWaypointApplyRejectReason(poi) {
        if (!poi) {
            return "Recommended waypoint is unavailable.";
        }
        const position = getPoiPosition(poi);
        if (!position) {
            return "Recommended waypoint has invalid coordinates.";
        }
        if (isSamePoiOrCoordinate(poi, state.routeStartPoi)) {
            return "Recommended waypoint is the same as the start point.";
        }
        if (isSamePoiOrCoordinate(poi, state.routeEndPoi)) {
            return "Recommended waypoint is the same as the destination.";
        }
        if (state.routeViaPois.some(function (item) { return item && isSamePoiOrCoordinate(item, poi); })) {
            return "Recommended waypoint already exists in current route.";
        }
        const emptyIndex = findFirstEmptyWaypointIndex();
        const canAppend = state.routeViaPois.length < MAX_ROUTE_WAYPOINTS;
        if (emptyIndex < 0 && !canAppend) {
            return "Waypoint limit reached (max " + MAX_ROUTE_WAYPOINTS + ").";
        }
        return "";
    }

    function applyRecommendedWaypoint() {
        const advice = state.routeAdvice;
        if (!advice) {
            return;
        }
        const waypoint = {
            id: "__recommended_waypoint__" + String(advice.recommendedWaypointLng) + "_" + String(advice.recommendedWaypointLat),
            name: normalizeText(advice.recommendedWaypointName, "Recommended waypoint"),
            type: "recommended_waypoint",
            longitude: Number(advice.recommendedWaypointLng),
            latitude: Number(advice.recommendedWaypointLat),
            description: "Weather-aware recommended waypoint",
            openingHours: "-",
            enabled: true
        };
        const rejectMessage = getRecommendedWaypointApplyRejectReason(waypoint);
        if (rejectMessage) {
            window.alert(rejectMessage);
            renderRouteAdvice(advice);
            return;
        }

        state.recommendedApplyBackup = captureCurrentRouteSnapshot();
        state.pendingRecommendedApply = true;

        const firstEmptyIndex = findFirstEmptyWaypointIndex();
        if (firstEmptyIndex >= 0) {
            state.routeViaPois[firstEmptyIndex] = waypoint;
        } else {
            state.routeViaPois.push(waypoint);
        }

        clearRouteAdvice();
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback("Recommended waypoint applied. Replanning route...", "info");
        planWalkingRoute();
    }

    function captureCurrentRouteSnapshot() {
        return {
            routeMode: state.routeMode,
            routeStartPoi: cloneJsonValue(state.routeStartPoi),
            routeEndPoi: cloneJsonValue(state.routeEndPoi),
            routeViaPois: cloneJsonValue(state.routeViaPois),
            routeAlternatives: cloneJsonValue(state.routeAlternatives),
            selectedRouteAlternativeIndex: state.selectedRouteAlternativeIndex,
            routeAdvice: cloneJsonValue(state.routeAdvice)
        };
    }

    function restoreRouteSnapshot(snapshot) {
        if (!snapshot) {
            return false;
        }
        state.routeMode = normalizeRouteMode(snapshot.routeMode);
        state.routeStartPoi = cloneJsonValue(snapshot.routeStartPoi);
        state.routeEndPoi = cloneJsonValue(snapshot.routeEndPoi);
        state.routeViaPois = Array.isArray(snapshot.routeViaPois) ? cloneJsonValue(snapshot.routeViaPois) : [];
        state.routeAlternatives = Array.isArray(snapshot.routeAlternatives) ? cloneJsonValue(snapshot.routeAlternatives) : [];
        state.selectedRouteAlternativeIndex = Number.isInteger(snapshot.selectedRouteAlternativeIndex)
            ? snapshot.selectedRouteAlternativeIndex
            : 0;

        renderRouteSelection();
        clearRouteDrawing();
        const alternatives = Array.isArray(state.routeAlternatives) ? state.routeAlternatives : [];
        const selected = alternatives[state.selectedRouteAlternativeIndex] || alternatives[0] || null;
        if (selected && Array.isArray(selected.routePolyline) && selected.routePolyline.length > 0) {
            drawRoutePolyline(selected.routePolyline, state.routeMode);
            renderRouteSummary(selected);
        } else {
            hideRouteSummary();
        }
        renderRouteAlternatives();
        renderRouteEndpointMarkers();
        fitRouteView();

        if (snapshot.routeAdvice) {
            renderRouteAdvice(cloneJsonValue(snapshot.routeAdvice));
        } else {
            clearRouteAdvice();
        }
        return true;
    }

    function clearRecommendedApplyContext() {
        state.pendingRecommendedApply = false;
        state.recommendedApplyBackup = null;
    }

    function handleRecommendedApplyFailureFallback(rawMessage, requestId) {
        if (requestId !== state.routePlanRequestId || !state.pendingRecommendedApply) {
            return false;
        }
        const snapshot = state.recommendedApplyBackup;
        clearRecommendedApplyContext();
        if (!snapshot) {
            return false;
        }
        restoreRouteSnapshot(snapshot);
        setRouteFeedback("Covered waypoint is not routable right now. Fallback to the normal route.", "error");
        return true;
    }

    function cloneJsonValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        return JSON.parse(JSON.stringify(value));
    }

    function fitRouteView() {
        if (!state.map) {
            return;
        }
        const overlays = [];
        if (state.routeLine) {
            overlays.push(state.routeLine);
        }
        if (state.routeStartMarker) {
            overlays.push(state.routeStartMarker);
        }
        if (state.routeEndMarker) {
            overlays.push(state.routeEndMarker);
        }
        if (Array.isArray(state.routeViaMarkers) && state.routeViaMarkers.length > 0) {
            state.routeViaMarkers.forEach(function (marker) {
                overlays.push(marker);
            });
        }

        if (overlays.length > 0) {
            state.map.setFitView(overlays, false, [80, 60, 60, 60]);
        }
    }

    function normalizeRoutePolyline(polyline) {
        if (!Array.isArray(polyline)) {
            return [];
        }

        const result = [];
        polyline.forEach(function (point) {
            if (!Array.isArray(point) || point.length < 2) {
                return;
            }
            const lng = Number(point[0]);
            const lat = Number(point[1]);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                return;
            }
            result.push([lng, lat]);
        });
        return result;
    }

    function getPoiPosition(poi) {
        if (!poi) {
            return null;
        }
        const lng = Number(poi.longitude);
        const lat = Number(poi.latitude);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
        }
        return [lng, lat];
    }

    function formatDistance(distance) {
        const value = Number(distance);
        if (!Number.isFinite(value) || value <= 0) {
            return "-";
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(2) + " km";
        }
        return Math.round(value) + " m";
    }

    function formatDuration(duration) {
        const value = Number(duration);
        if (!Number.isFinite(value) || value <= 0) {
            return "-";
        }
        const minutes = Math.max(1, Math.round(value / 60));
        if (minutes < 60) {
            return minutes + " min";
        }
        const hours = Math.floor(minutes / 60);
        const restMinutes = minutes % 60;
        if (restMinutes === 0) {
            return hours + " h";
        }
        return hours + " h " + restMinutes + " min";
    }

    function loadAmapScript(key) {
        if (window.AMap) {
            return Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = "https://webapi.amap.com/maps?v=2.0&key=" + encodeURIComponent(key);
            script.async = true;
            script.defer = true;
            script.onload = function () {
                if (window.AMap) {
                    resolve();
                } else {
                    reject(new Error("AMap SDK missing."));
                }
            };
            script.onerror = function () {
                reject(new Error("AMap SDK load failed."));
            };
            document.head.appendChild(script);
        });
    }

    async function fetchApi(url, options) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(function () {
            controller.abort();
        }, 8000);

        try {
            const requestOptions = options || {};
            const method = requestOptions.method ? String(requestOptions.method).toUpperCase() : "GET";
            const headers = {
                "Accept": "application/json"
            };
            let body = undefined;
            if (requestOptions.body !== undefined && requestOptions.body !== null) {
                headers["Content-Type"] = "application/json";
                body = JSON.stringify(requestOptions.body);
            }

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body,
                signal: controller.signal
            });

            if (!response.ok) {
                const errorMessage = await parseErrorResponse(response);
                throw new Error(errorMessage);
            }

            const responseBody = await response.json();
            if (!responseBody || typeof responseBody.code !== "number") {
                throw new Error("Invalid API response.");
            }
            if (responseBody.code !== 0) {
                throw new Error(responseBody.message || "Request failed.");
            }
            return responseBody.data;
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new Error("Request timeout, please try again.");
            }
            throw error;
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function parseErrorResponse(response) {
        const fallback = "Request failed with status " + String(response.status);
        if (!response) {
            return fallback;
        }

        try {
            const contentType = normalizeText(response.headers.get("content-type"), "").toLowerCase();
            if (contentType.includes("application/json")) {
                const body = await response.json();
                const message = body && typeof body.message === "string" ? body.message.trim() : "";
                if (message) {
                    return message;
                }
                return fallback;
            }

            const text = await response.text();
            const message = typeof text === "string" ? text.trim() : "";
            return message || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function readConfig(key) {
        if (!window.APP_CONFIG) {
            return "";
        }
        const value = window.APP_CONFIG[key];
        return typeof value === "string" ? value.trim() : "";
    }

    function normalizeInput(value) {
        if (typeof value !== "string") {
            return "";
        }
        return value.trim();
    }

    function normalizeErrorMessage(error, fallback) {
        if (error && typeof error.message === "string" && error.message.trim()) {
            const rawMessage = error.message.trim();
            if (shouldMaskTechnicalError(rawMessage)) {
                return fallback || "Service is temporarily unavailable. Please try again later.";
            }
            return rawMessage;
        }
        return fallback || "Request failed";
    }

    function shouldMaskTechnicalError(message) {
        const normalized = normalizeInput(String(message || "")).toLowerCase();
        if (!normalized) {
            return false;
        }
        return normalized.includes("datasource")
            || normalized.includes("jdbc")
            || normalized.includes("username/password")
            || normalized.includes("connection or query failed")
            || normalized.includes("database access exception")
            || normalized.includes("communications link failure")
            || normalized.includes("failed to obtain jdbc connection")
            || normalized.includes("cannotgetjdbcconnection")
            || normalized.includes("access denied")
            || normalized.includes("sqlsyntax")
            || normalized.includes("bad sql grammar")
            || normalized.includes("unknown column")
            || normalized.includes("table")
            || normalized.includes("doesn't exist");
    }

    function normalizeText(value, fallback) {
        if (typeof value !== "string") {
            return fallback || "";
        }
        const trimmed = value.trim();
        return trimmed ? trimmed : (fallback || "");
    }

    function formatNumericValue(value, suffix) {
        const normalized = normalizeText(String(value || ""), "");
        if (!normalized) {
            return "-";
        }
        return normalized + (suffix || "");
    }

    function formatWeatherTime(value) {
        if (!value) {
            return "-";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
    }

    function normalizeCoordinate(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(6) : null;
    }

    function showMapStatus(message) {
        if (state.mapStatusTimer) {
            window.clearTimeout(state.mapStatusTimer);
            state.mapStatusTimer = null;
        }
        elements.mapStatus.textContent = message;
        elements.mapStatus.classList.remove("hidden");
    }

    function showTemporaryMapStatus(message, durationMs) {
        const timeout = Number(durationMs);
        const duration = Number.isFinite(timeout) && timeout > 0 ? timeout : 2200;
        showMapStatus(message);
        state.mapStatusTimer = window.setTimeout(function () {
            hideMapStatus();
        }, duration);
    }

    function showMapToast(message, durationMs) {
        if (!elements.mapToast) {
            return;
        }
        if (state.mapToastTimer) {
            window.clearTimeout(state.mapToastTimer);
            state.mapToastTimer = null;
        }
        elements.mapToast.textContent = normalizeText(message, "");
        elements.mapToast.classList.remove("hidden");
        const timeout = Number(durationMs);
        const duration = Number.isFinite(timeout) && timeout > 0 ? timeout : 2200;
        state.mapToastTimer = window.setTimeout(function () {
            hideMapToast();
        }, duration);
    }

    function hideMapToast() {
        if (!elements.mapToast) {
            return;
        }
        if (state.mapToastTimer) {
            window.clearTimeout(state.mapToastTimer);
            state.mapToastTimer = null;
        }
        elements.mapToast.classList.add("hidden");
    }

    function hideMapStatus() {
        if (state.mapStatusTimer) {
            window.clearTimeout(state.mapStatusTimer);
            state.mapStatusTimer = null;
        }
        elements.mapStatus.classList.add("hidden");
    }

    function setFeedback(message) {
        elements.searchFeedback.textContent = message;
    }

    function setRouteFeedback(message, tone) {
        if (!elements.routeFeedback) {
            return;
        }
        const normalizedTone = normalizeInput(tone || "info").toLowerCase();
        const feedbackTone = normalizedTone === "error" || normalizedTone === "success"
            ? normalizedTone
            : "info";
        elements.routeFeedback.textContent = message;
        elements.routeFeedback.classList.remove("route-feedback--info", "route-feedback--success", "route-feedback--error");
        elements.routeFeedback.classList.add("route-feedback--" + feedbackTone);

        if (feedbackTone === "error") {
            setRoutePanelState("failed");
        } else if (feedbackTone === "success") {
            setRoutePanelState("planned");
        } else if (state.routePanelState === "failed") {
            const hasAnyRoutePoint = !!state.routeStartPoi || !!state.routeEndPoi || getAssignedWaypoints().length > 0;
            setRoutePanelState(hasAnyRoutePoint ? "draft" : "empty");
        }
        updateRoutePlanningEmptyState();
    }

    function setRoutePanelState(status) {
        const normalized = normalizeInput(status || "").toLowerCase();
        const validState = normalized === "empty"
            || normalized === "draft"
            || normalized === "failed"
            || normalized === "planned"
            ? normalized
            : "empty";
        state.routePanelState = validState;
        if (elements.routeCard) {
            elements.routeCard.dataset.routeState = validState;
        }
    }

    function resolveRoutePanelState(hasStart, hasEnd, hasWaypoints, hasSummary) {
        if (hasSummary) {
            return "planned";
        }
        if (state.routePanelState === "failed") {
            return "failed";
        }
        if (!hasStart && !hasEnd && !hasWaypoints) {
            return "empty";
        }
        return "draft";
    }

    function requestCurrentLocationOnEntry() {
        ensureCurrentLocationLoaded({
            showLocatingMessage: false,
            centerMap: false,
            successFeedback: "",
            failureFeedback: "",
            alertOnFailure: false
        }).catch(function () {
            showTemporaryMapStatus("Current location is unavailable right now.", 2200);
        });
    }

    function locateCurrentPosition() {
        ensureCurrentLocationLoaded({
            showLocatingMessage: true,
            centerMap: true,
            zoom: 17,
            successFeedback: "Current position located.",
            failureFeedback: "Current position unavailable.",
            alertOnFailure: true
        }).catch(function () {
            // Error feedback is already handled in ensureCurrentLocationLoaded.
        });
    }

    function useCurrentLocationAsRouteStart() {
        const currentPoi = buildCurrentLocationPoi();
        if (currentPoi) {
            applyCurrentLocationAsRouteStart(currentPoi);
            return;
        }

        ensureCurrentLocationLoaded({
            showLocatingMessage: true,
            centerMap: true,
            zoom: 17,
            successFeedback: "Current location found.",
            failureFeedback: "Current location is unavailable right now.",
            alertOnFailure: false
        }).then(function () {
            const poi = buildCurrentLocationPoi();
            if (!poi) {
                setRouteFeedback("Current location is unavailable right now.", "error");
                return;
            }
            applyCurrentLocationAsRouteStart(poi);
        }).catch(function () {
            setRouteFeedback("Current location is unavailable right now.", "error");
        });
    }

    function applyCurrentLocationAsRouteStart(currentPoi) {
        if (!currentPoi) {
            setRouteFeedback("Current location is unavailable right now.", "error");
            return;
        }
        if (isSamePoiOrCoordinate(currentPoi, state.routeStartPoi)) {
            setRouteFeedback("Start point is already current location.", "info");
            return;
        }
        const hasDestinationConflict = isSamePoiOrCoordinate(currentPoi, state.routeEndPoi);
        if (hasDestinationConflict) {
            state.routeEndPoi = null;
        }
        const feedback = hasDestinationConflict
            ? "Start point set to current location. Please choose a destination."
            : "Start point set to current location.";
        setRoutePointFromPoi("start", currentPoi, feedback);
    }

    function ensureCurrentLocationLoaded(options) {
        const opts = options || {};
        if (!state.mapReady || !state.map) {
            const mapNotReadyMessage = "Map is not ready yet.";
            if (opts.alertOnFailure) {
                window.alert(mapNotReadyMessage);
            }
            return Promise.reject(new Error(mapNotReadyMessage));
        }

        if (opts.showLocatingMessage !== false) {
            setFeedback("Locating current position...");
        }

        return locateCurrentPositionByAmap()
            .catch(function () {
                return locateCurrentPositionByBrowser();
            })
            .then(function (position) {
                persistCurrentLocation(position);
                if (opts.centerMap) {
                    state.map.setCenter(position);
                    if (Number.isFinite(Number(opts.zoom))) {
                        state.map.setZoom(Number(opts.zoom));
                    }
                }
                if (normalizeInput(opts.successFeedback)) {
                    setFeedback(opts.successFeedback);
                }
                return state.currentLocation;
            })
            .catch(function (error) {
                const message = error && error.message
                    ? error.message
                    : "Failed to locate current position.";
                if (opts.alertOnFailure) {
                    window.alert(message);
                }
                if (normalizeInput(opts.failureFeedback)) {
                    setFeedback(opts.failureFeedback);
                }
                throw error;
            });
    }

    function persistCurrentLocation(position) {
        renderCurrentLocationMarker(position);
        state.currentLocation = {
            id: "__current_location__",
            name: "Current Position",
            longitude: position[0],
            latitude: position[1],
            type: "current_location",
            description: "Browser/device current location"
        };
    }

    function buildCurrentLocationPoi() {
        if (!state.currentLocation) {
            return null;
        }
        return {
            id: state.currentLocation.id,
            name: state.currentLocation.name,
            type: state.currentLocation.type,
            longitude: state.currentLocation.longitude,
            latitude: state.currentLocation.latitude,
            description: state.currentLocation.description,
            openingHours: "-",
            enabled: true
        };
    }

    function renderCurrentLocationMarker(position) {
        if (!state.map) {
            return;
        }
        if (state.currentLocationMarker) {
            state.map.remove(state.currentLocationMarker);
            state.currentLocationMarker = null;
        }

        state.currentLocationMarker = new AMap.Marker({
            position: position,
            title: "Current Position",
            content: "<div class='current-location-marker'></div>",
            offset: new AMap.Pixel(-8, -8)
        });
        state.map.add(state.currentLocationMarker);
    }

    function locateCurrentPositionByAmap() {
        return new Promise(function (resolve, reject) {
            if (!window.AMap || typeof window.AMap.plugin !== "function") {
                reject(new Error("AMap geolocation unavailable."));
                return;
            }

            window.AMap.plugin("AMap.Geolocation", function () {
                if (!window.AMap || typeof window.AMap.Geolocation !== "function") {
                    reject(new Error("AMap geolocation plugin unavailable."));
                    return;
                }

                const geolocation = new window.AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    convert: true,
                    showMarker: false,
                    showCircle: false,
                    panToLocation: false,
                    zoomToAccuracy: false
                });

                geolocation.getCurrentPosition(function (status, result) {
                    if (status === "complete" && result && result.position) {
                        const lng = Number(result.position.lng);
                        const lat = Number(result.position.lat);
                        if (Number.isFinite(lng) && Number.isFinite(lat)) {
                            resolve([lng, lat]);
                            return;
                        }
                    }
                    const message = result && (result.message || result.info)
                        ? String(result.message || result.info)
                        : "AMap geolocation failed.";
                    reject(new Error(message));
                });
            });
        });
    }

    function locateCurrentPositionByBrowser() {
        return new Promise(function (resolve, reject) {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser."));
                return;
            }

            navigator.geolocation.getCurrentPosition(function (position) {
                const lng = Number(position.coords.longitude);
                const lat = Number(position.coords.latitude);
                if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                    reject(new Error("Failed to parse current location coordinates."));
                    return;
                }

                convertGpsToAmap(lng, lat)
                    .then(resolve)
                    .catch(function () {
                        resolve([lng, lat]);
                    });
            }, function (error) {
                reject(new Error(buildLocationErrorMessage(error)));
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }

    function convertGpsToAmap(lng, lat) {
        return new Promise(function (resolve, reject) {
            if (!window.AMap || typeof window.AMap.convertFrom !== "function") {
                reject(new Error("Coordinate conversion unavailable."));
                return;
            }
            window.AMap.convertFrom([lng, lat], "gps", function (status, result) {
                if (status === "complete"
                    && result
                    && Array.isArray(result.locations)
                    && result.locations.length > 0) {
                    const point = result.locations[0];
                    const convertedLng = Number(point.lng);
                    const convertedLat = Number(point.lat);
                    if (Number.isFinite(convertedLng) && Number.isFinite(convertedLat)) {
                        resolve([convertedLng, convertedLat]);
                        return;
                    }
                }
                reject(new Error("Coordinate conversion failed."));
            });
        });
    }

    function buildLocationErrorMessage(error) {
        if (!error || typeof error.code !== "number") {
            return "Failed to locate current position.";
        }
        if (error.code === 1) {
            return "Location permission denied.";
        }
        if (error.code === 2) {
            return "Location unavailable.";
        }
        if (error.code === 3) {
            return "Location request timed out.";
        }
        return "Failed to locate current position.";
    }

    function normalizeRouteMode(mode) {
        return mode === "cycling" ? "cycling" : "walking";
    }

    function normalizeUiMode(mode) {
        const value = normalizeInput(mode || "").toLowerCase();
        const allModes = Object.values(DRAWER_MODES);
        return allModes.includes(value) ? value : DRAWER_MODES.SEARCH_HOME;
    }

    function isSearchFlowMode(mode) {
        return mode === DRAWER_MODES.SEARCH_HOME
            || mode === DRAWER_MODES.SEARCH_RESULTS
            || mode === DRAWER_MODES.POI_DETAIL
            || mode === DRAWER_MODES.ROUTE_PLANNING;
    }

    function setUiMode(mode, options) {
        const normalized = normalizeUiMode(mode);
        const opts = options || {};
        const force = opts.force === true;
        const resetBackStack = opts.resetBackStack === true;
        const pushSearchFlow = opts.pushSearchFlow === true;

        hideMapRoutePointMenu(true);
        if (elements.historyCleanModal && !elements.historyCleanModal.hidden) {
            closeHistoryCleanModal();
        }

        if (resetBackStack) {
            state.uiBackStack = [];
        }

        if (!force && state.uiMode === normalized) {
            setActiveRailItemByMode(normalized);
            applyDrawerModeVisibility();
            updateDrawerHeader();
            return;
        }

        if (pushSearchFlow
            && state.uiMode !== normalized
            && isSearchFlowMode(state.uiMode)
            && isSearchFlowMode(normalized)) {
            state.uiBackStack.push(state.uiMode);
            if (state.uiBackStack.length > 20) {
                state.uiBackStack.shift();
            }
        }

        state.uiMode = normalized;
        if (normalized !== DRAWER_MODES.SEARCH_HOME) {
            state.searchInputFocused = false;
            setSearchSuggestionPanelVisible(false);
        }
        if (elements.leftPanel) {
            elements.leftPanel.dataset.uiMode = normalized;
        }
        setActiveRailItemByMode(normalized);
        applyDrawerModeVisibility();
        updateDrawerHeader();
    }

    function setActiveRailItemByMode(mode) {
        if (!elements.railItems || elements.railItems.length === 0) {
            return;
        }

        const railMode = (mode === DRAWER_MODES.SAVED
            || mode === DRAWER_MODES.RECENTS
            || mode === DRAWER_MODES.WEATHER)
            ? mode
            : "search";

        elements.railItems.forEach(function (button) {
            const buttonMode = normalizeInput(button.dataset.railMode).toLowerCase();
            const active = buttonMode === railMode;
            button.classList.toggle("active", active);
            if (active) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });
    }

    function goBackDrawerMode() {
        if (state.uiBackStack.length > 0) {
            const prev = state.uiBackStack.pop();
            setUiMode(prev, {force: true});
            return;
        }
        setUiMode(DRAWER_MODES.SEARCH_HOME, {force: true, resetBackStack: true});
    }

    function updateDrawerHeader() {
        if (elements.drawerTitle) {
            elements.drawerTitle.textContent = DRAWER_TITLES[state.uiMode] || "Search";
        }
        if (elements.drawerSubtitle) {
            elements.drawerSubtitle.textContent = DRAWER_SUBTITLES[state.uiMode] || "";
        }
        if (!elements.drawerBackBtn) {
            return;
        }
        const showBack = state.uiMode === DRAWER_MODES.SEARCH_RESULTS
            || state.uiMode === DRAWER_MODES.POI_DETAIL
            || state.uiMode === DRAWER_MODES.ROUTE_PLANNING;
        elements.drawerBackBtn.hidden = !showBack;
    }

    function applyDrawerModeVisibility() {
        if (elements.leftPanel) {
            elements.leftPanel.classList.remove("search-submitted");
            elements.leftPanel.classList.remove("history-route-only");
        }

        setCardVisible(elements.searchCard, false);
        setCardVisible(elements.resultsCard, false);
        setCardVisible(elements.detailCard, false);
        setCardVisible(elements.routeCard, false);
        setCardVisible(elements.savedCard, false);
        setCardVisible(elements.historyPanel, false);
        setCardVisible(elements.weatherCard, false);
        setCardVisible(elements.suggestionCard, false);

        switch (state.uiMode) {
            case DRAWER_MODES.SEARCH_RESULTS:
                setCardVisible(elements.resultsCard, true);
                break;
            case DRAWER_MODES.POI_DETAIL:
                setCardVisible(elements.detailCard, true);
                break;
            case DRAWER_MODES.ROUTE_PLANNING:
                setCardVisible(elements.routeCard, true);
                break;
            case DRAWER_MODES.SAVED:
                setCardVisible(elements.savedCard, true);
                renderSavedView();
                break;
            case DRAWER_MODES.RECENTS:
                setCardVisible(elements.historyPanel, true);
                break;
            case DRAWER_MODES.WEATHER:
                setCardVisible(elements.weatherCard, true);
                break;
            case DRAWER_MODES.SEARCH_HOME:
            default:
                setCardVisible(elements.searchCard, true);
                setCardVisible(elements.suggestionCard, false);
                break;
        }

        // Safety guard: Results must never leak into non-search flow modes.
        const allowResults = state.uiMode === DRAWER_MODES.SEARCH_RESULTS;
        if (!allowResults) {
            setCardVisible(elements.resultsCard, false);
        }
        updateRoutePlanningEmptyState();
        syncSearchHomeOverlayLayout();
    }

    function syncSearchHomeOverlayLayout() {
        const isSearchHome = state.uiMode === DRAWER_MODES.SEARCH_HOME;
        const overlayExpanded = isSearchHome && (state.searchInputFocused || isSearchSuggestionPanelVisible());

        if (elements.mainLayout) {
            elements.mainLayout.classList.toggle("search-home-overlay", isSearchHome);
            elements.mainLayout.classList.toggle("search-home-open", overlayExpanded);
        }

        if (elements.searchCard) {
            elements.searchCard.classList.toggle("search-input-active", overlayExpanded);
        }

        if (state.searchHomeOverlayActive !== isSearchHome) {
            state.searchHomeOverlayActive = isSearchHome;
            if (state.mapReady && state.map && typeof state.map.resize === "function") {
                window.requestAnimationFrame(function () {
                    state.map.resize();
                });
            }
        }
    }

    function applySearchModeVisibility() {
        // Compatibility shim kept for existing call sites.
        applyDrawerModeVisibility();
    }

    function setCardVisible(element, visible) {
        if (!element) {
            return;
        }
        const shouldShow = visible === true;
        element.hidden = !shouldShow;
        element.classList.toggle("card-hidden", !shouldShow);
    }

    function capitalizeRouteMode(mode) {
        const normalized = normalizeRouteMode(mode);
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    init();
})();
