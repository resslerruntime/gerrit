/**
 * @license
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import '@polymer/iron-dropdown/iron-dropdown';
import '../gr-cursor-manager/gr-cursor-manager';
import '../../../styles/shared-styles';
import {flush} from '@polymer/polymer/lib/legacy/polymer.dom';
import {PolymerElement} from '@polymer/polymer/polymer-element';
import {htmlTemplate} from './gr-autocomplete-dropdown_html';
import {KeyboardShortcutMixin} from '../../../mixins/keyboard-shortcut-mixin/keyboard-shortcut-mixin';
import {IronFitMixin} from '../../../mixins/iron-fit-mixin/iron-fit-mixin';
import {customElement, property, observe} from '@polymer/decorators';
import {IronFitBehavior} from '@polymer/iron-fit-behavior/iron-fit-behavior';
import {GrCursorManager} from '../gr-cursor-manager/gr-cursor-manager';
import {fireEvent} from '../../../utils/event-util';

export interface GrAutocompleteDropdown {
  $: {
    suggestions: Element;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-autocomplete-dropdown': GrAutocompleteDropdown;
  }
}

export interface Item {
  dataValue?: string;
  name?: string;
  text?: string;
  label?: string;
  value?: string;
}

export interface ItemSelectedEvent {
  trigger: string;
  selected: HTMLElement | null;
}

@customElement('gr-autocomplete-dropdown')
export class GrAutocompleteDropdown extends IronFitMixin(
  KeyboardShortcutMixin(PolymerElement),
  IronFitBehavior as IronFitBehavior
) {
  static get template() {
    return htmlTemplate;
  }

  /**
   * Fired when the dropdown is closed.
   *
   * @event dropdown-closed
   */

  /**
   * Fired when item is selected.
   *
   * @event item-selected
   */

  @property({type: Number})
  index: number | null = null;

  @property({type: Boolean, reflectToAttribute: true})
  isHidden = true;

  @property({type: Number})
  override verticalOffset: number | null = null;

  @property({type: Number})
  override horizontalOffset: number | null = null;

  @property({type: Array})
  suggestions: Item[] = [];

  get keyBindings() {
    return {
      up: '_handleUp',
      down: '_handleDown',
      enter: '_handleEnter',
      esc: '_handleEscape',
      tab: '_handleTab',
    };
  }

  // visible for testing
  cursor = new GrCursorManager();

  constructor() {
    super();
    this.cursor.cursorTargetClass = 'selected';
    this.cursor.focusOnMove = true;
  }

  override disconnectedCallback() {
    this.cursor.unsetCursor();
    super.disconnectedCallback();
  }

  close() {
    this.isHidden = true;
  }

  open() {
    this.isHidden = false;
    this._resetCursorStops();
    // Refit should run after we call Polymer.flush inside _resetCursorStops
    this.refit();
  }

  getCurrentText() {
    return this.getCursorTarget()?.dataset['value'] || '';
  }

  _handleUp(e: Event) {
    if (!this.isHidden) {
      e.preventDefault();
      e.stopPropagation();
      this.cursorUp();
    }
  }

  _handleDown(e: Event) {
    if (!this.isHidden) {
      e.preventDefault();
      e.stopPropagation();
      this.cursorDown();
    }
  }

  cursorDown() {
    if (!this.isHidden) {
      this.cursor.next();
    }
  }

  cursorUp() {
    if (!this.isHidden) {
      this.cursor.previous();
    }
  }

  _handleTab(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<ItemSelectedEvent>('item-selected', {
        detail: {
          trigger: 'tab',
          selected: this.cursor.target,
        },
        composed: true,
        bubbles: true,
      })
    );
  }

  _handleEnter(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<ItemSelectedEvent>('item-selected', {
        detail: {
          trigger: 'enter',
          selected: this.cursor.target,
        },
        composed: true,
        bubbles: true,
      })
    );
  }

  _handleEscape() {
    this._fireClose();
    this.close();
  }

  _handleClickItem(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    let selected = e.target! as HTMLElement;
    while (!selected.classList.contains('autocompleteOption')) {
      if (!selected || selected === this) {
        return;
      }
      selected = selected.parentElement!;
    }
    this.dispatchEvent(
      new CustomEvent<ItemSelectedEvent>('item-selected', {
        detail: {
          trigger: 'click',
          selected,
        },
        composed: true,
        bubbles: true,
      })
    );
  }

  _fireClose() {
    fireEvent(this, 'dropdown-closed');
  }

  getCursorTarget() {
    return this.cursor.target;
  }

  @observe('suggestions')
  _resetCursorStops() {
    if (this.suggestions.length > 0) {
      if (!this.isHidden) {
        flush();
        this.cursor.stops = Array.from(
          this.$.suggestions.querySelectorAll('li')
        );
        this._resetCursorIndex();
      }
    } else {
      this.cursor.stops = [];
    }
  }

  @observe('index')
  _setIndex() {
    this.cursor.index = this.index || -1;
  }

  _resetCursorIndex() {
    this.cursor.setCursorAtIndex(0);
  }

  _computeLabelClass(item: Item) {
    return item.label ? '' : 'hide';
  }
}
