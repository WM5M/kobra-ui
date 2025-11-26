
let currentIndex = 0;
let elementsCache = [];
let categoriesCache = [];
let currentCategoryIndex = 0;

function getResourceName() {
    try {
        // eslint-disable-next-line no-undef
        return GetParentResourceName();
    } catch (e) {
        return "kobra";
    }
}

window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || !data.action) return;

    if (data.action === "showUI") {
        toggleUI(!!data.visible);
        updateHeader(data.header || "KOBRA MENU");
        updateBreadcrumb(data.path || []);
        updateCategories(data.categories || [], data.categoryIndex || 0);
        elementsCache = data.elements || [];
        currentIndex = data.index || 0;
        updateElements(elementsCache, currentIndex);
        highlightIndex(currentIndex);
        return;
    }

    if (data.action === "updateElements") {
        updateHeader(data.header || "KOBRA MENU");
        updateBreadcrumb(data.path || []);
        updateCategories(data.categories || [], data.categoryIndex || 0);
        elementsCache = data.elements || [];
        currentIndex = data.index || 0;
        updateElements(elementsCache, currentIndex);
        highlightIndex(currentIndex);
        return;
    }

    if (data.action === "showNotification") {
        showNotification(data.type, data.title, data.desc, data.duration);
        return;
    }
});

function toggleUI(visible) {
    const cont = document.getElementById("menu-container");
    if (!cont) return;
    if (visible) cont.classList.remove("hidden");
    else cont.classList.add("hidden");
}

function updateHeader(txt) {
    const logo = document.getElementById("logo-text");
    if (logo) logo.textContent = txt || "KOBRA MENU";
}

function updateBreadcrumb(path) {
    const bc = document.getElementById("breadcrumb");
    if (!bc) return;
    if (!path || !Array.isArray(path) || path.length === 0) {
        bc.textContent = "";
        return;
    }
    bc.textContent = path.join(" > ");
}

function updateCategories(categories, index) {
    const container = document.getElementById("categories");
    categoriesCache = categories || [];
    currentCategoryIndex = index || 0;
    container.innerHTML = "";

    if (!categoriesCache || categoriesCache.length === 0) return;

    categoriesCache.forEach((cat, i) => {
        const pill = document.createElement("div");
        pill.className = "category-pill" + (i === currentCategoryIndex ? " active" : "");
        pill.textContent = cat.label || ("Cat " + (i + 1));
        pill.addEventListener("click", () => {
            const payload = { index: i };
            fetch(`https://${getResourceName()}/category`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
        });
        container.appendChild(pill);
    });
}

function updateElements(elements, hoveredIndex) {
    const content = document.getElementById("elements");
    if (!content) return;
    content.innerHTML = "";

    elementsCache = elements || [];
    currentIndex = hoveredIndex || 0;

    elementsCache.forEach((el, i) => {
        const isLabel = el.type === "label";
        const isSecondary = el.type === "hint" || el.type === "description";

        const div = document.createElement("div");
        div.className = "element" +
            (i === currentIndex ? " selected" : "") +
            (isSecondary ? " secondary" : "") +
            (isLabel ? " element-label" : "");

        const left = document.createElement("div");
        left.className = "element-left";

        if (el.tag) {
            const tag = document.createElement("span");
            tag.className = "element-tag";
            tag.textContent = el.tag;
            left.appendChild(tag);
        }

        const labelSpan = document.createElement("span");
        labelSpan.textContent = el.label || ("Item " + (i + 1));
        left.appendChild(labelSpan);

        if (el.meta) {
            const meta = document.createElement("span");
            meta.className = "element-meta";
            meta.textContent = el.meta;
            left.appendChild(meta);
        }

        div.appendChild(left);

        const right = document.createElement("div");

        if (el.type === "checkbox" || el.type === "slider-checkbox" || el.type === "scrollable-checkbox") {
            const badge = document.createElement("span");
            badge.className = "checkbox-badge " + (el.checked ? "checkbox-on" : "checkbox-off");
            badge.textContent = el.checked ? "ON" : "OFF";
            right.appendChild(badge);
        }

        if (el.type === "slider" || el.type === "slider-checkbox") {
            const slider = document.createElement("span");
            slider.className = "slider-chip";
            slider.textContent = (el.value !== undefined && el.value !== null)
                ? String(el.value)
                : "";
            right.appendChild(slider);
        }

        if (el.type === "input") {
            const val = document.createElement("span");
            val.className = "element-value";
            val.textContent = el.value ? String(el.value) : "";
            right.appendChild(val);
        }

        if (right.childNodes.length > 0) {
            div.appendChild(right);
        }

        if (!isLabel && !isSecondary) {
            div.addEventListener("click", () => {
                const index = i;
                currentIndex = index;
                highlightIndex(index);
                fetch(`https://${getResourceName()}/enter`, {
                    method: "POST",
                    body: JSON.stringify({ index })
                });
            });
        }

        content.appendChild(div);
    });
}

function highlightIndex(index) {
    const content = document.getElementById("elements");
    if (!content) return;
    const children = Array.from(content.children);
    children.forEach((child, i) => {
        if (i === index) child.classList.add("selected");
        else child.classList.remove("selected");
    });
}

document.addEventListener("keydown", (ev) => {
    const key = ev.key;
    let action = null;

    if (key === "ArrowUp" || key === "w" || key === "W") {
        action = "up";
    } else if (key === "ArrowDown" || key === "s" || key === "S") {
        action = "down";
    } else if (key === "ArrowLeft" || key === "a" || key === "A") {
        action = "left";
    } else if (key === "ArrowRight" || key === "d" || key === "D") {
        action = "right";
    } else if (key === "Enter") {
        action = "enter";
    } else if (key === "Escape" || key === "Backspace") {
        action = "back";
    } else if (key === "Tab") {
        action = "tab";
        ev.preventDefault();
    }

    if (!action) return;

    fetch(`https://${getResourceName()}/keydown`, {
        method: "POST",
        body: JSON.stringify({ action })
    });
});

function showNotification(type, title, desc, duration) {
    const container = document.getElementById("notifications");
    if (!container) return;

    const n = document.createElement("div");
    n.className = "notification";

    if (type === "success") n.classList.add("success");
    if (type === "error") n.classList.add("error");
    if (type === "info") n.classList.add("info");

    const titleEl = document.createElement("div");
    titleEl.className = "notification-title";
    titleEl.textContent = title || "KOBRA";

    const descEl = document.createElement("div");
    descEl.className = "notification-desc";
    descEl.textContent = desc || "";

    n.appendChild(titleEl);
    n.appendChild(descEl);

    container.appendChild(n);

    setTimeout(() => {
        n.style.opacity = "0";
        n.style.transform = "translateX(14px)";
        setTimeout(() => n.remove(), 250);
    }, duration || 3000);
}
