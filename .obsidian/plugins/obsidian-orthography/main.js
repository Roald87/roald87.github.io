'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function getDefaultData() {
    return {
        displayRunner: true,
        useGrammar: false,
        language: 'en, ru, uk'
    };
}
class OrthographySettings {
    constructor(plugin, emitter) {
        this.plugin = plugin;
        this.data = getDefaultData();
        this.emitter = emitter;
    }
    get displayRunner() {
        const { data } = this;
        return data.displayRunner;
    }
    set displayRunner(value) {
        const { data } = this;
        data.displayRunner = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    get useGrammar() {
        const { data } = this;
        return data.useGrammar;
    }
    set useGrammar(value) {
        const { data } = this;
        data.useGrammar = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    get language() {
        const { data } = this;
        return data.language;
    }
    set language(value) {
        const { data } = this;
        data.language = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const { plugin } = this;
            this.data = Object.assign(getDefaultData(), yield plugin.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const { plugin, data } = this;
            if (plugin && data) {
                yield plugin.saveData(data);
            }
        });
    }
}

// Grammer popup
const O_POPUP = 'obsidian-orthography-popup';
const O_POPUP_DISABLED = 'obsidian-orthography-popup--disabled';
const O_POPUP_CONTROLS = 'obsidian-orthography-popup-controls';
const O_POPUP_ITEM = 'obsidian-orthography-popup-item';
const O_POPUP_RESIZED = 'obsidian-orthography-popup--resized';
const O_POPUP_ITEM_OPENED = 'obsidian-orthography-popup-item--opened';
const O_POPUP_WORD_TO_REPLACE = 'obsidian-orthography-word-to-replace';
// Runner
const O_RUNNER = 'obsidian-orthography-runner';
const O_RUNNER_HIDDEN = 'obsidian-orthography-runner--hidden';
const O_RUNNER_LOADING = 'obsidian-orthography-runner--loading';
// Highlight
const O_HIGHLIGHT = 'obsidian-orthography-highlight';
const O_HIGHLIGHT_FOCUSED = 'obsidian-orthography-highlight--focused';

const O_RUNNER_ICON = '⌘';
const O_RUNNER_ICON_CLEAR = '✕';
const O_NOT_OPEN_FILE = 'Please open a file first.';
const O_SERVER_ERROR = 'The server is not responding. Please check your Internet connection.';
const O_NO_ERROR = 'Spelling errors not found!';

const UIControls = (hasData) => {
    return `
      <div class="obsidian-orthography-popup-controls">
        ${hasData
        ? '<button id="reloader" class="obsidian-orthography-popup-reload" title="Restart the orthography checker">Reload</button>'
        : ''}
        <div id="closer" class="obsidian-orthography-popup-close" title="Close popup">✕</div>
      </div>
    `;
};

const JOIN_BY = '<span style="opacity: 0.5;">or</span>&nbsp;';
const renderHints = (card, index) => {
    const { replacements, text, begin, highlightText } = card;
    if (card.category === 'Determiners') {
        return replacements
            .map((item) => {
            return `
          <span
            data-toreplace="${item}"
            data-index="${index}"
            data-begin="${begin}"
            data-text="${text}"
            class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
            title="Click to correct your spelling">
              <b>${item}</b>&nbsp${highlightText}
          </span>`;
        })
            .join(JOIN_BY);
    }
    // ----------- FOR REMOVE HINTS ----------- //
    if (card.category === 'Formatting' ||
        card.category === 'BasicPunct' ||
        card.category === 'Wordiness' ||
        card.category === 'Conjunctions') {
        return `
      <span
        data-begin="${begin}"
        data-text="${text}"
        data-toreplace="${replacements[0]}"
        class="obsidian-orthography-word-to-replace obsidian-orthography-popup-hightligh--red">${highlightText || ''}
      </span>
    `;
    }
    if (card.category === 'Prepositions') {
        return replacements
            .map((item) => {
            return `
        <span
          data-toreplace="${item}"
          data-index="${index}"
          data-begin="${begin}"
          data-text="${highlightText}"
          class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
          title="Click to correct your spelling"
        >
          <b>${item}</b>&nbsp${highlightText}
        </span>`;
        })
            .join(JOIN_BY);
    }
    return replacements
        .map((item) => {
        return `
        <span class="obsidian-orthography-popup-card--line-through">${highlightText}</span>
        <span
          data-toreplace="${item}"
          data-index="${index}"
          data-begin="${begin}"
          data-text="${text}"
          class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
          title="Click to correct your spelling"
        >
          ${item}
        </span>`;
    })
        .join(JOIN_BY);
};
const UIHints = (alerts) => {
    if (!alerts || !alerts.length)
        return '';
    return alerts
        .map((card, index) => {
        const { impact, highlightText, minicardTitle, explanation, cardLayout, begin } = card;
        return `
          <div data-begin="${begin}" id="obsidian-orthography-popup-item-${index}" class="obsidian-orthography-popup-item ${impact}">
            <div class="obsidian-orthography-popup-minicard">
              <div>${highlightText || ''}</div>
              ${minicardTitle
            ? `<div class="obsidian-orthography-popup-item-sugg">${minicardTitle}</div>`
            : ''}
              <div class="obsidian-orthography-popup-arrows">
                <svg width="10" viewBox="0 0 10 10"><path d="M5 4.3L.85.14c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7L5 5.7 9.85.87c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0L5 4.28z" stroke="none" transform="translate(0 3) rotate(0)"></path></svg>
                <svg width="10" viewBox="0 0 10 10"><path d="M5 4.3L.85.14c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7L5 5.7 9.85.87c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0L5 4.28z" stroke="none" transform="translate(0 3) rotate(0)"></path></svg>
              </div>
            </div>
            <div class="obsidian-orthography-popup-card">
              <div>${cardLayout.group || ''}</div>
              <div class="obsidian-orthography-popup-card-content">
                ${renderHints(card, index)}
              </div>
              <div>${explanation || ''}</div>
            </div>
          </div>
        `;
    })
        .join('');
};

const UIHintsFallback = () => {
    const hintsFallback = `
    <div class="obsidian-orthography-hints-fallback">
      <button id="runner">
        Run orthography check
      </button>
      <p>Alpha version</p>
    </div>
  `;
    return hintsFallback;
};

const UILoader = () => {
    const loader = `
    <div class="obsidian-orthography-loader">
      Checking...
    </div>
  `;
    return loader;
};

const UIBar = (data, loading) => {
    const hasData = data && data.alerts && data.alerts.length;
    const controls = UIControls(!!hasData);
    const fallback = loading ? UILoader() : UIHintsFallback();
    const cards = hasData ? UIHints(data.alerts) : fallback;
    return `${controls}${cards}`;
};

let self$3;
class OrthographyPopup {
    constructor(app, settings, emitter) {
        this.popupOffset = [0, 0];
        this.moverSelected = false;
        this.created = false;
        this.app = app;
        this.settings = settings;
        this.emitter = emitter;
    }
    init() {
        self$3 = this;
    }
    create() {
        self$3.created = true;
        self$3.popup = document.createElement('div');
        self$3.popup.classList.add(O_POPUP);
        self$3.popup.id = O_POPUP;
        const bar = UIBar(null, false);
        self$3.popup.innerHTML = bar;
        document.body.appendChild(self$3.popup);
        self$3.setListeners();
    }
    destroy() {
        self$3.created = false;
        self$3.removeListeners();
        const popup = document.getElementById(O_POPUP);
        if (popup)
            popup.remove();
    }
    update(data, loading) {
        self$3.removeListeners();
        const bar = UIBar(data, loading);
        self$3.popup.innerHTML = bar;
        self$3.setListeners();
    }
    setLoader() {
        this.update(null, true);
    }
    removeLoader() {
        this.update(null, false);
    }
    disable() {
        const hints = document.querySelector(`#${O_POPUP}`);
        if (hints) {
            hints.classList.add(O_POPUP_DISABLED);
        }
    }
    enable() {
        const hints = document.querySelector(`#${O_POPUP}`);
        if (hints) {
            hints.classList.remove(O_POPUP_DISABLED);
        }
    }
    setListeners() {
        const minicards = document.querySelectorAll(`.${O_POPUP_ITEM}`);
        minicards.forEach((mc) => mc.addEventListener('click', self$3.onClickByHint));
        minicards.forEach((mc) => mc.addEventListener('mouseover', self$3.onFocusWord));
        minicards.forEach((mc) => mc.addEventListener('mouseout', self$3.onRemoveFocusWord));
        const replacements = document.querySelectorAll(`.${O_POPUP_WORD_TO_REPLACE}`);
        replacements.forEach((rp) => rp.addEventListener('click', self$3.onReplaceWord));
        self$3.reloader = document.getElementById('reloader');
        if (self$3.reloader) {
            self$3.reloader.addEventListener('click', self$3.onRun);
        }
        self$3.runner = document.getElementById('runner');
        if (self$3.runner) {
            self$3.runner.addEventListener('click', self$3.onRun);
        }
        self$3.sizer = document.getElementById('sizer');
        if (self$3.sizer) {
            self$3.sizer.addEventListener('click', self$3.onResize);
        }
        self$3.closer = document.getElementById('closer');
        if (self$3.closer) {
            self$3.closer.addEventListener('click', self$3.onClose);
        }
        self$3.mover = document.querySelector(`.${O_POPUP_CONTROLS}`);
        if (self$3.mover) {
            self$3.mover.addEventListener('mousedown', self$3.moverIsDown);
        }
        document.addEventListener('mouseup', self$3.onMouseUp);
        document.addEventListener('mousemove', self$3.onMouseMove);
    }
    removeListeners() {
        const minicards = document.querySelectorAll(`.${O_POPUP_ITEM}`);
        minicards.forEach((mc) => mc.removeEventListener('click', self$3.onClickByHint));
        minicards.forEach((mc) => mc.removeEventListener('mouseover', self$3.onFocusWord));
        minicards.forEach((mc) => mc.removeEventListener('mouseout', self$3.onRemoveFocusWord));
        const replacements = document.querySelectorAll(`.${O_POPUP_WORD_TO_REPLACE}`);
        replacements.forEach((rp) => rp.removeEventListener('click', self$3.onReplaceWord));
        if (self$3.reloader)
            self$3.reloader.removeEventListener('click', self$3.onRun);
        if (self$3.runner)
            self$3.runner.removeEventListener('click', self$3.onRun);
        if (self$3.sizer)
            self$3.sizer.removeEventListener('click', self$3.onResize);
        if (self$3.closer)
            self$3.closer.removeEventListener('click', self$3.onClose);
        if (self$3.mover)
            self$3.mover.removeEventListener('mousedown', self$3.moverIsDown);
        document.removeEventListener('mouseup', self$3.onMouseUp);
        document.removeEventListener('mousemove', self$3.onMouseMove);
    }
    onClickByHint(e) {
        const opened = document.querySelectorAll(`.${O_POPUP_ITEM_OPENED}`);
        opened.forEach((o) => o.classList.remove(O_POPUP_ITEM_OPENED));
        if (e.currentTarget.classList.contains(O_POPUP_ITEM_OPENED)) {
            e.currentTarget.classList.remove(O_POPUP_ITEM_OPENED);
        }
        else {
            e.currentTarget.classList.add(O_POPUP_ITEM_OPENED);
        }
        const begin = e.currentTarget.dataset.begin;
        if (begin) {
            self$3.scrollToWord(begin);
        }
    }
    moverIsDown(e) {
        self$3.moverSelected = true;
        self$3.popupOffset = [
            self$3.popup.offsetLeft - e.clientX,
            self$3.popup.offsetTop - e.clientY
        ];
    }
    onMouseUp() {
        self$3.moverSelected = false;
    }
    onMouseMove(e) {
        e.preventDefault();
        if (self$3.moverSelected) {
            const mousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            self$3.popup.style.left = `${mousePosition.x + self$3.popupOffset[0]}px`;
            self$3.popup.style.top = `${mousePosition.y + self$3.popupOffset[1]}px`;
        }
    }
    onResize() {
        if (self$3.popup.className.contains(O_POPUP_RESIZED)) {
            self$3.popup.classList.remove(O_POPUP_RESIZED);
        }
        else {
            self$3.popup.classList.add(O_POPUP_RESIZED);
        }
    }
    onClose() {
        self$3.emitter.trigger('orthography:close');
    }
    onFocusWord(e) {
        const begin = e.currentTarget.dataset.begin;
        const word = document.querySelector(`[begin="${begin}"]`);
        if (word) {
            word.classList.add(O_HIGHLIGHT_FOCUSED);
        }
    }
    onRemoveFocusWord() {
        const words = document.querySelectorAll(`.${O_HIGHLIGHT_FOCUSED}`);
        words.forEach((w) => w.classList.remove(O_HIGHLIGHT_FOCUSED));
    }
    onRun() {
        self$3.emitter.trigger('orthography:run');
    }
    onReplaceWord(event) {
        self$3.emitter.trigger('orthography:replace', event);
        const { index } = event.currentTarget.dataset;
        const selectedItem = document.getElementById(`${O_POPUP_ITEM}-${index}`);
        if (selectedItem)
            selectedItem.remove();
        if (!document.querySelectorAll(`.${O_POPUP_ITEM}`).length) {
            self$3.removeLoader();
        }
    }
    onOpenCard(event) {
        const { value: begin } = event.currentTarget.attributes.begin;
        const popup = document.querySelector(`.${O_POPUP}`);
        const opened = document.querySelectorAll(`.${O_POPUP_ITEM_OPENED}`);
        opened.forEach((o) => o.classList.remove(O_POPUP_ITEM_OPENED));
        const selected = document.querySelector(`[data-begin="${begin}"]`);
        selected.classList.add(O_POPUP_ITEM_OPENED);
        popup.scrollTop = selected.offsetTop;
    }
    scrollToWord(begin) {
        const activeEditor = self$3.getEditor();
        if (activeEditor) {
            const scroller = activeEditor.getScrollerElement();
            scroller.scrollTop = +begin - 300;
        }
        else {
            self$3.onClose();
            new obsidian.Notice(O_NOT_OPEN_FILE);
        }
    }
    getEditor() {
        const activeLeaf = this.app.workspace.activeLeaf;
        const sourceMode = activeLeaf.view.sourceMode;
        if (!sourceMode)
            return null;
        return activeLeaf.view.sourceMode.cmEditor;
    }
}

let self$2;
class OrthographyToggler {
    constructor(app, settings, emitter) {
        this.app = app;
        this.settings = settings;
        this.emitter = emitter;
    }
    init() {
        self$2 = this;
        this.createButton(O_RUNNER_ICON);
    }
    destroy() {
        this.removeLoading();
        this.toggler.removeEventListener('click', this.toggle);
        this.removeButton();
    }
    toggle() {
        const activeEditor = self$2.getEditor();
        if (!activeEditor) {
            if (self$2.showed) {
                self$2.setButtonWithRunner();
                self$2.showed = false;
            }
            else {
                new obsidian.Notice(O_NOT_OPEN_FILE);
            }
            return;
        }
        self$2.showed = !self$2.showed;
        if (self$2.showed) {
            self$2.setButtonWithClear();
        }
        else {
            self$2.setButtonWithRunner();
        }
    }
    hide() {
        const runner = document.querySelector('.' + O_RUNNER);
        runner.classList.add(O_RUNNER_HIDDEN);
    }
    setLoading() {
        this.toggler.classList.add(O_RUNNER_LOADING);
    }
    removeLoading() {
        this.toggler.classList.remove(O_RUNNER_LOADING);
    }
    reset() {
        this.showed = false;
        this.removeLoading();
        this.updateButtonText(O_RUNNER_ICON);
    }
    createButton(text) {
        this.toggler = document.createElement('button');
        const icon = document.createElement('span');
        icon.innerText = text;
        this.toggler.classList.add(O_RUNNER);
        this.toggler.appendChild(icon);
        document.body.appendChild(this.toggler);
        this.toggler.addEventListener('click', this.toggle);
    }
    updateButtonText(text) {
        const toggler = document.querySelector(`.${O_RUNNER} span`);
        if (toggler)
            toggler.innerText = text;
    }
    removeButton() {
        const toggler = document.querySelector(`.${O_RUNNER}`);
        if (toggler)
            toggler.remove();
    }
    setButtonWithClear() {
        self$2.updateButtonText(O_RUNNER_ICON_CLEAR);
        self$2.emitter.trigger('orthography:open');
    }
    setButtonWithRunner() {
        self$2.updateButtonText(O_RUNNER_ICON);
        self$2.removeLoading();
        self$2.emitter.trigger('orthography:close');
    }
    getEditor() {
        const activeLeaf = this.app.workspace.activeLeaf;
        const sourceMode = activeLeaf.view.sourceMode;
        if (!sourceMode)
            return null;
        return activeLeaf.view.sourceMode.cmEditor;
    }
}

let self$1;
class OrthographyEditor {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;
    }
    init() {
        self$1 = this;
    }
    destroy() {
        self$1.clearHighlightWords();
    }
    highlightWords(editor, alerts) {
        this.clearHighlightWords();
        if (!editor || !alerts || alerts.length === 0)
            return;
        alerts.forEach((alert) => {
            const textLength = alert.text.length || alert.highlightText.length;
            const originalWord = {
                begin: alert.begin,
                end: alert.end,
                len: textLength
            };
            this.highlightWord(editor, originalWord);
        });
    }
    highlightWord(editor, originalWord) {
        if (!editor || !originalWord)
            return;
        const colRow = this.getColRow(editor, originalWord);
        if (!colRow)
            return;
        const { col, row } = colRow;
        this.highlightedWords = editor.markText({ line: row, ch: col }, { line: row, ch: col + originalWord.len }, {
            className: O_HIGHLIGHT,
            attributes: {
                begin: originalWord.begin,
                end: originalWord.end,
                len: originalWord.len
            }
        });
    }
    replaceWord(editor, originalWord, newWord) {
        if (!editor || !originalWord || !newWord)
            return;
        const colRow = this.getColRow(editor, originalWord);
        if (!colRow)
            return;
        const { col, row } = colRow;
        const doc = editor.getDoc();
        const from = {
            line: row,
            ch: col
        };
        const to = {
            line: row,
            ch: col + originalWord.len
        };
        doc.replaceRange(newWord, from, to);
    }
    getColRow(editor, originalWord) {
        if (!editor || !originalWord)
            return;
        let ttl = 0;
        let row = 0;
        let result;
        const { begin } = originalWord;
        if (!editor.eachLine)
            return undefined;
        editor.eachLine((line) => {
            const s = ttl === 0 ? ttl : ttl + 1;
            const lineTextLength = line.text.length;
            ttl += lineTextLength;
            if (row > 0) {
                ttl++;
            }
            if (begin >= s && begin <= ttl) {
                const diff = ttl - lineTextLength;
                const col = begin - diff;
                result = { col, row };
                return;
            }
            row++;
        });
        return result;
    }
    clearHighlightWords() {
        if (typeof self$1.highlightedWords === 'object') {
            self$1.highlightedWords.clear();
        }
        const highlightWords = document.querySelectorAll(`.${O_HIGHLIGHT}`);
        highlightWords.forEach((span) => {
            span.removeAttribute('class');
        });
    }
}

const debounce = (callback, timeout) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(undefined, args);
        }, timeout);
    };
};

const sortAlerts = (alerts) => {
    return alerts.sort((a, b) => a.begin - b.begin);
};
const formatAlerts = (alerts) => {
    const withoutHidden = alerts.filter((alert) => alert.hidden !== true);
    const withoutDuplicate = withoutHidden.reduce((acc, current) => {
        const x = acc.find((item) => item.explanation === current.explanation);
        if (!x) {
            return acc.concat([current]);
        }
        else {
            return acc;
        }
    }, []);
    return withoutDuplicate;
};

const API_URL_GRAMMAR = 'https://obsidian-orthography-api-mz8l64tz3-denisoed.vercel.app/check';

// Use self in events callbacks
let self;
class OrthographyPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.debounceGetDataFunc = debounce(this.onChangeText.bind(this), 500);
        this.getDataFunc = debounce(this.onRunFromPopup.bind(this), 0);
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            // ------ Init -------- //
            self = this;
            this.emitter = new obsidian.Events();
            const settings = new OrthographySettings(this, this.emitter);
            yield settings.loadSettings();
            this.settings = settings;
            // this.addSettingTab(new OrthographySettingTab(this.app, settings, this));
            this.initOrthographyToggler();
            this.initOrthographyPopup();
            this.initOrthographyEditor();
            // ------- Events -------- //
            this.emitter.on('orthography:open', this.onPopupOpen);
            this.emitter.on('orthography:close', this.onPopupClose);
            this.emitter.on('orthography:run', this.getDataFunc);
            this.emitter.on('orthography:replace', this.onReplaceWord);
            // NOTE: find a better way to do this
            // Listen to changes in the editor
            this.registerDomEvent(document, 'click', () => {
                if (!this.activeEditor)
                    return;
                this.activeEditor.off('change', this.debounceGetDataFunc);
                this.activeEditor = this.getEditor();
                if (!this.activeEditor)
                    return;
                this.activeEditor.on('change', this.debounceGetDataFunc);
            });
        });
    }
    onunload() {
        this.emitter.off('orthography:open', this.onPopupOpen);
        this.emitter.off('orthography:close', this.onPopupClose);
        this.emitter.off('orthography:run', this.onRunFromPopup);
        this.emitter.off('orthography:replace', this.onReplaceWord);
        if (this.activeEditor)
            this.activeEditor.off('change', this.debounceGetDataFunc);
        this.toggler.destroy();
        this.popup.destroy();
        this.editor.destroy();
        this.hints = null;
        this.activeEditor = null;
    }
    initOrthographyToggler() {
        const { app, settings, emitter } = this;
        this.toggler = new OrthographyToggler(app, settings, emitter);
        this.toggler.init();
    }
    initOrthographyPopup() {
        const { app, settings, emitter } = this;
        this.popup = new OrthographyPopup(app, settings, emitter);
        this.popup.init();
    }
    initOrthographyEditor() {
        const { app, settings } = this;
        this.editor = new OrthographyEditor(app, settings);
        this.editor.init();
    }
    getEditor() {
        const activeLeaf = this.app.workspace.activeLeaf;
        const sourceMode = activeLeaf.view.sourceMode;
        return sourceMode ? sourceMode.cmEditor : null;
    }
    onChangeText() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.popup.created)
                return;
            this.runChecker();
        });
    }
    onRunFromPopup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.popup.created)
                return;
            this.editor.destroy();
            this.popup.setLoader();
            this.activeEditor = this.getEditor();
            if (this.activeEditor) {
                this.runChecker();
            }
            else {
                new obsidian.Notice(O_NOT_OPEN_FILE);
                this.onPopupClose();
            }
        });
    }
    runChecker() {
        return __awaiter(this, void 0, void 0, function* () {
            this.toggler.setLoading();
            if (!this.activeEditor)
                return;
            const text = this.activeEditor.getValue();
            this.hints = yield this.fetchData(text);
            if (this.hints instanceof TypeError) {
                this.popup.removeLoader();
                this.toggler.removeLoading();
                new obsidian.Notice(O_SERVER_ERROR);
                return;
            }
            if (this.hints && this.hints.alerts && this.hints.alerts.length) {
                const alerts = formatAlerts(this.hints.alerts);
                this.editor.highlightWords(this.activeEditor, alerts);
                this.popup.update({
                    alerts: sortAlerts(alerts)
                });
            }
            else {
                new obsidian.Notice(O_NO_ERROR);
                this.popup.removeLoader();
            }
            this.toggler.removeLoading();
        });
    }
    onPopupOpen() {
        self.popup.create();
    }
    onPopupClose() {
        self.editor.destroy();
        if (self.activeEditor)
            self.activeEditor.doc.getAllMarks().forEach((m) => m.clear());
        self.popup.destroy();
        self.toggler.reset();
        if (self.aborter) {
            self.aborter.abort();
            self.aborter = null;
        }
    }
    onReplaceWord(event) {
        const origWordLen = event.currentTarget.dataset.text.length;
        const newWord = event.currentTarget.dataset.toreplace;
        const begin = event.currentTarget.dataset.begin;
        const end = begin + origWordLen;
        self.editor.replaceWord(self.activeEditor, {
            begin: +begin,
            end: +end,
            len: +origWordLen
        }, newWord);
    }
    fetchData(text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (self.aborter)
                self.aborter.abort();
            self.popup.disable();
            self.aborter = new AbortController();
            const { signal } = self.aborter;
            const url = new URL(API_URL_GRAMMAR);
            const params = { text };
            Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
            try {
                const response = yield fetch(url, {
                    method: 'GET',
                    signal
                });
                self.aborter = null;
                return yield response.json();
            }
            catch (error) {
                return error;
            }
            finally {
                self.popup.enable();
            }
        });
    }
}

module.exports = OrthographyPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9zZXR0aW5ncy9vcnRob2dyYXBoeVNldHRpbmdzLnRzIiwic3JjL2Nzc0NsYXNzZXMudHMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL29ydGhvZ3JhcGh5L1VJRWxlbWVudHMvVUlDb250cm9scy50cyIsInNyYy9vcnRob2dyYXBoeS9VSUVsZW1lbnRzL1VJSGludHMudHMiLCJzcmMvb3J0aG9ncmFwaHkvVUlFbGVtZW50cy9VSUhpbnRzRmFsbGJhY2sudHMiLCJzcmMvb3J0aG9ncmFwaHkvVUlFbGVtZW50cy9VSUxvYWRlci50cyIsInNyYy9vcnRob2dyYXBoeS9VSUVsZW1lbnRzL1VJQmFyLnRzIiwic3JjL29ydGhvZ3JhcGh5L29ydGhvZ3JhcGh5UG9wdXAudHMiLCJzcmMvb3J0aG9ncmFwaHkvb3J0aG9ncmFwaHlUb2dnbGVyLnRzIiwic3JjL29ydGhvZ3JhcGh5L29ydGhvZ3JhcGh5RWRpdG9yLnRzIiwic3JjL29ydGhvZ3JhcGh5L2hlbHBlcnMvZGVib3VuY2UudHMiLCJzcmMvb3J0aG9ncmFwaHkvaGVscGVycy9mb3JtYXR0ZXJzLnRzIiwic3JjL2NvbmZpZy50cyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfSk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuIiwiaW1wb3J0IHR5cGUgeyBFdmVudHMgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgdHlwZSBPcnRob2dyYXBoeVBsdWdpbiBmcm9tICcuLi9tYWluJztcblxuaW50ZXJmYWNlIFNldHRpbmdzRGF0YSB7XG4gIGRpc3BsYXlSdW5uZXI6IGJvb2xlYW47XG4gIHVzZUdyYW1tYXI6IGJvb2xlYW47XG4gIGxhbmd1YWdlOiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHREYXRhKCk6IFNldHRpbmdzRGF0YSB7XG4gIHJldHVybiB7XG4gICAgZGlzcGxheVJ1bm5lcjogdHJ1ZSxcbiAgICB1c2VHcmFtbWFyOiBmYWxzZSxcbiAgICBsYW5ndWFnZTogJ2VuLCBydSwgdWsnXG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBPcnRob2dyYXBoeVNldHRpbmdzIHtcbiAgcHJpdmF0ZSBkYXRhOiBTZXR0aW5nc0RhdGE7XG4gIHByaXZhdGUgZW1pdHRlcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBPcnRob2dyYXBoeVBsdWdpbiwgZW1pdHRlcjogRXZlbnRzKSB7XG4gICAgdGhpcy5kYXRhID0gZ2V0RGVmYXVsdERhdGEoKTtcbiAgICB0aGlzLmVtaXR0ZXIgPSBlbWl0dGVyO1xuICB9XG5cbiAgZ2V0IGRpc3BsYXlSdW5uZXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzO1xuICAgIHJldHVybiBkYXRhLmRpc3BsYXlSdW5uZXI7XG4gIH1cblxuICBzZXQgZGlzcGxheVJ1bm5lcih2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcztcbiAgICBkYXRhLmRpc3BsYXlSdW5uZXIgPSB2YWx1ZTtcbiAgICB0aGlzLmVtaXR0ZXIudHJpZ2dlcignb25VcGRhdGVTZXR0aW5ncycsIHRoaXMuZGF0YSk7XG4gIH1cblxuICBnZXQgdXNlR3JhbW1hcigpOiBib29sZWFuIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXM7XG4gICAgcmV0dXJuIGRhdGEudXNlR3JhbW1hcjtcbiAgfVxuXG4gIHNldCB1c2VHcmFtbWFyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzO1xuICAgIGRhdGEudXNlR3JhbW1hciA9IHZhbHVlO1xuICAgIHRoaXMuZW1pdHRlci50cmlnZ2VyKCdvblVwZGF0ZVNldHRpbmdzJywgdGhpcy5kYXRhKTtcbiAgfVxuXG4gIGdldCBsYW5ndWFnZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcztcbiAgICByZXR1cm4gZGF0YS5sYW5ndWFnZTtcbiAgfVxuXG4gIHNldCBsYW5ndWFnZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzO1xuICAgIGRhdGEubGFuZ3VhZ2UgPSB2YWx1ZTtcbiAgICB0aGlzLmVtaXR0ZXIudHJpZ2dlcignb25VcGRhdGVTZXR0aW5ncycsIHRoaXMuZGF0YSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwbHVnaW4gfSA9IHRoaXM7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihnZXREZWZhdWx0RGF0YSgpLCBhd2FpdCBwbHVnaW4ubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyBwbHVnaW4sIGRhdGEgfSA9IHRoaXM7XG4gICAgaWYgKHBsdWdpbiAmJiBkYXRhKSB7XG4gICAgICBhd2FpdCBwbHVnaW4uc2F2ZURhdGEoZGF0YSk7XG4gICAgfVxuICB9XG59XG4iLCIvLyBHcmFtbWVyIHBvcHVwXG5leHBvcnQgY29uc3QgT19QT1BVUCA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cCc7XG5leHBvcnQgY29uc3QgT19QT1BVUF9ESVNBQkxFRCA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC0tZGlzYWJsZWQnO1xuZXhwb3J0IGNvbnN0IE9fUE9QVVBfQ09OVFJPTFMgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtY29udHJvbHMnO1xuZXhwb3J0IGNvbnN0IE9fUE9QVVBfSVRFTSA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1pdGVtJztcbmV4cG9ydCBjb25zdCBPX1BPUFVQX1JFU0laRUQgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtLXJlc2l6ZWQnO1xuZXhwb3J0IGNvbnN0IE9fUE9QVVBfSVRFTV9PUEVORUQgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaXRlbS0tb3BlbmVkJztcbmV4cG9ydCBjb25zdCBPX1BPUFVQX1dPUkRfVE9fUkVQTEFDRSA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS13b3JkLXRvLXJlcGxhY2UnO1xuXG4vLyBSdW5uZXJcbmV4cG9ydCBjb25zdCBPX1JVTk5FUiA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1ydW5uZXInO1xuZXhwb3J0IGNvbnN0IE9fUlVOTkVSX0FDVElWRSA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1ydW5uZXItLWFjdGl2ZSc7XG5leHBvcnQgY29uc3QgT19SVU5ORVJfQ0xFQVIgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcnVubmVyLS1jbGVhcic7XG5leHBvcnQgY29uc3QgT19SVU5ORVJfSElEREVOID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXJ1bm5lci0taGlkZGVuJztcbmV4cG9ydCBjb25zdCBPX1JVTk5FUl9MT0FESU5HID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXJ1bm5lci0tbG9hZGluZyc7XG5cbi8vIFRvb2x0aXBcbmV4cG9ydCBjb25zdCBPX1RPT0xUSVAgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktdG9vbHRpcCc7XG5leHBvcnQgY29uc3QgT19UT09MVElQX1ZJU0lCTEUgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktdG9vbHRpcC0tdmlzaWJsZSc7XG5leHBvcnQgY29uc3QgT19UT09MVElQX0hJTlQgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktdG9vbHRpcC1oaW50JztcblxuLy8gSGlnaGxpZ2h0XG5leHBvcnQgY29uc3QgT19ISUdITElHSFQgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktaGlnaGxpZ2h0JztcbmV4cG9ydCBjb25zdCBPX0hJR0hMSUdIVF9GT0NVU0VEID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LWhpZ2hsaWdodC0tZm9jdXNlZCc7XG4iLCJleHBvcnQgY29uc3QgT19SVU5ORVJfSUNPTiA9ICfijJgnO1xuZXhwb3J0IGNvbnN0IE9fUlVOTkVSX0lDT05fQ0xFQVIgPSAn4pyVJztcbmV4cG9ydCBjb25zdCBPX05PVF9PUEVOX0ZJTEUgPSAnUGxlYXNlIG9wZW4gYSBmaWxlIGZpcnN0Lic7XG5leHBvcnQgY29uc3QgT19TRVJWRVJfRVJST1IgPVxuICAnVGhlIHNlcnZlciBpcyBub3QgcmVzcG9uZGluZy4gUGxlYXNlIGNoZWNrIHlvdXIgSW50ZXJuZXQgY29ubmVjdGlvbi4nO1xuZXhwb3J0IGNvbnN0IE9fTk9fRVJST1IgPSAnU3BlbGxpbmcgZXJyb3JzIG5vdCBmb3VuZCEnO1xuIiwiY29uc3QgVUlDb250cm9scyA9IChoYXNEYXRhOiBib29sZWFuKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIGBcbiAgICAgIDxkaXYgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1jb250cm9sc1wiPlxuICAgICAgICAke1xuICAgICAgICAgIGhhc0RhdGFcbiAgICAgICAgICAgID8gJzxidXR0b24gaWQ9XCJyZWxvYWRlclwiIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtcmVsb2FkXCIgdGl0bGU9XCJSZXN0YXJ0IHRoZSBvcnRob2dyYXBoeSBjaGVja2VyXCI+UmVsb2FkPC9idXR0b24+J1xuICAgICAgICAgICAgOiAnJ1xuICAgICAgICB9XG4gICAgICAgIDxkaXYgaWQ9XCJjbG9zZXJcIiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWNsb3NlXCIgdGl0bGU9XCJDbG9zZSBwb3B1cFwiPuKclTwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgYDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVJQ29udHJvbHM7XG4iLCJpbXBvcnQgeyBJRGF0YSB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMnO1xuXG5jb25zdCBKT0lOX0JZID0gJzxzcGFuIHN0eWxlPVwib3BhY2l0eTogMC41O1wiPm9yPC9zcGFuPiZuYnNwOyc7XG5cbmNvbnN0IHJlbmRlckhpbnRzID0gKGNhcmQ6IElEYXRhLCBpbmRleDogbnVtYmVyKTogc3RyaW5nID0+IHtcbiAgY29uc3QgeyByZXBsYWNlbWVudHMsIHRleHQsIGJlZ2luLCBoaWdobGlnaHRUZXh0IH0gPSBjYXJkO1xuICBpZiAoY2FyZC5jYXRlZ29yeSA9PT0gJ0RldGVybWluZXJzJykge1xuICAgIHJldHVybiByZXBsYWNlbWVudHNcbiAgICAgIC5tYXAoKGl0ZW06IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBkYXRhLXRvcmVwbGFjZT1cIiR7aXRlbX1cIlxuICAgICAgICAgICAgZGF0YS1pbmRleD1cIiR7aW5kZXh9XCJcbiAgICAgICAgICAgIGRhdGEtYmVnaW49XCIke2JlZ2lufVwiXG4gICAgICAgICAgICBkYXRhLXRleHQ9XCIke3RleHR9XCJcbiAgICAgICAgICAgIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktd29yZC10by1yZXBsYWNlIG9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLXJlcGxhY2VtZW50XCJcbiAgICAgICAgICAgIHRpdGxlPVwiQ2xpY2sgdG8gY29ycmVjdCB5b3VyIHNwZWxsaW5nXCI+XG4gICAgICAgICAgICAgIDxiPiR7aXRlbX08L2I+Jm5ic3Ake2hpZ2hsaWdodFRleHR9XG4gICAgICAgICAgPC9zcGFuPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oSk9JTl9CWSk7XG4gIH1cbiAgLy8gLS0tLS0tLS0tLS0gRk9SIFJFTU9WRSBISU5UUyAtLS0tLS0tLS0tLSAvL1xuICBpZiAoXG4gICAgY2FyZC5jYXRlZ29yeSA9PT0gJ0Zvcm1hdHRpbmcnIHx8XG4gICAgY2FyZC5jYXRlZ29yeSA9PT0gJ0Jhc2ljUHVuY3QnIHx8XG4gICAgY2FyZC5jYXRlZ29yeSA9PT0gJ1dvcmRpbmVzcycgfHxcbiAgICBjYXJkLmNhdGVnb3J5ID09PSAnQ29uanVuY3Rpb25zJ1xuICApIHtcbiAgICByZXR1cm4gYFxuICAgICAgPHNwYW5cbiAgICAgICAgZGF0YS1iZWdpbj1cIiR7YmVnaW59XCJcbiAgICAgICAgZGF0YS10ZXh0PVwiJHt0ZXh0fVwiXG4gICAgICAgIGRhdGEtdG9yZXBsYWNlPVwiJHtyZXBsYWNlbWVudHNbMF19XCJcbiAgICAgICAgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS13b3JkLXRvLXJlcGxhY2Ugb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaGlnaHRsaWdoLS1yZWRcIj4ke1xuICAgICAgICAgIGhpZ2hsaWdodFRleHQgfHwgJydcbiAgICAgICAgfVxuICAgICAgPC9zcGFuPlxuICAgIGA7XG4gIH1cbiAgaWYgKGNhcmQuY2F0ZWdvcnkgPT09ICdQcmVwb3NpdGlvbnMnKSB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50c1xuICAgICAgLm1hcCgoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgZGF0YS10b3JlcGxhY2U9XCIke2l0ZW19XCJcbiAgICAgICAgICBkYXRhLWluZGV4PVwiJHtpbmRleH1cIlxuICAgICAgICAgIGRhdGEtYmVnaW49XCIke2JlZ2lufVwiXG4gICAgICAgICAgZGF0YS10ZXh0PVwiJHtoaWdobGlnaHRUZXh0fVwiXG4gICAgICAgICAgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS13b3JkLXRvLXJlcGxhY2Ugb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtcmVwbGFjZW1lbnRcIlxuICAgICAgICAgIHRpdGxlPVwiQ2xpY2sgdG8gY29ycmVjdCB5b3VyIHNwZWxsaW5nXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxiPiR7aXRlbX08L2I+Jm5ic3Ake2hpZ2hsaWdodFRleHR9XG4gICAgICAgIDwvc3Bhbj5gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKEpPSU5fQlkpO1xuICB9XG4gIHJldHVybiByZXBsYWNlbWVudHNcbiAgICAubWFwKChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBgXG4gICAgICAgIDxzcGFuIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtY2FyZC0tbGluZS10aHJvdWdoXCI+JHtoaWdobGlnaHRUZXh0fTwvc3Bhbj5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBkYXRhLXRvcmVwbGFjZT1cIiR7aXRlbX1cIlxuICAgICAgICAgIGRhdGEtaW5kZXg9XCIke2luZGV4fVwiXG4gICAgICAgICAgZGF0YS1iZWdpbj1cIiR7YmVnaW59XCJcbiAgICAgICAgICBkYXRhLXRleHQ9XCIke3RleHR9XCJcbiAgICAgICAgICBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXdvcmQtdG8tcmVwbGFjZSBvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1yZXBsYWNlbWVudFwiXG4gICAgICAgICAgdGl0bGU9XCJDbGljayB0byBjb3JyZWN0IHlvdXIgc3BlbGxpbmdcIlxuICAgICAgICA+XG4gICAgICAgICAgJHtpdGVtfVxuICAgICAgICA8L3NwYW4+YDtcbiAgICB9KVxuICAgIC5qb2luKEpPSU5fQlkpO1xufTtcblxuY29uc3QgVUlIaW50cyA9IChhbGVydHM6IElEYXRhW10pOiBzdHJpbmcgPT4ge1xuICBpZiAoIWFsZXJ0cyB8fCAhYWxlcnRzLmxlbmd0aCkgcmV0dXJuICcnO1xuICByZXR1cm4gYWxlcnRzXG4gICAgLm1hcCgoY2FyZDogSURhdGEsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgaW1wYWN0LFxuICAgICAgICBoaWdobGlnaHRUZXh0LFxuICAgICAgICBtaW5pY2FyZFRpdGxlLFxuICAgICAgICBleHBsYW5hdGlvbixcbiAgICAgICAgY2FyZExheW91dCxcbiAgICAgICAgYmVnaW5cbiAgICAgIH0gPSBjYXJkO1xuICAgICAgcmV0dXJuIGBcbiAgICAgICAgICA8ZGl2IGRhdGEtYmVnaW49XCIke2JlZ2lufVwiIGlkPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaXRlbS0ke2luZGV4fVwiIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaXRlbSAke2ltcGFjdH1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1taW5pY2FyZFwiPlxuICAgICAgICAgICAgICA8ZGl2PiR7aGlnaGxpZ2h0VGV4dCB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICBtaW5pY2FyZFRpdGxlXG4gICAgICAgICAgICAgICAgICA/IGA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaXRlbS1zdWdnXCI+JHttaW5pY2FyZFRpdGxlfTwvZGl2PmBcbiAgICAgICAgICAgICAgICAgIDogJydcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtYXJyb3dzXCI+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjEwXCIgdmlld0JveD1cIjAgMCAxMCAxMFwiPjxwYXRoIGQ9XCJNNSA0LjNMLjg1LjE0Yy0uMi0uMi0uNS0uMi0uNyAwLS4yLjItLjIuNSAwIC43TDUgNS43IDkuODUuODdjLjItLjIuMi0uNSAwLS43LS4yLS4yLS41LS4yLS43IDBMNSA0LjI4elwiIHN0cm9rZT1cIm5vbmVcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAzKSByb3RhdGUoMClcIj48L3BhdGg+PC9zdmc+XG4gICAgICAgICAgICAgICAgPHN2ZyB3aWR0aD1cIjEwXCIgdmlld0JveD1cIjAgMCAxMCAxMFwiPjxwYXRoIGQ9XCJNNSA0LjNMLjg1LjE0Yy0uMi0uMi0uNS0uMi0uNyAwLS4yLjItLjIuNSAwIC43TDUgNS43IDkuODUuODdjLjItLjIuMi0uNSAwLS43LS4yLS4yLS41LS4yLS43IDBMNSA0LjI4elwiIHN0cm9rZT1cIm5vbmVcIiB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCAzKSByb3RhdGUoMClcIj48L3BhdGg+PC9zdmc+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtY2FyZFwiPlxuICAgICAgICAgICAgICA8ZGl2PiR7Y2FyZExheW91dC5ncm91cCB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWNhcmQtY29udGVudFwiPlxuICAgICAgICAgICAgICAgICR7cmVuZGVySGludHMoY2FyZCwgaW5kZXgpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj4ke2V4cGxhbmF0aW9uIHx8ICcnfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSlcbiAgICAuam9pbignJyk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVSUhpbnRzO1xuIiwiY29uc3QgVUlIaW50c0ZhbGxiYWNrID0gKCk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IGhpbnRzRmFsbGJhY2sgPSBgXG4gICAgPGRpdiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LWhpbnRzLWZhbGxiYWNrXCI+XG4gICAgICA8YnV0dG9uIGlkPVwicnVubmVyXCI+XG4gICAgICAgIFJ1biBvcnRob2dyYXBoeSBjaGVja1xuICAgICAgPC9idXR0b24+XG4gICAgICA8cD5BbHBoYSB2ZXJzaW9uPC9wPlxuICAgIDwvZGl2PlxuICBgO1xuXG4gIHJldHVybiBoaW50c0ZhbGxiYWNrO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVUlIaW50c0ZhbGxiYWNrO1xuIiwiY29uc3QgVUlMb2FkZXIgPSAoKTogc3RyaW5nID0+IHtcbiAgY29uc3QgbG9hZGVyID0gYFxuICAgIDxkaXYgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1sb2FkZXJcIj5cbiAgICAgIENoZWNraW5nLi4uXG4gICAgPC9kaXY+XG4gIGA7XG5cbiAgcmV0dXJuIGxvYWRlcjtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVJTG9hZGVyO1xuIiwiaW1wb3J0IFVJQ29udHJvbHMgZnJvbSAnLi9VSUNvbnRyb2xzJztcbmltcG9ydCBVSUhpbnRzIGZyb20gJy4vVUlIaW50cyc7XG5pbXBvcnQgeyBJQWxlcnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzJztcbmltcG9ydCBVSUhpbnRzRmFsbGJhY2sgZnJvbSAnLi9VSUhpbnRzRmFsbGJhY2snO1xuaW1wb3J0IFVJTG9hZGVyIGZyb20gJy4vVUlMb2FkZXInO1xuXG5jb25zdCBVSUJhciA9IChkYXRhOiBJQWxlcnQsIGxvYWRpbmc6IGJvb2xlYW4pOiBzdHJpbmcgPT4ge1xuICBjb25zdCBoYXNEYXRhID0gZGF0YSAmJiBkYXRhLmFsZXJ0cyAmJiBkYXRhLmFsZXJ0cy5sZW5ndGg7XG4gIGNvbnN0IGNvbnRyb2xzOiBzdHJpbmcgPSBVSUNvbnRyb2xzKCEhaGFzRGF0YSk7XG4gIGNvbnN0IGZhbGxiYWNrID0gbG9hZGluZyA/IFVJTG9hZGVyKCkgOiBVSUhpbnRzRmFsbGJhY2soKTtcbiAgY29uc3QgY2FyZHMgPSBoYXNEYXRhID8gVUlIaW50cyhkYXRhLmFsZXJ0cykgOiBmYWxsYmFjaztcbiAgcmV0dXJuIGAke2NvbnRyb2xzfSR7Y2FyZHN9YDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVJQmFyO1xuIiwiaW1wb3J0IHsgQXBwLCBFdmVudHMsIE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IE9ydGhvZ3JhcGh5U2V0dGluZ3MgfSBmcm9tICdzcmMvc2V0dGluZ3MnO1xuaW1wb3J0IHtcbiAgT19QT1BVUCxcbiAgT19QT1BVUF9ESVNBQkxFRCxcbiAgT19QT1BVUF9DT05UUk9MUyxcbiAgT19QT1BVUF9JVEVNLFxuICBPX1BPUFVQX1JFU0laRUQsXG4gIE9fUE9QVVBfSVRFTV9PUEVORUQsXG4gIE9fUE9QVVBfV09SRF9UT19SRVBMQUNFLFxuICBPX0hJR0hMSUdIVF9GT0NVU0VEXG59IGZyb20gJy4uL2Nzc0NsYXNzZXMnO1xuaW1wb3J0IHsgT19OT1RfT1BFTl9GSUxFIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcbmltcG9ydCB7IElBbGVydCB9IGZyb20gJy4uL2ludGVyZmFjZXMnO1xuXG5pbXBvcnQgVUlCYXIgZnJvbSAnLi9VSUVsZW1lbnRzL1VJQmFyJztcblxubGV0IHNlbGY6IGFueTtcblxuZXhwb3J0IGNsYXNzIE9ydGhvZ3JhcGh5UG9wdXAge1xuICBwcml2YXRlIGFwcDogQXBwO1xuICBwcml2YXRlIHNldHRpbmdzOiBPcnRob2dyYXBoeVNldHRpbmdzO1xuICBwcml2YXRlIGVtaXR0ZXI6IGFueTtcbiAgcHJpdmF0ZSBzaXplcjogYW55O1xuICBwcml2YXRlIG1vdmVyOiBhbnk7XG4gIHByaXZhdGUgY2xvc2VyOiBhbnk7XG4gIHByaXZhdGUgcmVsb2FkZXI6IGFueTtcbiAgcHJpdmF0ZSBydW5uZXI6IGFueTtcbiAgcHJpdmF0ZSBwb3B1cE9mZnNldDogbnVtYmVyW10gPSBbMCwgMF07XG4gIHByaXZhdGUgbW92ZXJTZWxlY3RlZCA9IGZhbHNlO1xuICBwcml2YXRlIGNyZWF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IE9ydGhvZ3JhcGh5U2V0dGluZ3MsIGVtaXR0ZXI6IEV2ZW50cykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLmVtaXR0ZXIgPSBlbWl0dGVyO1xuICB9XG5cbiAgcHVibGljIGluaXQoKTogdm9pZCB7XG4gICAgc2VsZiA9IHRoaXM7XG4gIH1cblxuICBwdWJsaWMgY3JlYXRlKCk6IHZvaWQge1xuICAgIHNlbGYuY3JlYXRlZCA9IHRydWU7XG4gICAgc2VsZi5wb3B1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNlbGYucG9wdXAuY2xhc3NMaXN0LmFkZChPX1BPUFVQKTtcbiAgICBzZWxmLnBvcHVwLmlkID0gT19QT1BVUDtcbiAgICBjb25zdCBiYXIgPSBVSUJhcihudWxsLCBmYWxzZSk7XG4gICAgc2VsZi5wb3B1cC5pbm5lckhUTUwgPSBiYXI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzZWxmLnBvcHVwKTtcbiAgICBzZWxmLnNldExpc3RlbmVycygpO1xuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgc2VsZi5jcmVhdGVkID0gZmFsc2U7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICBjb25zdCBwb3B1cCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKE9fUE9QVVApO1xuICAgIGlmIChwb3B1cCkgcG9wdXAucmVtb3ZlKCk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlKGRhdGE6IElBbGVydCwgbG9hZGluZz86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVycygpO1xuICAgIGNvbnN0IGJhciA9IFVJQmFyKGRhdGEsIGxvYWRpbmcpO1xuICAgIHNlbGYucG9wdXAuaW5uZXJIVE1MID0gYmFyO1xuICAgIHNlbGYuc2V0TGlzdGVuZXJzKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0TG9hZGVyKCk6IHZvaWQge1xuICAgIHRoaXMudXBkYXRlKG51bGwsIHRydWUpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxvYWRlcigpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZShudWxsLCBmYWxzZSk7XG4gIH1cblxuICBwdWJsaWMgZGlzYWJsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBoaW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCMke09fUE9QVVB9YCk7XG4gICAgaWYgKGhpbnRzKSB7XG4gICAgICBoaW50cy5jbGFzc0xpc3QuYWRkKE9fUE9QVVBfRElTQUJMRUQpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBlbmFibGUoKTogdm9pZCB7XG4gICAgY29uc3QgaGludHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtPX1BPUFVQfWApO1xuICAgIGlmIChoaW50cykge1xuICAgICAgaGludHMuY2xhc3NMaXN0LnJlbW92ZShPX1BPUFVQX0RJU0FCTEVEKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldExpc3RlbmVycygpIHtcbiAgICBjb25zdCBtaW5pY2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX1BPUFVQX0lURU19YCk7XG4gICAgbWluaWNhcmRzLmZvckVhY2goKG1jKSA9PiBtYy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25DbGlja0J5SGludCkpO1xuICAgIG1pbmljYXJkcy5mb3JFYWNoKChtYykgPT5cbiAgICAgIG1jLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHNlbGYub25Gb2N1c1dvcmQpXG4gICAgKTtcbiAgICBtaW5pY2FyZHMuZm9yRWFjaCgobWMpID0+XG4gICAgICBtYy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIHNlbGYub25SZW1vdmVGb2N1c1dvcmQpXG4gICAgKTtcbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgYC4ke09fUE9QVVBfV09SRF9UT19SRVBMQUNFfWBcbiAgICApO1xuICAgIHJlcGxhY2VtZW50cy5mb3JFYWNoKChycCkgPT5cbiAgICAgIHJwLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJlcGxhY2VXb3JkKVxuICAgICk7XG4gICAgc2VsZi5yZWxvYWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWxvYWRlcicpO1xuICAgIGlmIChzZWxmLnJlbG9hZGVyKSB7XG4gICAgICBzZWxmLnJlbG9hZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJ1bik7XG4gICAgfVxuICAgIHNlbGYucnVubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3J1bm5lcicpO1xuICAgIGlmIChzZWxmLnJ1bm5lcikge1xuICAgICAgc2VsZi5ydW5uZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uUnVuKTtcbiAgICB9XG4gICAgc2VsZi5zaXplciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXplcicpO1xuICAgIGlmIChzZWxmLnNpemVyKSB7XG4gICAgICBzZWxmLnNpemVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJlc2l6ZSk7XG4gICAgfVxuICAgIHNlbGYuY2xvc2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Nsb3NlcicpO1xuICAgIGlmIChzZWxmLmNsb3Nlcikge1xuICAgICAgc2VsZi5jbG9zZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uQ2xvc2UpO1xuICAgIH1cbiAgICBzZWxmLm1vdmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7T19QT1BVUF9DT05UUk9MU31gKTtcbiAgICBpZiAoc2VsZi5tb3Zlcikge1xuICAgICAgc2VsZi5tb3Zlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBzZWxmLm1vdmVySXNEb3duKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHNlbGYub25Nb3VzZVVwKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBzZWxmLm9uTW91c2VNb3ZlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIGNvbnN0IG1pbmljYXJkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fUE9QVVBfSVRFTX1gKTtcbiAgICBtaW5pY2FyZHMuZm9yRWFjaCgobWMpID0+XG4gICAgICBtYy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25DbGlja0J5SGludClcbiAgICApO1xuICAgIG1pbmljYXJkcy5mb3JFYWNoKChtYykgPT5cbiAgICAgIG1jLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHNlbGYub25Gb2N1c1dvcmQpXG4gICAgKTtcbiAgICBtaW5pY2FyZHMuZm9yRWFjaCgobWMpID0+XG4gICAgICBtYy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIHNlbGYub25SZW1vdmVGb2N1c1dvcmQpXG4gICAgKTtcbiAgICBjb25zdCByZXBsYWNlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgYC4ke09fUE9QVVBfV09SRF9UT19SRVBMQUNFfWBcbiAgICApO1xuICAgIHJlcGxhY2VtZW50cy5mb3JFYWNoKChycCkgPT5cbiAgICAgIHJwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJlcGxhY2VXb3JkKVxuICAgICk7XG4gICAgaWYgKHNlbGYucmVsb2FkZXIpIHNlbGYucmVsb2FkZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uUnVuKTtcbiAgICBpZiAoc2VsZi5ydW5uZXIpIHNlbGYucnVubmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJ1bik7XG4gICAgaWYgKHNlbGYuc2l6ZXIpIHNlbGYuc2l6ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uUmVzaXplKTtcbiAgICBpZiAoc2VsZi5jbG9zZXIpIHNlbGYuY2xvc2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vbkNsb3NlKTtcbiAgICBpZiAoc2VsZi5tb3ZlcilcbiAgICAgIHNlbGYubW92ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgc2VsZi5tb3ZlcklzRG93bik7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHNlbGYub25Nb3VzZVVwKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBzZWxmLm9uTW91c2VNb3ZlKTtcbiAgfVxuXG4gIHByaXZhdGUgb25DbGlja0J5SGludChlOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvcGVuZWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX1BPUFVQX0lURU1fT1BFTkVEfWApO1xuICAgIG9wZW5lZC5mb3JFYWNoKChvKSA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoT19QT1BVUF9JVEVNX09QRU5FRCkpO1xuICAgIGlmIChlLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKE9fUE9QVVBfSVRFTV9PUEVORUQpKSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShPX1BPUFVQX0lURU1fT1BFTkVEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZS5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoT19QT1BVUF9JVEVNX09QRU5FRCk7XG4gICAgfVxuXG4gICAgY29uc3QgYmVnaW4gPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5iZWdpbjtcbiAgICBpZiAoYmVnaW4pIHtcbiAgICAgIHNlbGYuc2Nyb2xsVG9Xb3JkKGJlZ2luKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1vdmVySXNEb3duKGU6IGFueSkge1xuICAgIHNlbGYubW92ZXJTZWxlY3RlZCA9IHRydWU7XG4gICAgc2VsZi5wb3B1cE9mZnNldCA9IFtcbiAgICAgIHNlbGYucG9wdXAub2Zmc2V0TGVmdCAtIGUuY2xpZW50WCxcbiAgICAgIHNlbGYucG9wdXAub2Zmc2V0VG9wIC0gZS5jbGllbnRZXG4gICAgXTtcbiAgfVxuXG4gIHByaXZhdGUgb25Nb3VzZVVwKCkge1xuICAgIHNlbGYubW92ZXJTZWxlY3RlZCA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBvbk1vdXNlTW92ZShlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKHNlbGYubW92ZXJTZWxlY3RlZCkge1xuICAgICAgY29uc3QgbW91c2VQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogZS5jbGllbnRYLFxuICAgICAgICB5OiBlLmNsaWVudFlcbiAgICAgIH07XG4gICAgICBzZWxmLnBvcHVwLnN0eWxlLmxlZnQgPSBgJHttb3VzZVBvc2l0aW9uLnggKyBzZWxmLnBvcHVwT2Zmc2V0WzBdfXB4YDtcbiAgICAgIHNlbGYucG9wdXAuc3R5bGUudG9wID0gYCR7bW91c2VQb3NpdGlvbi55ICsgc2VsZi5wb3B1cE9mZnNldFsxXX1weGA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblJlc2l6ZSgpIHtcbiAgICBpZiAoc2VsZi5wb3B1cC5jbGFzc05hbWUuY29udGFpbnMoT19QT1BVUF9SRVNJWkVEKSkge1xuICAgICAgc2VsZi5wb3B1cC5jbGFzc0xpc3QucmVtb3ZlKE9fUE9QVVBfUkVTSVpFRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYucG9wdXAuY2xhc3NMaXN0LmFkZChPX1BPUFVQX1JFU0laRUQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25DbG9zZSgpIHtcbiAgICBzZWxmLmVtaXR0ZXIudHJpZ2dlcignb3J0aG9ncmFwaHk6Y2xvc2UnKTtcbiAgfVxuXG4gIHByaXZhdGUgb25Gb2N1c1dvcmQoZTogYW55KSB7XG4gICAgY29uc3QgYmVnaW4gPSBlLmN1cnJlbnRUYXJnZXQuZGF0YXNldC5iZWdpbjtcbiAgICBjb25zdCB3b3JkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2JlZ2luPVwiJHtiZWdpbn1cIl1gKTtcbiAgICBpZiAod29yZCkge1xuICAgICAgd29yZC5jbGFzc0xpc3QuYWRkKE9fSElHSExJR0hUX0ZPQ1VTRUQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25SZW1vdmVGb2N1c1dvcmQoKSB7XG4gICAgY29uc3Qgd29yZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX0hJR0hMSUdIVF9GT0NVU0VEfWApO1xuICAgIHdvcmRzLmZvckVhY2goKHcpID0+IHcuY2xhc3NMaXN0LnJlbW92ZShPX0hJR0hMSUdIVF9GT0NVU0VEKSk7XG4gIH1cblxuICBwcml2YXRlIG9uUnVuKCkge1xuICAgIHNlbGYuZW1pdHRlci50cmlnZ2VyKCdvcnRob2dyYXBoeTpydW4nKTtcbiAgfVxuXG4gIHByaXZhdGUgb25SZXBsYWNlV29yZChldmVudDogYW55KSB7XG4gICAgc2VsZi5lbWl0dGVyLnRyaWdnZXIoJ29ydGhvZ3JhcGh5OnJlcGxhY2UnLCBldmVudCk7XG4gICAgY29uc3QgeyBpbmRleCB9ID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0O1xuICAgIGNvbnN0IHNlbGVjdGVkSXRlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke09fUE9QVVBfSVRFTX0tJHtpbmRleH1gKTtcbiAgICBpZiAoc2VsZWN0ZWRJdGVtKSBzZWxlY3RlZEl0ZW0ucmVtb3ZlKCk7XG4gICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX1BPUFVQX0lURU19YCkubGVuZ3RoKSB7XG4gICAgICBzZWxmLnJlbW92ZUxvYWRlcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25PcGVuQ2FyZChldmVudDogYW55KSB7XG4gICAgY29uc3QgeyB2YWx1ZTogYmVnaW4gfSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuYXR0cmlidXRlcy5iZWdpbjtcbiAgICBjb25zdCBwb3B1cDogYW55ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7T19QT1BVUH1gKTtcbiAgICBjb25zdCBvcGVuZWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX1BPUFVQX0lURU1fT1BFTkVEfWApO1xuICAgIG9wZW5lZC5mb3JFYWNoKChvKSA9PiBvLmNsYXNzTGlzdC5yZW1vdmUoT19QT1BVUF9JVEVNX09QRU5FRCkpO1xuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1iZWdpbj1cIiR7YmVnaW59XCJdYCk7XG4gICAgc2VsZWN0ZWQuY2xhc3NMaXN0LmFkZChPX1BPUFVQX0lURU1fT1BFTkVEKTtcbiAgICBwb3B1cC5zY3JvbGxUb3AgPSBzZWxlY3RlZC5vZmZzZXRUb3A7XG4gIH1cblxuICBwcml2YXRlIHNjcm9sbFRvV29yZChiZWdpbjogbnVtYmVyKSB7XG4gICAgY29uc3QgYWN0aXZlRWRpdG9yID0gc2VsZi5nZXRFZGl0b3IoKTtcbiAgICBpZiAoYWN0aXZlRWRpdG9yKSB7XG4gICAgICBjb25zdCBzY3JvbGxlciA9IGFjdGl2ZUVkaXRvci5nZXRTY3JvbGxlckVsZW1lbnQoKTtcbiAgICAgIHNjcm9sbGVyLnNjcm9sbFRvcCA9ICtiZWdpbiAtIDMwMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5vbkNsb3NlKCk7XG4gICAgICBuZXcgTm90aWNlKE9fTk9UX09QRU5fRklMRSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3IoKSB7XG4gICAgY29uc3QgYWN0aXZlTGVhZjogYW55ID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWY7XG4gICAgY29uc3Qgc291cmNlTW9kZSA9IGFjdGl2ZUxlYWYudmlldy5zb3VyY2VNb2RlO1xuICAgIGlmICghc291cmNlTW9kZSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGFjdGl2ZUxlYWYudmlldy5zb3VyY2VNb2RlLmNtRWRpdG9yO1xuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudHMsIE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB0eXBlIHsgQXBwIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgT3J0aG9ncmFwaHlTZXR0aW5ncyB9IGZyb20gJy4uL3NldHRpbmdzJztcbmltcG9ydCB7XG4gIE9fUlVOTkVSX0lDT04sXG4gIE9fUlVOTkVSX0lDT05fQ0xFQVIsXG4gIE9fTk9UX09QRU5fRklMRVxufSBmcm9tICcuLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgT19SVU5ORVIsIE9fUlVOTkVSX0hJRERFTiwgT19SVU5ORVJfTE9BRElORyB9IGZyb20gJy4uL2Nzc0NsYXNzZXMnO1xuXG5pbnRlcmZhY2UgSU9ydGhvZ3JhcGh5VG9nZ2xlciB7XG4gIGluaXQoKTogdm9pZDtcbn1cblxubGV0IHNlbGY6IGFueTtcblxuZXhwb3J0IGNsYXNzIE9ydGhvZ3JhcGh5VG9nZ2xlciBpbXBsZW1lbnRzIElPcnRob2dyYXBoeVRvZ2dsZXIge1xuICBwcml2YXRlIGFwcDogQXBwO1xuICBwcml2YXRlIHNldHRpbmdzOiBPcnRob2dyYXBoeVNldHRpbmdzO1xuICBwcml2YXRlIGVtaXR0ZXI6IGFueTtcbiAgcHJpdmF0ZSB0b2dnbGVyOiBhbnk7XG4gIHByaXZhdGUgc2hvd2VkOiBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IE9ydGhvZ3JhcGh5U2V0dGluZ3MsIGVtaXR0ZXI6IEV2ZW50cykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLmVtaXR0ZXIgPSBlbWl0dGVyO1xuICB9XG5cbiAgcHVibGljIGluaXQoKTogdm9pZCB7XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5jcmVhdGVCdXR0b24oT19SVU5ORVJfSUNPTik7XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbW92ZUxvYWRpbmcoKTtcbiAgICB0aGlzLnRvZ2dsZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZSk7XG4gICAgdGhpcy5yZW1vdmVCdXR0b24oKTtcbiAgfVxuXG4gIHB1YmxpYyB0b2dnbGUoKTogdm9pZCB7XG4gICAgY29uc3QgYWN0aXZlRWRpdG9yID0gc2VsZi5nZXRFZGl0b3IoKTtcbiAgICBpZiAoIWFjdGl2ZUVkaXRvcikge1xuICAgICAgaWYgKHNlbGYuc2hvd2VkKSB7XG4gICAgICAgIHNlbGYuc2V0QnV0dG9uV2l0aFJ1bm5lcigpO1xuICAgICAgICBzZWxmLnNob3dlZCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3IE5vdGljZShPX05PVF9PUEVOX0ZJTEUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZWxmLnNob3dlZCA9ICFzZWxmLnNob3dlZDtcbiAgICBpZiAoc2VsZi5zaG93ZWQpIHtcbiAgICAgIHNlbGYuc2V0QnV0dG9uV2l0aENsZWFyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuc2V0QnV0dG9uV2l0aFJ1bm5lcigpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xuICAgIGNvbnN0IHJ1bm5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy4nICsgT19SVU5ORVIpO1xuICAgIHJ1bm5lci5jbGFzc0xpc3QuYWRkKE9fUlVOTkVSX0hJRERFTik7XG4gIH1cblxuICBwdWJsaWMgc2V0TG9hZGluZygpOiB2b2lkIHtcbiAgICB0aGlzLnRvZ2dsZXIuY2xhc3NMaXN0LmFkZChPX1JVTk5FUl9MT0FESU5HKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMb2FkaW5nKCk6IHZvaWQge1xuICAgIHRoaXMudG9nZ2xlci5jbGFzc0xpc3QucmVtb3ZlKE9fUlVOTkVSX0xPQURJTkcpO1xuICB9XG5cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuc2hvd2VkID0gZmFsc2U7XG4gICAgdGhpcy5yZW1vdmVMb2FkaW5nKCk7XG4gICAgdGhpcy51cGRhdGVCdXR0b25UZXh0KE9fUlVOTkVSX0lDT04pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVCdXR0b24odGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy50b2dnbGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBpY29uLmlubmVyVGV4dCA9IHRleHQ7XG4gICAgdGhpcy50b2dnbGVyLmNsYXNzTGlzdC5hZGQoT19SVU5ORVIpO1xuICAgIHRoaXMudG9nZ2xlci5hcHBlbmRDaGlsZChpY29uKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMudG9nZ2xlcik7XG4gICAgdGhpcy50b2dnbGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVCdXR0b25UZXh0KHRleHQ6IHN0cmluZykge1xuICAgIGNvbnN0IHRvZ2dsZXI6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLiR7T19SVU5ORVJ9IHNwYW5gKTtcbiAgICBpZiAodG9nZ2xlcikgdG9nZ2xlci5pbm5lclRleHQgPSB0ZXh0O1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVCdXR0b24oKSB7XG4gICAgY29uc3QgdG9nZ2xlcjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtPX1JVTk5FUn1gKTtcbiAgICBpZiAodG9nZ2xlcikgdG9nZ2xlci5yZW1vdmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0QnV0dG9uV2l0aENsZWFyKCkge1xuICAgIHNlbGYudXBkYXRlQnV0dG9uVGV4dChPX1JVTk5FUl9JQ09OX0NMRUFSKTtcbiAgICBzZWxmLmVtaXR0ZXIudHJpZ2dlcignb3J0aG9ncmFwaHk6b3BlbicpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25XaXRoUnVubmVyKCkge1xuICAgIHNlbGYudXBkYXRlQnV0dG9uVGV4dChPX1JVTk5FUl9JQ09OKTtcbiAgICBzZWxmLnJlbW92ZUxvYWRpbmcoKTtcbiAgICBzZWxmLmVtaXR0ZXIudHJpZ2dlcignb3J0aG9ncmFwaHk6Y2xvc2UnKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RWRpdG9yKCkge1xuICAgIGNvbnN0IGFjdGl2ZUxlYWY6IGFueSA9IHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmO1xuICAgIGNvbnN0IHNvdXJjZU1vZGUgPSBhY3RpdmVMZWFmLnZpZXcuc291cmNlTW9kZTtcbiAgICBpZiAoIXNvdXJjZU1vZGUpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBhY3RpdmVMZWFmLnZpZXcuc291cmNlTW9kZS5jbUVkaXRvcjtcbiAgfVxufVxuIiwiaW1wb3J0IHsgT3J0aG9ncmFwaHlTZXR0aW5ncyB9IGZyb20gJy4uL3NldHRpbmdzJztcbmltcG9ydCB0eXBlIHsgQXBwIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgT19ISUdITElHSFQgfSBmcm9tICcuLi9jc3NDbGFzc2VzJztcbmltcG9ydCB7IElPcmlnaW5hbFdvcmQsIElEYXRhLCBJRWRpdG9yIH0gZnJvbSAnc3JjL2ludGVyZmFjZXMnO1xuXG5pbnRlcmZhY2UgSU9ydGhvZ3JhcGh5RWRpdG9yIHtcbiAgaW5pdCgpOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgSUdldENvbFJvd1Jlc3VsdCB7XG4gIGNvbDogbnVtYmVyO1xuICByb3c6IG51bWJlcjtcbn1cblxubGV0IHNlbGY6IGFueTtcblxuZXhwb3J0IGNsYXNzIE9ydGhvZ3JhcGh5RWRpdG9yIGltcGxlbWVudHMgSU9ydGhvZ3JhcGh5RWRpdG9yIHtcbiAgcHJpdmF0ZSBhcHA6IEFwcDtcbiAgcHJpdmF0ZSBzZXR0aW5nczogT3J0aG9ncmFwaHlTZXR0aW5ncztcbiAgcHJpdmF0ZSBoaWdobGlnaHRlZFdvcmRzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBPcnRob2dyYXBoeVNldHRpbmdzKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICB9XG5cbiAgcHVibGljIGluaXQoKTogdm9pZCB7XG4gICAgc2VsZiA9IHRoaXM7XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBzZWxmLmNsZWFySGlnaGxpZ2h0V29yZHMoKTtcbiAgfVxuXG4gIHB1YmxpYyBoaWdobGlnaHRXb3JkcyhlZGl0b3I6IElFZGl0b3IsIGFsZXJ0czogSURhdGFbXSk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJIaWdobGlnaHRXb3JkcygpO1xuXG4gICAgaWYgKCFlZGl0b3IgfHwgIWFsZXJ0cyB8fCBhbGVydHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBhbGVydHMuZm9yRWFjaCgoYWxlcnQ6IGFueSkgPT4ge1xuICAgICAgY29uc3QgdGV4dExlbmd0aCA9IGFsZXJ0LnRleHQubGVuZ3RoIHx8IGFsZXJ0LmhpZ2hsaWdodFRleHQubGVuZ3RoO1xuICAgICAgY29uc3Qgb3JpZ2luYWxXb3JkID0ge1xuICAgICAgICBiZWdpbjogYWxlcnQuYmVnaW4sXG4gICAgICAgIGVuZDogYWxlcnQuZW5kLFxuICAgICAgICBsZW46IHRleHRMZW5ndGhcbiAgICAgIH07XG4gICAgICB0aGlzLmhpZ2hsaWdodFdvcmQoZWRpdG9yLCBvcmlnaW5hbFdvcmQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBoaWdobGlnaHRXb3JkKFxuICAgIGVkaXRvcjogSUVkaXRvcixcbiAgICBvcmlnaW5hbFdvcmQ6IHsgYmVnaW46IG51bWJlcjsgZW5kOiBudW1iZXI7IGxlbjogbnVtYmVyIH1cbiAgKTogdm9pZCB7XG4gICAgaWYgKCFlZGl0b3IgfHwgIW9yaWdpbmFsV29yZCkgcmV0dXJuO1xuICAgIGNvbnN0IGNvbFJvdyA9IHRoaXMuZ2V0Q29sUm93KGVkaXRvciwgb3JpZ2luYWxXb3JkKTtcbiAgICBpZiAoIWNvbFJvdykgcmV0dXJuO1xuICAgIGNvbnN0IHsgY29sLCByb3cgfSA9IGNvbFJvdztcblxuICAgIHRoaXMuaGlnaGxpZ2h0ZWRXb3JkcyA9IGVkaXRvci5tYXJrVGV4dChcbiAgICAgIHsgbGluZTogcm93LCBjaDogY29sIH0sXG4gICAgICB7IGxpbmU6IHJvdywgY2g6IGNvbCArIG9yaWdpbmFsV29yZC5sZW4gfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiBPX0hJR0hMSUdIVCxcbiAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgIGJlZ2luOiBvcmlnaW5hbFdvcmQuYmVnaW4sXG4gICAgICAgICAgZW5kOiBvcmlnaW5hbFdvcmQuZW5kLFxuICAgICAgICAgIGxlbjogb3JpZ2luYWxXb3JkLmxlblxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyByZXBsYWNlV29yZChcbiAgICBlZGl0b3I6IElFZGl0b3IsXG4gICAgb3JpZ2luYWxXb3JkOiBJT3JpZ2luYWxXb3JkLFxuICAgIG5ld1dvcmQ6IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBpZiAoIWVkaXRvciB8fCAhb3JpZ2luYWxXb3JkIHx8ICFuZXdXb3JkKSByZXR1cm47XG4gICAgY29uc3QgY29sUm93ID0gdGhpcy5nZXRDb2xSb3coZWRpdG9yLCBvcmlnaW5hbFdvcmQpO1xuICAgIGlmICghY29sUm93KSByZXR1cm47XG4gICAgY29uc3QgeyBjb2wsIHJvdyB9ID0gY29sUm93O1xuXG4gICAgY29uc3QgZG9jID0gZWRpdG9yLmdldERvYygpO1xuXG4gICAgY29uc3QgZnJvbSA9IHtcbiAgICAgIGxpbmU6IHJvdyxcbiAgICAgIGNoOiBjb2xcbiAgICB9O1xuICAgIGNvbnN0IHRvID0ge1xuICAgICAgbGluZTogcm93LFxuICAgICAgY2g6IGNvbCArIG9yaWdpbmFsV29yZC5sZW5cbiAgICB9O1xuXG4gICAgZG9jLnJlcGxhY2VSYW5nZShuZXdXb3JkLCBmcm9tLCB0byk7XG4gIH1cblxuICBnZXRDb2xSb3coZWRpdG9yOiBJRWRpdG9yLCBvcmlnaW5hbFdvcmQ6IElPcmlnaW5hbFdvcmQpOiBJR2V0Q29sUm93UmVzdWx0IHtcbiAgICBpZiAoIWVkaXRvciB8fCAhb3JpZ2luYWxXb3JkKSByZXR1cm47XG5cbiAgICBsZXQgdHRsID0gMDtcbiAgICBsZXQgcm93ID0gMDtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGNvbnN0IHsgYmVnaW4gfSA9IG9yaWdpbmFsV29yZDtcblxuICAgIGlmICghZWRpdG9yLmVhY2hMaW5lKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgZWRpdG9yLmVhY2hMaW5lKChsaW5lOiB7IHRleHQ6IHN0cmluZyB9KSA9PiB7XG4gICAgICBjb25zdCBzID0gdHRsID09PSAwID8gdHRsIDogdHRsICsgMTtcbiAgICAgIGNvbnN0IGxpbmVUZXh0TGVuZ3RoID0gbGluZS50ZXh0Lmxlbmd0aDtcbiAgICAgIHR0bCArPSBsaW5lVGV4dExlbmd0aDtcblxuICAgICAgaWYgKHJvdyA+IDApIHtcbiAgICAgICAgdHRsKys7XG4gICAgICB9XG4gICAgICBpZiAoYmVnaW4gPj0gcyAmJiBiZWdpbiA8PSB0dGwpIHtcbiAgICAgICAgY29uc3QgZGlmZiA9IHR0bCAtIGxpbmVUZXh0TGVuZ3RoO1xuICAgICAgICBjb25zdCBjb2wgPSBiZWdpbiAtIGRpZmY7XG4gICAgICAgIHJlc3VsdCA9IHsgY29sLCByb3cgfTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcm93Kys7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJIaWdobGlnaHRXb3JkcygpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIHNlbGYuaGlnaGxpZ2h0ZWRXb3JkcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHNlbGYuaGlnaGxpZ2h0ZWRXb3Jkcy5jbGVhcigpO1xuICAgIH1cbiAgICBjb25zdCBoaWdobGlnaHRXb3JkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fSElHSExJR0hUfWApO1xuICAgIGhpZ2hsaWdodFdvcmRzLmZvckVhY2goKHNwYW4pID0+IHtcbiAgICAgIHNwYW4ucmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbnRlcmZhY2UgRGVib3VuY2VDYWxsYmFjayB7XG4gIGFwcGx5OiAoY3R4OiBhbnksIGFyZ3M6IGFueSkgPT4gdm9pZDtcbn1cblxuY29uc3QgZGVib3VuY2UgPSAoY2FsbGJhY2s6IERlYm91bmNlQ2FsbGJhY2ssIHRpbWVvdXQ6IG51bWJlcik6IGFueSA9PiB7XG4gIGxldCB0aW1lcjogYW55O1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSwgdGltZW91dCk7XG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWJvdW5jZTtcbiIsImltcG9ydCB7IElEYXRhIH0gZnJvbSAnc3JjL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgY29uc3Qgc29ydEFsZXJ0cyA9IChhbGVydHM6IElEYXRhW10pOiBhbnkgPT4ge1xuICByZXR1cm4gYWxlcnRzLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBhLmJlZ2luIC0gYi5iZWdpbik7XG59O1xuXG5leHBvcnQgY29uc3QgZm9ybWF0QWxlcnRzID0gKGFsZXJ0czogSURhdGFbXSk6IGFueSA9PiB7XG4gIGNvbnN0IHdpdGhvdXRIaWRkZW4gPSBhbGVydHMuZmlsdGVyKChhbGVydDogYW55KSA9PiBhbGVydC5oaWRkZW4gIT09IHRydWUpO1xuICBjb25zdCB3aXRob3V0RHVwbGljYXRlID0gd2l0aG91dEhpZGRlbi5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgIGNvbnN0IHggPSBhY2MuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLmV4cGxhbmF0aW9uID09PSBjdXJyZW50LmV4cGxhbmF0aW9uKTtcbiAgICBpZiAoIXgpIHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KFtjdXJyZW50XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfVxuICB9LCBbXSk7XG4gIHJldHVybiB3aXRob3V0RHVwbGljYXRlO1xufTtcbiIsImV4cG9ydCBjb25zdCBBUElfVVJMX1NQRUxMRVIgPVxuICAnaHR0cHM6Ly9zcGVsbGVyLnlhbmRleC5uZXQvc2VydmljZXMvc3BlbGxzZXJ2aWNlLmpzb24vY2hlY2tUZXh0JztcbmV4cG9ydCBjb25zdCBBUElfVVJMX0dSQU1NQVIgPVxuICAnaHR0cHM6Ly9vYnNpZGlhbi1vcnRob2dyYXBoeS1hcGktbXo4bDY0dHozLWRlbmlzb2VkLnZlcmNlbC5hcHAvY2hlY2snO1xuIiwiaW1wb3J0IHsgUGx1Z2luLCBFdmVudHMsIE5vdGljZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IE9ydGhvZ3JhcGh5U2V0dGluZ3MgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7XG4gIE9ydGhvZ3JhcGh5RWRpdG9yLFxuICBPcnRob2dyYXBoeVBvcHVwLFxuICBPcnRob2dyYXBoeVRvZ2dsZXJcbn0gZnJvbSAnLi9vcnRob2dyYXBoeSc7XG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnLi9vcnRob2dyYXBoeS9oZWxwZXJzL2RlYm91bmNlJztcbmltcG9ydCB7IHNvcnRBbGVydHMsIGZvcm1hdEFsZXJ0cyB9IGZyb20gJy4vb3J0aG9ncmFwaHkvaGVscGVycy9mb3JtYXR0ZXJzJztcbmltcG9ydCB7IEFQSV9VUkxfR1JBTU1BUiB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IE9fTk9UX09QRU5fRklMRSwgT19TRVJWRVJfRVJST1IsIE9fTk9fRVJST1IgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbi8vIFVzZSBzZWxmIGluIGV2ZW50cyBjYWxsYmFja3NcbmxldCBzZWxmOiBhbnk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ydGhvZ3JhcGh5UGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHJpdmF0ZSBzZXR0aW5nczogT3J0aG9ncmFwaHlTZXR0aW5ncztcbiAgcHJpdmF0ZSBwb3B1cDogYW55O1xuICBwcml2YXRlIHRvZ2dsZXI6IGFueTtcbiAgcHJpdmF0ZSBlZGl0b3I6IGFueTtcbiAgcHJpdmF0ZSBlbWl0dGVyOiBhbnk7XG4gIHByaXZhdGUgYWN0aXZlRWRpdG9yOiBhbnk7XG4gIHByaXZhdGUgYWJvcnRlcjogYW55O1xuICBwcml2YXRlIGhpbnRzOiBhbnk7XG4gIHByaXZhdGUgZGVib3VuY2VHZXREYXRhRnVuYyA9IGRlYm91bmNlKHRoaXMub25DaGFuZ2VUZXh0LmJpbmQodGhpcyksIDUwMCk7XG4gIHByaXZhdGUgZ2V0RGF0YUZ1bmMgPSBkZWJvdW5jZSh0aGlzLm9uUnVuRnJvbVBvcHVwLmJpbmQodGhpcyksIDApO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyAtLS0tLS0gSW5pdCAtLS0tLS0tLSAvL1xuICAgIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFdmVudHMoKTtcblxuICAgIGNvbnN0IHNldHRpbmdzID0gbmV3IE9ydGhvZ3JhcGh5U2V0dGluZ3ModGhpcywgdGhpcy5lbWl0dGVyKTtcbiAgICBhd2FpdCBzZXR0aW5ncy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICAvLyB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE9ydGhvZ3JhcGh5U2V0dGluZ1RhYih0aGlzLmFwcCwgc2V0dGluZ3MsIHRoaXMpKTtcblxuICAgIHRoaXMuaW5pdE9ydGhvZ3JhcGh5VG9nZ2xlcigpO1xuICAgIHRoaXMuaW5pdE9ydGhvZ3JhcGh5UG9wdXAoKTtcbiAgICB0aGlzLmluaXRPcnRob2dyYXBoeUVkaXRvcigpO1xuXG4gICAgLy8gLS0tLS0tLSBFdmVudHMgLS0tLS0tLS0gLy9cbiAgICB0aGlzLmVtaXR0ZXIub24oJ29ydGhvZ3JhcGh5Om9wZW4nLCB0aGlzLm9uUG9wdXBPcGVuKTtcbiAgICB0aGlzLmVtaXR0ZXIub24oJ29ydGhvZ3JhcGh5OmNsb3NlJywgdGhpcy5vblBvcHVwQ2xvc2UpO1xuICAgIHRoaXMuZW1pdHRlci5vbignb3J0aG9ncmFwaHk6cnVuJywgdGhpcy5nZXREYXRhRnVuYyk7XG4gICAgdGhpcy5lbWl0dGVyLm9uKCdvcnRob2dyYXBoeTpyZXBsYWNlJywgdGhpcy5vblJlcGxhY2VXb3JkKTtcblxuICAgIC8vIE5PVEU6IGZpbmQgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXNcbiAgICAvLyBMaXN0ZW4gdG8gY2hhbmdlcyBpbiB0aGUgZWRpdG9yXG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KGRvY3VtZW50LCAnY2xpY2snLCAoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuYWN0aXZlRWRpdG9yKSByZXR1cm47XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvci5vZmYoJ2NoYW5nZScsIHRoaXMuZGVib3VuY2VHZXREYXRhRnVuYyk7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IHRoaXMuZ2V0RWRpdG9yKCk7XG4gICAgICBpZiAoIXRoaXMuYWN0aXZlRWRpdG9yKSByZXR1cm47XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvci5vbignY2hhbmdlJywgdGhpcy5kZWJvdW5jZUdldERhdGFGdW5jKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuZW1pdHRlci5vZmYoJ29ydGhvZ3JhcGh5Om9wZW4nLCB0aGlzLm9uUG9wdXBPcGVuKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpjbG9zZScsIHRoaXMub25Qb3B1cENsb3NlKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpydW4nLCB0aGlzLm9uUnVuRnJvbVBvcHVwKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpyZXBsYWNlJywgdGhpcy5vblJlcGxhY2VXb3JkKTtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpXG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvci5vZmYoJ2NoYW5nZScsIHRoaXMuZGVib3VuY2VHZXREYXRhRnVuYyk7XG4gICAgdGhpcy50b2dnbGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLnBvcHVwLmRlc3Ryb3koKTtcbiAgICB0aGlzLmVkaXRvci5kZXN0cm95KCk7XG4gICAgdGhpcy5oaW50cyA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0T3J0aG9ncmFwaHlUb2dnbGVyKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgYXBwLCBzZXR0aW5ncywgZW1pdHRlciB9ID0gdGhpcztcbiAgICB0aGlzLnRvZ2dsZXIgPSBuZXcgT3J0aG9ncmFwaHlUb2dnbGVyKGFwcCwgc2V0dGluZ3MsIGVtaXR0ZXIpO1xuICAgIHRoaXMudG9nZ2xlci5pbml0KCk7XG4gIH1cblxuICBwcml2YXRlIGluaXRPcnRob2dyYXBoeVBvcHVwKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgYXBwLCBzZXR0aW5ncywgZW1pdHRlciB9ID0gdGhpcztcbiAgICB0aGlzLnBvcHVwID0gbmV3IE9ydGhvZ3JhcGh5UG9wdXAoYXBwLCBzZXR0aW5ncywgZW1pdHRlcik7XG4gICAgdGhpcy5wb3B1cC5pbml0KCk7XG4gIH1cblxuICBwcml2YXRlIGluaXRPcnRob2dyYXBoeUVkaXRvcigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGFwcCwgc2V0dGluZ3MgfSA9IHRoaXM7XG4gICAgdGhpcy5lZGl0b3IgPSBuZXcgT3J0aG9ncmFwaHlFZGl0b3IoYXBwLCBzZXR0aW5ncyk7XG4gICAgdGhpcy5lZGl0b3IuaW5pdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3IoKSB7XG4gICAgY29uc3QgYWN0aXZlTGVhZjogYW55ID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWY7XG4gICAgY29uc3Qgc291cmNlTW9kZSA9IGFjdGl2ZUxlYWYudmlldy5zb3VyY2VNb2RlO1xuICAgIHJldHVybiBzb3VyY2VNb2RlID8gc291cmNlTW9kZS5jbUVkaXRvciA6IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG9uQ2hhbmdlVGV4dCgpIHtcbiAgICBpZiAoIXRoaXMucG9wdXAuY3JlYXRlZCkgcmV0dXJuO1xuICAgIHRoaXMucnVuQ2hlY2tlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvblJ1bkZyb21Qb3B1cCgpIHtcbiAgICBpZiAoIXRoaXMucG9wdXAuY3JlYXRlZCkgcmV0dXJuO1xuICAgIHRoaXMuZWRpdG9yLmRlc3Ryb3koKTtcbiAgICB0aGlzLnBvcHVwLnNldExvYWRlcigpO1xuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gdGhpcy5nZXRFZGl0b3IoKTtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpIHtcbiAgICAgIHRoaXMucnVuQ2hlY2tlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgTm90aWNlKE9fTk9UX09QRU5fRklMRSk7XG4gICAgICB0aGlzLm9uUG9wdXBDbG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQ2hlY2tlcigpIHtcbiAgICB0aGlzLnRvZ2dsZXIuc2V0TG9hZGluZygpO1xuICAgIGlmICghdGhpcy5hY3RpdmVFZGl0b3IpIHJldHVybjtcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5hY3RpdmVFZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICB0aGlzLmhpbnRzID0gYXdhaXQgdGhpcy5mZXRjaERhdGEodGV4dCk7XG4gICAgaWYgKHRoaXMuaGludHMgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgIHRoaXMucG9wdXAucmVtb3ZlTG9hZGVyKCk7XG4gICAgICB0aGlzLnRvZ2dsZXIucmVtb3ZlTG9hZGluZygpO1xuICAgICAgbmV3IE5vdGljZShPX1NFUlZFUl9FUlJPUik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmhpbnRzICYmIHRoaXMuaGludHMuYWxlcnRzICYmIHRoaXMuaGludHMuYWxlcnRzLmxlbmd0aCkge1xuICAgICAgY29uc3QgYWxlcnRzID0gZm9ybWF0QWxlcnRzKHRoaXMuaGludHMuYWxlcnRzKTtcbiAgICAgIHRoaXMuZWRpdG9yLmhpZ2hsaWdodFdvcmRzKHRoaXMuYWN0aXZlRWRpdG9yLCBhbGVydHMpO1xuICAgICAgdGhpcy5wb3B1cC51cGRhdGUoe1xuICAgICAgICBhbGVydHM6IHNvcnRBbGVydHMoYWxlcnRzKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoT19OT19FUlJPUik7XG4gICAgICB0aGlzLnBvcHVwLnJlbW92ZUxvYWRlcigpO1xuICAgIH1cbiAgICB0aGlzLnRvZ2dsZXIucmVtb3ZlTG9hZGluZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBvblBvcHVwT3BlbigpIHtcbiAgICBzZWxmLnBvcHVwLmNyZWF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvblBvcHVwQ2xvc2UoKSB7XG4gICAgc2VsZi5lZGl0b3IuZGVzdHJveSgpO1xuICAgIGlmIChzZWxmLmFjdGl2ZUVkaXRvcilcbiAgICAgIHNlbGYuYWN0aXZlRWRpdG9yLmRvYy5nZXRBbGxNYXJrcygpLmZvckVhY2goKG06IGFueSkgPT4gbS5jbGVhcigpKTtcbiAgICBzZWxmLnBvcHVwLmRlc3Ryb3koKTtcbiAgICBzZWxmLnRvZ2dsZXIucmVzZXQoKTtcbiAgICBpZiAoc2VsZi5hYm9ydGVyKSB7XG4gICAgICBzZWxmLmFib3J0ZXIuYWJvcnQoKTtcbiAgICAgIHNlbGYuYWJvcnRlciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblJlcGxhY2VXb3JkKGV2ZW50OiBhbnkpIHtcbiAgICBjb25zdCBvcmlnV29yZExlbiA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC50ZXh0Lmxlbmd0aDtcbiAgICBjb25zdCBuZXdXb3JkID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LnRvcmVwbGFjZTtcbiAgICBjb25zdCBiZWdpbiA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5iZWdpbjtcbiAgICBjb25zdCBlbmQgPSBiZWdpbiArIG9yaWdXb3JkTGVuO1xuICAgIHNlbGYuZWRpdG9yLnJlcGxhY2VXb3JkKFxuICAgICAgc2VsZi5hY3RpdmVFZGl0b3IsXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiArYmVnaW4sXG4gICAgICAgIGVuZDogK2VuZCxcbiAgICAgICAgbGVuOiArb3JpZ1dvcmRMZW5cbiAgICAgIH0sXG4gICAgICBuZXdXb3JkXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2hEYXRhKHRleHQ6IHN0cmluZyk6IFByb21pc2U8SlNPTj4ge1xuICAgIGlmIChzZWxmLmFib3J0ZXIpIHNlbGYuYWJvcnRlci5hYm9ydCgpO1xuICAgIHNlbGYucG9wdXAuZGlzYWJsZSgpO1xuXG4gICAgc2VsZi5hYm9ydGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBzZWxmLmFib3J0ZXI7XG5cbiAgICBjb25zdCB1cmw6IGFueSA9IG5ldyBVUkwoQVBJX1VSTF9HUkFNTUFSKTtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHsgdGV4dCB9O1xuICAgIE9iamVjdC5rZXlzKHBhcmFtcykuZm9yRWFjaCgoa2V5KSA9PlxuICAgICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoa2V5LCBwYXJhbXNba2V5XSlcbiAgICApO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBzaWduYWxcbiAgICAgIH0pO1xuICAgICAgc2VsZi5hYm9ydGVyID0gbnVsbDtcbiAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2VsZi5wb3B1cC5lbmFibGUoKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJzZWxmIiwiTm90aWNlIiwidGhpcyIsIlBsdWdpbiIsIkV2ZW50cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF1REE7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxF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
