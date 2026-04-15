(function () {
    const NUIST_CAMPUS_CENTER = [118.715422, 32.194426];
    const WEATHER_REFRESH_INTERVAL_MS = 60 * 1000;
    const MAX_ROUTE_WAYPOINTS = 3;
    const CLASS_PERIOD_STARTS = [
        { period: 1, minuteOfDay: 8 * 60 },
        { period: 2, minuteOfDay: 10 * 60 + 10 },
        { period: 3, minuteOfDay: 13 * 60 + 45 },
        { period: 4, minuteOfDay: 15 * 60 + 55 },
        { period: 5, minuteOfDay: 18 * 60 + 45 },
        { period: 6, minuteOfDay: 20 * 60 + 35 }
    ];
    const CLASS_PEAK_LEAD_MINUTES = 20;

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
        activeCategory: "",
        routeHistories: [],
        historyKeyword: "",
        historyPanelOpen: false,
        historyRouteMode: false,
        pendingMapClickPoi: null,
        weatherRefreshTimer: null,
        weatherLoading: false
    };

    const elements = {
        searchForm: document.getElementById("poi-search-form"),
        leftPanel: document.getElementById("left-panel"),
        resetBtn: document.getElementById("reset-btn"),
        searchName: document.getElementById("search-name"),
        searchType: document.getElementById("search-type"),
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
        detailCoordinates: document.getElementById("detail-coordinates"),
        setStartBtn: document.getElementById("set-start-btn"),
        setEndBtn: document.getElementById("set-end-btn"),
        setViaBtn: document.getElementById("set-via-btn"),
        locateCurrentBtn: document.getElementById("locate-current-btn"),
        routeStartName: document.getElementById("route-start-name"),
        routeEndName: document.getElementById("route-end-name"),
        routeWaypointList: document.getElementById("route-waypoint-list"),
        addWaypointBtn: document.getElementById("add-waypoint-btn"),
        routeMode: document.getElementById("route-mode"),
        planRouteBtn: document.getElementById("plan-route-btn"),
        clearRouteBtn: document.getElementById("clear-route-btn"),
        routeFeedback: document.getElementById("route-feedback"),
        routeAlternativeWrap: document.getElementById("route-alternative-wrap"),
        routeAlternativeList: document.getElementById("route-alternative-list"),
        routeSummary: document.getElementById("route-summary"),
        routeDistance: document.getElementById("route-distance"),
        routeDuration: document.getElementById("route-duration"),
        routeSteps: document.getElementById("route-steps"),
        weatherStatus: document.getElementById("weather-status"),
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
        mapCategoryQuickPanel: document.getElementById("map-category-quick-panel"),
        mapCategoryButtons: Array.from(document.querySelectorAll(".map-category-btn")),
        historyCount: document.getElementById("history-count"),
        historyToggleBtn: document.getElementById("history-toggle-btn"),
        historyStatus: document.getElementById("history-status"),
        historyPanel: document.getElementById("history-panel"),
        historySearchInput: document.getElementById("history-search-input"),
        historySearchBtn: document.getElementById("history-search-btn"),
        historyResetBtn: document.getElementById("history-reset-btn"),
        historyList: document.getElementById("history-list"),
        historyEmpty: document.getElementById("history-empty"),
        suggestionTitle: document.getElementById("suggestion-title"),
        suggestionList: document.getElementById("suggestion-list"),
        suggestionStatus: document.getElementById("suggestion-status"),
        classPeakStatus: document.getElementById("class-peak-status"),
        mapStatus: document.getElementById("map-status")
    };

    async function init() {
        bindEvents();
        setSearchCardsVisible(false);
        setActiveCategoryButton("");
        await loadPoiTypes();
        renderRouteSelection();
        loadWeatherSummary();
        startWeatherAutoRefresh();
        updateClassPeakStatus();
        await loadRouteHistoryList("");
        loadContextSuggestions({
            sceneType: "home"
        });
        initMap();
    }

    function bindEvents() {
        elements.searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            runSearch();
        });

        elements.resetBtn.addEventListener("click", function () {
            elements.searchName.value = "";
            elements.searchType.value = "";
            state.activeCategory = "";
            setActiveCategoryButton("");
            state.selectedPoi = null;
            state.selectedPoiId = null;
            state.pois = [];
            renderResultList();
            clearDetail(false);
            setHistoryRouteMode(false);
            setSearchCardsVisible(false);
            clearRouteAll(true);
            setFeedback("Ready.");
        });

        elements.resultList.addEventListener("click", function (event) {
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

        elements.locateCurrentBtn.addEventListener("click", function () {
            locateCurrentPosition();
        });

        elements.planRouteBtn.addEventListener("click", function () {
            planWalkingRoute();
        });

        if (elements.routeMode) {
            elements.routeMode.addEventListener("change", function () {
                state.routeMode = normalizeRouteMode(elements.routeMode.value);
                setRouteFeedback(capitalizeRouteMode(state.routeMode) + " mode selected.");
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

        if (elements.historyToggleBtn) {
            elements.historyToggleBtn.addEventListener("click", function () {
                toggleHistoryPanel();
            });
        }

        if (elements.historySearchBtn) {
            elements.historySearchBtn.addEventListener("click", function () {
                runHistorySearch();
            });
        }

        if (elements.historyResetBtn) {
            elements.historyResetBtn.addEventListener("click", function () {
                if (elements.historySearchInput) {
                    elements.historySearchInput.value = "";
                }
                runHistorySearch();
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

        document.addEventListener("mousedown", function (event) {
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
            }
        });
    }

    async function runSearch() {
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

            renderResultList();
            clearDetail(false);
            setSearchCardsVisible(true);
            setFeedback("Loaded " + state.pois.length + " POI(s).");

            if (state.pois.length === 0) {
                clearRouteAll(true);
                return;
            }
        } catch (error) {
            resetPageStateAfterSearchError();
            setSearchCardsVisible(false);
            setFeedback(error.message || "Search failed.");
        }
    }

    async function runCategoryQuickSearch(category) {
        if (!category) {
            return;
        }

        if (state.activeCategory === category) {
            state.activeCategory = "";
            setActiveCategoryButton("");
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
            renderResultList();
            clearDetail(false);
            setSearchCardsVisible(true);
            setFeedback("Loaded " + state.pois.length + " POI(s) from " + category + ".");
        } catch (error) {
            setFeedback(error.message || "Failed to load category POIs.");
        }
    }

    function clearSearchCardsForCategoryReset() {
        state.pois = [];
        state.selectedPoi = null;
        state.selectedPoiId = null;
        renderResultList();
        clearDetail(false);

        if (elements.leftPanel) {
            elements.leftPanel.classList.add("search-submitted");
        }
        if (elements.resultsCard) {
            elements.resultsCard.hidden = true;
            elements.resultsCard.classList.add("card-hidden");
        }
        if (elements.detailCard) {
            elements.detailCard.hidden = true;
            elements.detailCard.classList.add("card-hidden");
        }
        if (elements.routeCard) {
            elements.routeCard.hidden = false;
            elements.routeCard.classList.remove("card-hidden");
        }
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
            setFeedback(error.message || "Failed to load POI types.");
        }
    }

    async function selectPoi(id, options) {
        const refreshSuggestion = !options || options.refreshSuggestion !== false;
        try {
            const poi = await fetchApi("/api/v1/pois/" + id);
            state.selectedPoiId = poi.id;
            state.selectedPoi = poi;
            renderResultList();
            renderDetail(poi);
            updateMapMarker(poi);
            if (refreshSuggestion) {
                loadContextSuggestions({
                    sceneType: "poi_detail",
                    poiId: poi.id
                });
            }
        } catch (error) {
            setFeedback(error.message || "Failed to load POI details.");
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
            item.innerHTML =
                "<div class=\"result-main\">" +
                "<span class=\"result-name\">" + escapeHtml(poi.name || "Unnamed POI") + "</span>" +
                "<span class=\"result-type-tag\">" + escapeHtml(poi.type || "-") + "</span>" +
                "</div>" +
                "<div class=\"result-meta-row\">" +
                "<span class=\"result-meta\">POI</span>" +
                "</div>";
            elements.resultList.appendChild(item);
        });
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

        const lng = normalizeCoordinate(poi.longitude);
        const lat = normalizeCoordinate(poi.latitude);
        if (lng !== null && lat !== null) {
            elements.detailCoordinates.textContent = lng + ", " + lat;
        } else {
            elements.detailCoordinates.textContent = "-";
        }
    }

    function clearDetail(keepSelection) {
        const keep = keepSelection === true;
        elements.detailEmpty.classList.remove("hidden");
        elements.detailContent.classList.add("hidden");
        elements.detailEnabled.className = "status-pill";
        state.selectedPoi = null;
        if (!keep) {
            state.selectedPoiId = null;
            clearMapMarker();
            renderResultList();
        }
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
                zoom: 16,
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
        const shouldShow = visible === true;
        if (elements.leftPanel) {
            elements.leftPanel.classList.toggle("search-submitted", shouldShow);
        }
        if (elements.resultsCard) {
            elements.resultsCard.hidden = !shouldShow;
            elements.resultsCard.classList.toggle("card-hidden", !shouldShow);
        }
        if (elements.detailCard) {
            elements.detailCard.hidden = !shouldShow;
            elements.detailCard.classList.toggle("card-hidden", !shouldShow);
        }
        if (elements.routeCard) {
            elements.routeCard.hidden = !shouldShow;
            elements.routeCard.classList.toggle("card-hidden", !shouldShow);
        }
        applyHistoryRouteVisibility();
    }

    function setHistoryRouteMode(enabled) {
        const shouldEnable = enabled === true;
        state.historyRouteMode = shouldEnable;
        if (elements.leftPanel) {
            elements.leftPanel.classList.toggle("history-route-only", shouldEnable);
        }
        applyHistoryRouteVisibility();
    }

    function applyHistoryRouteVisibility() {
        if (!state.historyRouteMode) {
            return;
        }
        if (elements.resultsCard) {
            elements.resultsCard.hidden = true;
            elements.resultsCard.classList.add("card-hidden");
        }
        if (elements.detailCard) {
            elements.detailCard.hidden = true;
            elements.detailCard.classList.add("card-hidden");
        }
        if (elements.routeCard) {
            elements.routeCard.hidden = false;
            elements.routeCard.classList.remove("card-hidden");
        }
    }

    function toggleHistoryPanel() {
        setHistoryPanelOpen(!state.historyPanelOpen);
    }

    function setHistoryPanelOpen(open) {
        const shouldOpen = open === true;
        state.historyPanelOpen = shouldOpen;
        if (elements.historyPanel) {
            elements.historyPanel.hidden = !shouldOpen;
        }
        if (elements.historyToggleBtn) {
            elements.historyToggleBtn.textContent = shouldOpen ? "Close History Menu" : "Open History Menu";
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

        clearRouteDrawing();
        state.routeStartPoi = startPoi;
        state.routeEndPoi = endPoi;
        state.routeViaPois = [];
        state.routeMode = normalizeRouteMode(record.mode);
        if (elements.routeMode) {
            elements.routeMode.value = state.routeMode;
        }

        setSearchCardsVisible(true);
        setHistoryRouteMode(true);

        renderRouteSelection();
        renderRouteEndpointMarkers();
        fitRouteView();
        setRouteFeedback("History loaded. Click Start Route Planning.");
        setHistoryStatus("History applied.");
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

    async function loadWeatherSummary() {
        if (state.weatherLoading) {
            return;
        }
        state.weatherLoading = true;
        elements.weatherStatus.textContent = "Loading weather...";
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
    function assignRoutePoint(type) {
        if (type === "start" && state.currentLocation) {
            const currentPoi = buildCurrentLocationPoi();
            setRoutePointFromPoi(type, currentPoi, "Start point set to current location.");
            return;
        }

        if (!state.selectedPoi) {
            window.alert("\u8bf7\u5148\u9009\u62e9\u5730\u70b9");
            return;
        }

        setRoutePointFromPoi(type, state.selectedPoi, "Route point updated.");
    }

    function setRoutePointFromPoi(type, poi, feedbackMessage) {
        if (!poi) {
            window.alert("\u8bf7\u5148\u9009\u62e9\u5730\u70b9");
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
                window.alert("\u9014\u7ecf\u70b9\u4e0d\u80fd\u4e0e\u8d77\u70b9\u6216\u7ec8\u70b9\u76f8\u540c");
                return false;
            }
            if (state.routeViaPois.some(function (item) { return item && isSamePoiOrCoordinate(item, poi); })) {
                window.alert("\u8be5\u5730\u70b9\u5df2\u6dfb\u52a0\u4e3a\u9014\u7ecf\u70b9");
                return false;
            }
            const firstEmptyIndex = findFirstEmptyWaypointIndex();
            if (firstEmptyIndex >= 0) {
                state.routeViaPois[firstEmptyIndex] = poi;
            } else {
                if (state.routeViaPois.length >= MAX_ROUTE_WAYPOINTS) {
                    window.alert("\u9014\u7ecf\u70b9\u8fc7\u591a");
                    return false;
                }
                state.routeViaPois.push(poi);
            }
        } else {
            return false;
        }

        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback(feedbackMessage || "Route point updated.");
        tryAutoReplanRoute();
        return true;
    }

    function addEmptyWaypointSlot() {
        ensureRoutePlanningCardVisible();
        if (state.routeViaPois.length >= MAX_ROUTE_WAYPOINTS) {
            window.alert("\u9014\u7ecf\u70b9\u8fc7\u591a");
            return;
        }
        state.routeViaPois.push(null);
        renderRouteSelection();
        setRouteFeedback("Waypoint slot added.");
    }

    function removeWaypointSlot(index) {
        ensureRoutePlanningCardVisible();
        if (!Number.isInteger(index) || index < 0 || index >= state.routeViaPois.length) {
            return;
        }
        state.routeViaPois.splice(index, 1);
        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback("Waypoint removed.");
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

    function ensureRoutePlanningCardVisible() {
        state.historyRouteMode = false;
        if (elements.leftPanel) {
            elements.leftPanel.classList.remove("history-route-only");
        }
        setSearchCardsVisible(true);

        if (elements.leftPanel) {
            elements.leftPanel.classList.add("search-submitted");
        }
        if (elements.resultsCard) {
            elements.resultsCard.hidden = true;
            elements.resultsCard.classList.add("card-hidden");
        }
        if (elements.detailCard) {
            elements.detailCard.hidden = true;
            elements.detailCard.classList.add("card-hidden");
        }
        if (elements.routeCard) {
            elements.routeCard.hidden = false;
            elements.routeCard.classList.remove("card-hidden");
            if (typeof elements.routeCard.scrollIntoView === "function") {
                elements.routeCard.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth"
                });
            }
        }
    }

    async function planWalkingRoute() {
        if (!state.routeStartPoi || !state.routeEndPoi) {
            setRouteFeedback("Please set both start and destination.");
            return;
        }
        state.routeMode = normalizeRouteMode(elements.routeMode ? elements.routeMode.value : state.routeMode);
        clearRouteDrawing();

        const startPosition = getPoiPosition(state.routeStartPoi);
        const endPosition = getPoiPosition(state.routeEndPoi);
        if (!startPosition || !endPosition) {
            setRouteFeedback("Start or destination has invalid coordinates.");
            return;
        }
        const viaPois = getAssignedWaypoints();
        const viaPositions = [];
        for (let i = 0; i < viaPois.length; i += 1) {
            const viaPoi = viaPois[i];
            const viaPosition = getPoiPosition(viaPoi);
            if (!viaPosition) {
                setRouteFeedback("Waypoint has invalid coordinates.");
                return;
            }
            viaPositions.push(viaPosition);
        }

        if (state.routeStartPoi.id === state.routeEndPoi.id) {
            setRouteFeedback("Please choose two different POIs.");
            return;
        }

        const params = new URLSearchParams();
        params.set("originLng", String(startPosition[0]));
        params.set("originLat", String(startPosition[1]));
        params.set("destinationLng", String(endPosition[0]));
        params.set("destinationLat", String(endPosition[1]));
        viaPositions.forEach(function (viaPosition) {
            params.append("viaLng", String(viaPosition[0]));
            params.append("viaLat", String(viaPosition[1]));
        });
        const routeEndpoint = state.routeMode === "cycling"
            ? "/api/v1/routes/cycling"
            : "/api/v1/routes/walking";

        try {
            setRouteFeedback("Planning " + state.routeMode + " route...");
            const routeData = await fetchApi(routeEndpoint + "?" + params.toString());
            const alternatives = normalizeRouteAlternatives(routeData);
            if (alternatives.length === 0) {
                setRouteFeedback("No " + state.routeMode + " route alternatives returned.");
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
            fitRouteView();
            let routeMessage = capitalizeRouteMode(state.routeMode) + " route planned.";
            try {
                await saveCurrentRouteHistory(selectedRoute);
                await loadRouteHistoryList(state.historyKeyword);
            } catch (historyError) {
                routeMessage += " Route save failed, route remains available.";
            }
            setRouteFeedback(routeMessage);
            loadContextSuggestions({
                sceneType: "route_planning",
                poiId: state.routeEndPoi ? state.routeEndPoi.id : null,
                routeDistance: selectedRoute.distance,
                routeDuration: selectedRoute.duration
            });
        } catch (error) {
            setRouteFeedback(error.message || (capitalizeRouteMode(state.routeMode) + " route planning failed."));
            refreshSuggestionsAfterRouteClear();
        }
    }

    function clearRouteAll(silent) {
        const isSilent = silent === true;
        clearRouteDrawing();
        clearRouteEndpointMarkers();
        state.routeStartPoi = null;
        state.routeEndPoi = null;
        state.routeViaPois = [];
        state.routeAlternatives = [];
        state.selectedRouteAlternativeIndex = 0;
        renderRouteSelection();
        if (!isSilent) {
            setRouteFeedback("Route cleared.");
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
        if (elements.routeStartName) {
            elements.routeStartName.value = state.routeStartPoi ? state.routeStartPoi.name : "Not selected";
        }
        if (elements.routeEndName) {
            elements.routeEndName.value = state.routeEndPoi ? state.routeEndPoi.name : "Not selected";
        }
        renderWaypointRows();
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
                ? "Max 3 waypoints"
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
            btn.textContent = "Route " + (index + 1);
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
        setRouteFeedback("Switched to route " + (index + 1) + ".");
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
                throw new Error("Request failed with status " + response.status);
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
            return error.message.trim();
        }
        return fallback || "Request failed";
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
        elements.mapStatus.textContent = message;
        elements.mapStatus.classList.remove("hidden");
    }

    function hideMapStatus() {
        elements.mapStatus.classList.add("hidden");
    }

    function setFeedback(message) {
        elements.searchFeedback.textContent = message;
    }

    function setRouteFeedback(message) {
        elements.routeFeedback.textContent = message;
    }

    function locateCurrentPosition() {
        if (!state.mapReady || !state.map) {
            window.alert("Map is not ready yet.");
            return;
        }
        setFeedback("Locating current position...");

        locateCurrentPositionByAmap()
            .catch(function () {
                // Fallback: browser geolocation + coordinate conversion.
                return locateCurrentPositionByBrowser();
            })
            .then(function (position) {
                renderCurrentLocationMarker(position);
                state.currentLocation = {
                    id: "__current_location__",
                    name: "Current Position",
                    longitude: position[0],
                    latitude: position[1],
                    type: "current_location",
                    description: "Browser/device current location"
                };
                state.map.setCenter(position);
                state.map.setZoom(17);
                setFeedback("Current position located.");
            })
            .catch(function (error) {
                const message = error && error.message
                    ? error.message
                    : "Failed to locate current position.";
                window.alert(message);
                setFeedback("Current position unavailable.");
            });
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
