import { getPageScroll, matches, closest } from "./dom";
import { findByName } from "./utils";

export function stylePopup(popup, range, options) {
    popup.className = options.popupClass;

    const rects = range.getClientRects();
    const lastRect = rects[rects.length - 1];
    const scroll = getPageScroll(options.document);

    popup.style.position = "absolute";
    popup.style.left = `${scroll.left + lastRect.left + lastRect.width/2}px`;
    popup.style.top = `${scroll.top + lastRect.top}px`;
};

export function popupClick(sharers, event) {
    const item = closest(event.target, "[data-share-via]");
    if (!item) return;

    const via = item.getAttribute("data-share-via");
    const sharer = findByName(sharers, via);
    if (!sharer || typeof sharer.action !== "function") return;

    sharer.action(event);
};

export function lifeCycleFactory(document) {
    return {
        createPopup(sharers) {
            const popup = document.createElement("div");
            popup.addEventListener("click", popupClick.bind(null, sharers));
            return popup;
        },
        attachPopup(popup) {
            document.body.appendChild(popup);
        },
        removePopup(popup) {
            document.body.removeChild(popup);
        }
    };
};
