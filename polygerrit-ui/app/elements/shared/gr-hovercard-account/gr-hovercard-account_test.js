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

import '../../../test/common-test-setup-karma.js';
import './gr-hovercard-account.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {ReviewerState} from '../../../constants/constants.js';
import {stubRestApi} from '../../../test/test-utils.js';

const basicFixture = fixtureFromTemplate(html`
<gr-hovercard-account class="hovered"></gr-hovercard-account>
`);

suite('gr-hovercard-account tests', () => {
  let element;

  const ACCOUNT = {
    email: 'kermit@gmail.com',
    username: 'kermit',
    name: 'Kermit The Frog',
    _account_id: '31415926535',
  };

  setup(async () => {
    stubRestApi('getAccount').returns(Promise.resolve({...ACCOUNT}));
    element = basicFixture.instantiate();
    element.account = {...ACCOUNT};
    element.change = {
      attention_set: {},
      reviewers: {},
      owner: {...ACCOUNT},
    };
    element.show({});
    await flush();
  });

  teardown(() => {
    element.hide({});
  });

  test('account name is shown', () => {
    assert.equal(element.shadowRoot.querySelector('.name').innerText,
        'Kermit The Frog');
  });

  test('_computeLastUpdate', () => {
    const last_update = '2019-07-17 19:39:02.000000000';
    const change = {
      attention_set: {
        31415926535: {
          last_update,
        },
      },
    };
    assert.equal(element._computeLastUpdate(change), last_update);
  });

  test('_computeText', () => {
    let account = {_account_id: '1'};
    const selfAccount = {_account_id: '1'};
    assert.equal(element._computeText(account, selfAccount), 'Your');
    account = {_account_id: '2'};
    assert.equal(element._computeText(account, selfAccount), 'Their');
  });

  test('account status is not shown if the property is not set', () => {
    assert.isNull(element.shadowRoot.querySelector('.status'));
  });

  test('account status is displayed', () => {
    element.account = {status: 'OOO', ...ACCOUNT};
    flush();
    assert.equal(element.shadowRoot.querySelector('.status .value').innerText,
        'OOO');
  });

  test('voteable div is not shown if the property is not set', () => {
    assert.isNull(element.shadowRoot.querySelector('.voteable'));
  });

  test('voteable div is displayed', () => {
    element.voteableText = 'CodeReview: +2';
    flush();
    assert.equal(element.shadowRoot.querySelector('.voteable .value').innerText,
        element.voteableText);
  });

  test('remove reviewer', async () => {
    element.change = {
      removable_reviewers: [ACCOUNT],
      reviewers: {
        [ReviewerState.REVIEWER]: [ACCOUNT],
      },
    };
    stubRestApi('removeChangeReviewer').returns(Promise.resolve({ok: true}));
    const reloadListener = sinon.spy();
    element._target.addEventListener('reload', reloadListener);
    flush();
    const button = element.shadowRoot.querySelector('.removeReviewerOrCC');
    assert.isOk(button);
    assert.equal(button.innerText, 'Remove Reviewer');
    MockInteractions.tap(button);
    await flush();
    assert.isTrue(reloadListener.called);
  });

  test('move reviewer to cc', async () => {
    element.change = {
      removable_reviewers: [ACCOUNT],
      reviewers: {
        [ReviewerState.REVIEWER]: [ACCOUNT],
      },
    };
    const saveReviewStub = stubRestApi(
        'saveChangeReview').returns(
        Promise.resolve({ok: true}));
    stubRestApi('removeChangeReviewer').returns(Promise.resolve({ok: true}));
    const reloadListener = sinon.spy();
    element._target.addEventListener('reload', reloadListener);

    flush();
    const button = element.shadowRoot.querySelector('.changeReviewerOrCC');

    assert.isOk(button);
    assert.equal(button.innerText, 'Move Reviewer to CC');
    MockInteractions.tap(button);
    await flush();

    assert.isTrue(saveReviewStub.called);
    assert.isTrue(reloadListener.called);
  });

  test('move reviewer to cc', async () => {
    element.change = {
      removable_reviewers: [ACCOUNT],
      reviewers: {
        [ReviewerState.REVIEWER]: [],
      },
    };
    const saveReviewStub = stubRestApi(
        'saveChangeReview').returns(Promise.resolve({ok: true}));
    stubRestApi('removeChangeReviewer').returns(Promise.resolve({ok: true}));
    const reloadListener = sinon.spy();
    element._target.addEventListener('reload', reloadListener);
    flush();

    const button = element.shadowRoot.querySelector('.changeReviewerOrCC');
    assert.isOk(button);
    assert.equal(button.innerText, 'Move CC to Reviewer');

    MockInteractions.tap(button);
    await flush();

    assert.isTrue(saveReviewStub.called);
    assert.isTrue(reloadListener.called);
  });

  test('remove cc', async () => {
    element.change = {
      removable_reviewers: [ACCOUNT],
      reviewers: {
        [ReviewerState.REVIEWER]: [],
      },
    };
    stubRestApi('removeChangeReviewer').returns(Promise.resolve({ok: true}));
    const reloadListener = sinon.spy();
    element._target.addEventListener('reload', reloadListener);

    flush();
    const button = element.shadowRoot.querySelector('.removeReviewerOrCC');

    assert.equal(button.innerText, 'Remove CC');
    assert.isOk(button);
    MockInteractions.tap(button);

    await flush();

    assert.isTrue(reloadListener.called);
  });

  test('add to attention set', async () => {
    let apiResolve;
    const apiPromise = new Promise(r => {
      apiResolve = r;
    });
    const apiSpy = stubRestApi('addToAttentionSet').returns(apiPromise);
    element.highlightAttention = true;
    element._target = document.createElement('div');
    flush();
    const showAlertListener = sinon.spy();
    const hideAlertListener = sinon.spy();
    const updatedListener = sinon.spy();
    element._target.addEventListener('show-alert', showAlertListener);
    element._target.addEventListener('hide-alert', hideAlertListener);
    element._target.addEventListener('attention-set-updated', updatedListener);

    const button = element.shadowRoot.querySelector('.addToAttentionSet');
    assert.isOk(button);
    assert.isTrue(element._isShowing, 'hovercard is showing');
    MockInteractions.tap(button);

    assert.equal(Object.keys(element.change.attention_set).length, 1);
    const attention_set_info = Object.values(element.change.attention_set)[0];
    assert.equal(attention_set_info.reason,
        `Added by <GERRIT_ACCOUNT_${ACCOUNT._account_id}>`
        + ` using the hovercard menu`);
    assert.equal(attention_set_info.reason_account._account_id,
        ACCOUNT._account_id);
    assert.isTrue(showAlertListener.called, 'showAlertListener was called');
    assert.isTrue(updatedListener.called, 'updatedListener was called');
    assert.isFalse(element._isShowing, 'hovercard is hidden');

    apiResolve({});
    await flush();
    assert.isTrue(apiSpy.calledOnce);
    assert.equal(apiSpy.lastCall.args[2],
        `Added by <GERRIT_ACCOUNT_${ACCOUNT._account_id}>`
        + ` using the hovercard menu`);
    assert.isTrue(hideAlertListener.called, 'hideAlertListener was called');
  });

  test('remove from attention set', async () => {
    let apiResolve;
    const apiPromise = new Promise(r => {
      apiResolve = r;
    });
    const apiSpy = stubRestApi('removeFromAttentionSet').returns(apiPromise);
    element.highlightAttention = true;
    element.change = {
      attention_set: {31415926535: {}},
      reviewers: {},
      owner: {...ACCOUNT},
    };
    element._target = document.createElement('div');
    flush();
    const showAlertListener = sinon.spy();
    const hideAlertListener = sinon.spy();
    const updatedListener = sinon.spy();
    element._target.addEventListener('show-alert', showAlertListener);
    element._target.addEventListener('hide-alert', hideAlertListener);
    element._target.addEventListener('attention-set-updated', updatedListener);

    const button = element.shadowRoot.querySelector('.removeFromAttentionSet');
    assert.isOk(button);
    assert.isTrue(element._isShowing, 'hovercard is showing');
    MockInteractions.tap(button);

    assert.equal(Object.keys(element.change.attention_set).length, 0);
    assert.isTrue(showAlertListener.called, 'showAlertListener was called');
    assert.isTrue(updatedListener.called, 'updatedListener was called');
    assert.isFalse(element._isShowing, 'hovercard is hidden');

    apiResolve({});
    await flush();

    assert.isTrue(apiSpy.calledOnce);
    assert.equal(apiSpy.lastCall.args[2],
        `Removed by <GERRIT_ACCOUNT_${ACCOUNT._account_id}>`
        + ` using the hovercard menu`);
    assert.isTrue(hideAlertListener.called, 'hideAlertListener was called');
  });
});

