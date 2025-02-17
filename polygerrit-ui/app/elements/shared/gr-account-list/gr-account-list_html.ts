/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
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
import {html} from '@polymer/polymer/lib/utils/html-tag';

export const htmlTemplate = html`
  <style include="shared-styles">
    gr-account-chip {
      display: inline-block;
      margin: var(--spacing-xs) var(--spacing-xs) var(--spacing-xs) 0;
    }
    gr-account-entry {
      display: flex;
      flex: 1;
      min-width: 10em;
      margin: var(--spacing-xs) var(--spacing-xs) var(--spacing-xs) 0;
    }
    .group {
      --account-label-suffix: ' (group)';
    }
    .pending-add {
      font-style: italic;
    }
    .list {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
    }
  </style>
  <!--
      NOTE(Issue 6419): Nest the inner dom-repeat template in a div rather than
      as a direct child of the dom-module's template.
    -->
  <div class="list">
    <template id="chips" is="dom-repeat" items="[[accounts]]" as="account">
      <gr-account-chip
        account="[[account]]"
        class$="[[_computeChipClass(account)]]"
        data-account-id$="[[account._account_id]]"
        removable="[[_computeRemovable(account, readonly)]]"
        on-keydown="_handleChipKeydown"
        tabindex="-1"
      >
      </gr-account-chip>
    </template>
  </div>
  <gr-account-entry
    borderless=""
    hidden$="[[_computeEntryHidden(maxCount, accounts.*, readonly)]]"
    id="entry"
    placeholder="[[placeholder]]"
    on-add="_handleAdd"
    on-input-keydown="_handleInputKeydown"
    allow-any-input="[[allowAnyInput]]"
    query-suggestions="[[_querySuggestions]]"
  >
  </gr-account-entry>
  <slot></slot>
`;
