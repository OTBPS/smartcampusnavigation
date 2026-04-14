(function () {
    const NUIST_CAMPUS_CENTER = [118.715422, 32.194426];
    const WEATHER_REFRESH_INTERVAL_MS = 60 * 1000;
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
        infoWindow: null,
        mapReady: false,
        routeStartPoi: null,
        routeEndPoi: null,
        routeStartMarker: null,
        routeEndMarker: null,
        routeLine: null,
        weatherRefreshTimer: null,
        weatherLoading: false
    };

    const elements = {
        searchForm: document.getElementById("poi-search-form"),
        resetBtn: document.getElementById("reset-btn"),
        searchName: document.getElementById("search-name"),
        searchType: document.getElementById("search-type"),
        searchFeedback: document.getElementById("search-feedback"),
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
        routeStartName: document.getElementById("route-start-name"),
        routeEndName: document.getElementById("route-end-name"),
        planRouteBtn: document.getElementById("plan-route-btn"),
        clearRouteBtn: document.getElementById("clear-route-btn"),
        routeFeedback: document.getElementById("route-feedback"),
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
        suggestionTitle: document.getElementById("suggestion-title"),
        suggestionList: document.getElementById("suggestion-list"),
        suggestionStatus: document.getElementById("suggestion-status"),
        classPeakStatus: document.getElementById("class-peak-status"),
        mapStatus: document.getElementById("map-status")
    };

    async function init() {
        bindEvents();
        await loadPoiTypes();
        renderRouteSelection();
        loadWeatherSummary();
        startWeatherAutoRefresh();
        updateClassPeakStatus();
        loadContextSuggestions({
            sceneType: "home"
        });
        initMap();
        await runSearch();
    }

    function bindEvents() {
        elements.searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            runSearch();
        });

        elements.resetBtn.addEventListener("click", function () {
            elements.searchName.value = "";
            elements.searchType.value = "";
            runSearch();
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

        elements.planRouteBtn.addEventListener("click", function () {
            planWalkingRoute();
        });

        elements.clearRouteBtn.addEventListener("click", function () {
            clearRouteAll(false);
        });
    }

    async function runSearch() {
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

            renderResultList();
            setFeedback("Loaded " + state.pois.length + " POI(s).");

            if (state.pois.length === 0) {
                clearDetail(false);
                clearRouteAll(true);
                return;
            }

            const retained = state.pois.find(function (poi) {
                return poi.id === state.selectedPoiId;
            });
            const targetId = retained ? retained.id : state.pois[0].id;
            await selectPoi(targetId, {
                refreshSuggestion: false
            });
        } catch (error) {
            resetPageStateAfterSearchError();
            setFeedback(error.message || "Search failed.");
        }
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
    }

    function renderWeatherFallback(message) {
        elements.weatherText.textContent = "-";
        elements.weatherTemp.textContent = "-";
        elements.weatherFeelsLike.textContent = "-";
        elements.weatherHumidity.textContent = "-";
        elements.weatherWind.textContent = "-";
        elements.weatherUpdated.textContent = "-";
        elements.weatherStatus.textContent = message || "Weather unavailable.";
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
        if (!state.selectedPoi) {
            setRouteFeedback("Please select a POI first.");
            return;
        }

        if (type === "start") {
            state.routeStartPoi = state.selectedPoi;
        } else {
            state.routeEndPoi = state.selectedPoi;
        }

        renderRouteSelection();
        renderRouteEndpointMarkers();
        setRouteFeedback("Route point updated.");
    }

    async function planWalkingRoute() {
        if (!state.routeStartPoi || !state.routeEndPoi) {
            setRouteFeedback("Please set both start and destination.");
            return;
        }
        clearRouteDrawing();

        const startPosition = getPoiPosition(state.routeStartPoi);
        const endPosition = getPoiPosition(state.routeEndPoi);
        if (!startPosition || !endPosition) {
            setRouteFeedback("Start or destination has invalid coordinates.");
            return;
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

        try {
            setRouteFeedback("Planning walking route...");
            const routeData = await fetchApi("/api/v1/routes/walking?" + params.toString());
            const polyline = normalizeRoutePolyline(routeData.routePolyline);
            if (polyline.length === 0) {
                setRouteFeedback("No route polyline returned.");
                refreshSuggestionsAfterRouteClear();
                return;
            }

            drawRoutePolyline(polyline);
            renderRouteEndpointMarkers();
            renderRouteSummary(routeData);
            fitRouteView();
            setRouteFeedback("Walking route planned.");
            loadContextSuggestions({
                sceneType: "route_planning",
                poiId: state.routeEndPoi ? state.routeEndPoi.id : null,
                routeDistance: routeData.distance,
                routeDuration: routeData.duration
            });
        } catch (error) {
            setRouteFeedback(error.message || "Walking route planning failed.");
            refreshSuggestionsAfterRouteClear();
        }
    }

    function clearRouteAll(silent) {
        const isSilent = silent === true;
        clearRouteDrawing();
        clearRouteEndpointMarkers();
        state.routeStartPoi = null;
        state.routeEndPoi = null;
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

    function drawRoutePolyline(path) {
        if (!state.mapReady || !state.map) {
            return;
        }

        state.routeLine = new AMap.Polyline({
            path: path,
            strokeColor: "#1a73e8",
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
    }

    function createEndpointMarker(position, type, title) {
        return new AMap.Marker({
            position: position,
            title: title,
            content: "<div class='endpoint-marker " + type + "'>" + (type === "start" ? "S" : "E") + "</div>",
            offset: new AMap.Pixel(-12, -12)
        });
    }

    function renderRouteSelection() {
        elements.routeStartName.textContent = state.routeStartPoi ? state.routeStartPoi.name : "Not selected";
        elements.routeEndName.textContent = state.routeEndPoi ? state.routeEndPoi.name : "Not selected";
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

    async function fetchApi(url) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(function () {
            controller.abort();
        }, 8000);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("Request failed with status " + response.status);
            }

            const body = await response.json();
            if (!body || typeof body.code !== "number") {
                throw new Error("Invalid API response.");
            }
            if (body.code !== 0) {
                throw new Error(body.message || "Request failed.");
            }
            return body.data;
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
