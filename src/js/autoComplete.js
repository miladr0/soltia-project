const API_BASE_URL = 'https://restcountries.com/v3.1/name/';
const SEARCHED_ITEMS_KEY = 'searchedItems';
const CLOSED_ICON_SVG = '<svg aria-hidden="true" focusable="false" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M443.6,387.1L312.4,255.4l131.5-130c5.4-5.4,5.4-14.2,0-19.6l-37.4-37.6c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4  L256,197.8L124.9,68.3c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4L68,105.9c-5.4,5.4-5.4,14.2,0,19.6l131.5,130L68.4,387.1  c-2.6,2.6-4.1,6.1-4.1,9.8c0,3.7,1.4,7.2,4.1,9.8l37.4,37.6c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1L256,313.1l130.7,131.1  c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1l37.4-37.6c2.6-2.6,4.1-6.1,4.1-9.8C447.7,393.2,446.2,389.7,443.6,387.1z"/></svg>';
const FETCH_DELAY = 200;

/**
 *
 * @param {string} selectElement - id of select element
 * @param {string} historyElm - show list of history search selected
 * @param {string} purgeHistoryElm - id of history element to purge history all at once
 */
function AutoComplete(selectElement, historyElm, purgeHistoryElm) {
  this.purgeHistoryElement = document.querySelector(purgeHistoryElm);
  this.historyElement = document.querySelector(historyElm);
  this.select = document.querySelector(selectElement);
  this.container = this.select.parentElement;
  this.wrapper = document.createElement('div');
  this.wrapper.classList.add('autocomplete');
  this.container.appendChild(this.wrapper);

  this.purgeHistoryElement.addEventListener('click', this.purgeHistory.bind(this));

  this.setupKeys();

  this.createTextBox();
  this.createDropDownContainer();
  this.hideSelectBox();
  this.createCloseIcon();
  this.populateHistoryItems();
  document.addEventListener('click', this.onDocumentClick.bind(this));
}

AutoComplete.prototype.onDocumentClick = function onDocumentClick(e) {
  if (!this.container.contains(e.target)) {
    this.hideMenu();
    this.removeTextBoxFocus();
  }
};

AutoComplete.prototype.setupKeys = function setupKeys() {
  this.keys = {
    enter: 13,
    esc: 27,
    space: 32,
    up: 38,
    down: 40,
    tab: 9,
    left: 37,
    right: 39,
    shift: 16,
  };
};

AutoComplete.prototype.onTextBoxFocus = function onTextBoxFocus() {
  this.textBox.classList.add('autocomplete-isFocused');
};
AutoComplete.prototype.removeTextBoxFocus = function removeTextBoxFocus() {
  this.textBox.classList.remove('autocomplete-isFocused');
};

AutoComplete.prototype.onTextBoxKeyUp = function onTextBoxKeyUp(elm) {
  switch (elm.keyCode) {
    case this.keys.esc:
      this.onTextBoxEscape();
      break;
    case this.keys.tab:
    case this.keys.up:
    case this.keys.left:
    case this.keys.right:
    case this.keys.space:
    case this.keys.enter:
    case this.keys.shift:
      break;
    case this.keys.down:
      this.onTextBoxDownPressed(elm);
      break;
    default:
      this.onTextBoxType(elm);
  }
};

AutoComplete.prototype.onOptionDownArrow = function onOptionDownArrow(t) {
  const e = this.getNextOption();

  if (e) this.highlightOption(e);
  t.preventDefault();
};
AutoComplete.prototype.onOptionUpArrow = function onOptionUpArrow(t) {
  const e = this.getPreviousOption();
  if (e) {
    this.highlightOption(e);
  } else {
    this.focusTextBox();
    this.unHighlightOption();
  }
  t.preventDefault();
};

AutoComplete.prototype.onMenuKeyDown = function onMenuKeyDown(t) {
  switch (t.keyCode) {
    case this.keys.up:
      this.onOptionUpArrow(t);
      break;
    case this.keys.down:
      this.onOptionDownArrow(t);
      break;
    case this.keys.enter:
      this.onOptionEnter(t);
      break;
    case this.keys.space:
      this.onOptionSpace(t);
      break;
    case this.keys.esc:
      this.onOptionEscape(t);
      break;
    case this.keys.tab:
      this.hideMenu();
      this.removeTextBoxFocus();
      break;
    default:
      this.focusTextBox();
  }
};

AutoComplete.prototype.startFetch = function startFetch(text) {
  fetch(`${API_BASE_URL}${encodeURIComponent(text)}`)
    .then((response) => response.json())
    .then((data) => {
      this.buildMenu(data);
    });
};

AutoComplete.prototype.onTextBoxType = function onTextBoxType() {
  if (this.textBox.value.trim().length > 0) {
    if (this.textBox.value.length < 3) return;

    this.closeIcon.classList.remove('hidden');

    if (this.timer) {
      clearTimeout(this.timer);
    }
    const that = this;
    this.timer = setTimeout(() => {
      that.startFetch(that.textBox.value.trim().toLowerCase());
    }, FETCH_DELAY);
  } else {
    this.hideMenu();
    this.closeIcon.classList.add('hidden');
  }
};

AutoComplete.prototype.onTextBoxEscape = function onTextBoxEscape() {
  this.clearOptions();
  this.hideMenu();
  this.textBox.value = '';
  this.select.value = null;
  this.closeIcon.classList.add('hidden');
};

AutoComplete.prototype.onOptionEscape = function onOptionEscape() {
  this.clearOptions();
  this.hideMenu();
  this.focusTextBox();
};
AutoComplete.prototype.focusTextBox = function focusTextBox() {
  this.textBox.focus();
};
AutoComplete.prototype.onOptionEnter = function onOptionEnter(e) {
  if (this.isOptionSelected()) { this.selectActiveOption(); }
  e.preventDefault();
};
AutoComplete.prototype.onOptionSpace = function onOptionSpace(e) {
  if (this.isOptionSelected()) {
    this.selectActiveOption();
  }
  e.preventDefault();
};
AutoComplete.prototype.onOptionClick = function onOptionClick(e) {
  const elm = (e.currentTarget);
  this.selectOption(elm);
};
AutoComplete.prototype.selectActiveOption = function selectActiveOption() {
  const t = this.getActiveOption();
  this.selectOption(t);
};
AutoComplete.prototype.selectOption = function selectOption(elm) {
  const e = elm.getAttribute('data-option-value');

  this.setValue(e);
  this.hideMenu();
  this.focusTextBox();
};
AutoComplete.prototype.onTextBoxDownPressed = function onTextBoxDownPressed() {
  const elm = this.getFirstOption();
  if (elm) {
    this.highlightOption(elm);
  }
};

AutoComplete.prototype.isOptionSelected = function isOptionSelected() {
  return this.activeOptionId;
};
AutoComplete.prototype.getActiveOption = function getActiveOption() {
  return document.querySelector(`#${this.activeOptionId}`);
};
AutoComplete.prototype.getFirstOption = function getFirstOption() {
  return this.menu.getElementsByTagName('li')[0];
};
AutoComplete.prototype.getPreviousOption = function getPreviousOption() {
  return document.querySelector(`#${this.activeOptionId}`).previousSibling;
};
AutoComplete.prototype.getNextOption = function getNextOption() {
  return document.querySelector(`#${this.activeOptionId}`).nextSibling;
};
AutoComplete.prototype.highlightOption = function highlightOption(elm) {
  if (this.activeOptionId) {
    this.getOptionById(this.activeOptionId).setAttribute('aria-selected', 'false');
  }
  elm.setAttribute('aria-selected', 'true');
  elm.focus();

  this.activeOptionId = elm.getAttribute('id');
};

AutoComplete.prototype.unHighlightOption = function unHighlightOption() {
  if (this.activeOptionId) {
    const elm = this.getActiveOption();
    if (elm) elm.setAttribute('aria-selected', 'false');
  }
};

AutoComplete.prototype.getOptionById = function getOptionById(t) {
  return document.querySelector(`#${t}`);
};
AutoComplete.prototype.showMenu = function showMenu() {
  this.menu.classList.remove('hidden');
  this.textBox.setAttribute('aria-expanded', 'true');
};
AutoComplete.prototype.hideMenu = function hideMenu() {
  this.menu.classList.add('hidden');
  this.textBox.setAttribute('aria-expanded', 'false');
  this.activeOptionId = null;
  this.clearOptions();
};
AutoComplete.prototype.clearOptions = function clearOptions() {
  this.menu.innerHTML = '';
};

AutoComplete.prototype.buildMenu = function buildMenu(dataArray) {
  this.clearOptions();
  this.menu.classList.remove('hidden');

  this.activeOptionId = null;

  if (Array.isArray(dataArray) && dataArray.length) {
    for (let e = 0; e < dataArray.length; e += 1) {
      this.menu.appendChild(this.createItemHtml(e, dataArray[e]));
    }
  } else {
    this.menu.appendChild(this.createNoResultsHtml());
  }
};

AutoComplete.prototype.createNoResultsHtml = function createNoResultsHtml() {
  const li = document.createElement('li');
  li.classList.add('autocomplete-optionNoResults');
  li.innerHTML = 'No results found';
  return li;
};

AutoComplete.prototype.createItemHtml = function createItemHtml(t, e) {
  const li = document.createElement('li');
  li.setAttribute('tabindex', '-1');
  li.setAttribute('aria-selected', 'false');
  li.setAttribute('role', 'option');
  li.setAttribute('data-option-value', e.name.official);
  li.setAttribute('id', `autocomplete-option--${t}`);
  li.innerHTML = e.name.official.toLowerCase().replace(this.textBox.value, `<span class="option-highlight">${this.textBox.value}</span>`);

  li.addEventListener('click', this.onOptionClick.bind(this));

  return li;
};

AutoComplete.prototype.hideSelectBox = function hideSelectBox() {
  this.select.setAttribute('aria-hidden', 'true');
  this.select.setAttribute('tabindex', '-1');
  this.select.classList.add('hidden');
  this.select.setAttribute('id', '');
};
AutoComplete.prototype.getOptionsId = function getOptionsId() {
  return `autocomplete-options--${this.select.getAttribute('id')}`;
};

AutoComplete.prototype.createTextBox = function createTextBox() {
  this.textBox = document.createElement('input');
  this.textBox.setAttribute('type', 'text');
  this.textBox.setAttribute('autocapitalize', 'none');
  this.textBox.setAttribute('autocomplete', 'off');
  this.textBox.setAttribute('aria-owns', this.getOptionsId());
  this.textBox.setAttribute('aria-autocomplete', 'list');
  this.textBox.setAttribute('role', 'combobox');
  this.textBox.setAttribute('id', this.select.getAttribute('id'));

  if (this.select.value.trim().length > 0) {
    this.textBox.value = this.select.options[this.select.selectedIndex].text;
  }

  this.wrapper.appendChild(this.textBox);

  this.textBox.addEventListener('keydown', (ev) => {
    const code = ev.which || ev.keyCode || 0;

    switch (code) {
      case this.keys.tab:

        this.hideMenu();
        this.removeTextBoxFocus();
        break;
      default:
        break;
    }
  });

  this.textBox.addEventListener('keyup', this.onTextBoxKeyUp.bind(this));
  this.textBox.addEventListener('focus', this.onTextBoxFocus.bind(this));
};

AutoComplete.prototype.createDropDownContainer = function createDropDownContainer() {
  this.menu = document.createElement('ul');
  this.menu.setAttribute('id', this.getOptionsId());
  this.menu.setAttribute('role', 'listbox');
  this.menu.classList.add('hidden');

  this.wrapper.appendChild(this.menu);
  this.menu.addEventListener('keydown', this.onMenuKeyDown.bind(this));
};

AutoComplete.prototype.setValue = function setValue(t) {
  if (t.trim().length) {
    this.textBox.value = t;

    // incase form want to send to server
    this.select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = t;
    opt.innerHTML = t;
    this.select.appendChild(opt);
    this.select.value = t;

    // save selected result to local storage
    const today = new Date();
    const amOrPm = (today.getHours() < 12) ? 'AM' : 'PM';
    const currentDateFormat = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()} ${amOrPm}`;

    this.searchedItems.unshift({
      title: t,
      createdAt: currentDateFormat,
    });
    localStorage.setItem(SEARCHED_ITEMS_KEY, JSON.stringify(this.searchedItems));

    this.populateHistoryItems();
  } else {
    this.textBox.value = '';
  }
};

AutoComplete.prototype.createCloseIcon = function createCloseIcon() {
  this.closeIcon = document.createElement('span');
  this.closeIcon.innerHTML = CLOSED_ICON_SVG;
  this.closeIcon.setAttribute('aria-label', 'clear');
  this.closeIcon.classList.add('close-icon');
  this.closeIcon.classList.add('hidden');

  this.wrapper.appendChild(this.closeIcon);
  this.closeIcon.addEventListener('click', this.onTextBoxEscape.bind(this));
};

AutoComplete.prototype.removeHistoryItem = function removeHistoryItem(index) {
  this.searchedItems.splice(index, 1);
  localStorage.setItem(SEARCHED_ITEMS_KEY, JSON.stringify(this.searchedItems));

  this.populateHistoryItems();
};

AutoComplete.prototype.purgeHistory = function purgeHistory(e) {
  this.searchedItems = [];
  localStorage.setItem(SEARCHED_ITEMS_KEY, JSON.stringify(this.searchedItems));
  e.preventDefault();

  this.populateHistoryItems();
};

AutoComplete.prototype.populateHistoryItems = function populateHistoryItems() {
  this.searchedItems = JSON.parse(localStorage.getItem(SEARCHED_ITEMS_KEY) || '[]');

  this.historyElement.innerHTML = this.searchedItems.map((item, i) => (`<li key=${i}>
    <h6>${item.title}</h6>
    <div class="history-info"><p>${item.createdAt}</p> <span aria-label="remove" class="delete-history">${CLOSED_ICON_SVG}</span></div>
</li>`)).join('');

  const items = this.historyElement.querySelectorAll('.delete-history');
  items.forEach((item, i) => item.addEventListener('click', this.removeHistoryItem.bind(this, i)));
};
