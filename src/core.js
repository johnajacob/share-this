import { stylePopup, lifeCycleFactory } from "./popup";
import { constrainRange } from "./dom";
import render from "./render";

let _undefined;

export default opts => {
    const options = Object.assign({
        document,
        selector: "body",
        sharers: [],
        popupClass: "share-this-popup",
        transformer: raw => raw.trim().replace(/\s+/g, " ")
    }, opts || {});

    let initialized = false;
    let destroyed = false;

    let _window;
    let _document;
    let _selection;

    let popup;
    let sharers;
    let createPopup;
    let attachPopup;
    let removePopup;

    return {
        init() {
            if (initialized || destroyed) return;

            _document = options.document;
            _window = _document.defaultView;
            if (!_window.getSelection) return console.error("Selection API isn't supported");

            _document.addEventListener("selectionchange", killPopup);
            for (const type of [ "mouseup", "touchend" ])
                _document.addEventListener(type, selectionCheck);

            _selection = _window.getSelection();
            ({ createPopup, attachPopup, removePopup } = lifeCycleFactory(_document));

            initialized = true;
        },
        destroy() {
            if (!initialized || destroyed) return;

            _document.removeEventListener("selectionchange", killPopup);
            for (const type of [ "mouseup", "touchend" ])
                _document.removeEventListener(type, selectionCheck);

            killPopup();
            _selection = _window = _document = null;

            destroyed = true;
        }
    };

    function selectionCheck() {
        const range = _selection.rangeCount && _selection.getRangeAt(0);
        if (!range) return killPopup();
        const constrainedRange = constrainRange(range, options.selector);
        if (constrainedRange.collapsed) return killPopup();

        drawPopup(constrainedRange);
    }

    function drawPopup(range) {
        if (popup) return;

        const rawText = range.toString();
        const text = options.transformer(rawText);

        sharers = options.sharers.filter(sharerCheck.bind(null, text, rawText));
        if (!sharers.length) return;

        popup = createPopup();
        popup.innerHTML = render(options, sharers, text, rawText);
        stylePopup(popup, range, options);
        attachPopup();

        if (typeof options.onOpen === "function")
            options.onOpen(popup, text, rawText);
    }

    function killPopup() {
        if (!popup) return;

        removePopup(popup);
        popup = sharers = null;
        if (typeof options.onClose === "function")
            options.onClose();
    }

    function sharerCheck(text, rawText, sharer) {
        if (typeof sharer.active === "function")
            return sharer.active(text, rawText);

        if (sharer.active !== _undefined)
            return sharer.active;

        return true;
    }
};
