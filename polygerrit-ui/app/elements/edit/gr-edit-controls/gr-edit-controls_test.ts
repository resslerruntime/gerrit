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

import '../../../test/common-test-setup-karma';
import './gr-edit-controls';
import {GrEditControls} from './gr-edit-controls';
import {GerritNav} from '../../core/gr-navigation/gr-navigation';
import {stubRestApi} from '../../../test/test-utils';
import {createChange, createRevision} from '../../../test/test-data-generators';
import {GrAutocomplete} from '../../shared/gr-autocomplete/gr-autocomplete';
import {CommitId, NumericChangeId, PatchSetNum} from '../../../types/common';
import {RepoName} from '../../../api/rest-api';
import {queryAndAssert} from '../../../test/test-utils';
import * as MockInteractions from '@polymer/iron-test-helpers/mock-interactions';

const basicFixture = fixtureFromElement('gr-edit-controls');

suite('gr-edit-controls tests', () => {
  let element: GrEditControls;

  let showDialogSpy: sinon.SinonSpy;
  let closeDialogSpy: sinon.SinonSpy;
  let hideDialogStub: sinon.SinonStub;
  let queryStub: sinon.SinonStub;

  setup(() => {
    element = basicFixture.instantiate();
    element.change = createChange();
    showDialogSpy = sinon.spy(element, '_showDialog');
    closeDialogSpy = sinon.spy(element, '_closeDialog');
    hideDialogStub = sinon.stub(element, '_hideAllDialogs');
    queryStub = stubRestApi('queryChangeFiles').returns(Promise.resolve([]));
    flush();
  });

  test('all actions exist', () => {
    // We take 1 away from the total found, due to an extra button being
    // added for the file uploads (browse).
    assert.equal(
      element.root!.querySelectorAll('gr-button').length - 1,
      element._actions.length
    );
  });

  suite('edit button CUJ', () => {
    let editDiffStub: sinon.SinonStub;
    let navStub: sinon.SinonStub;
    let openAutoComplete: GrAutocomplete;

    setup(() => {
      editDiffStub = sinon.stub(GerritNav, 'getEditUrlForDiff');
      navStub = sinon.stub(GerritNav, 'navigateToRelativeUrl');
      openAutoComplete =
        element.$.openDialog!.querySelector('gr-autocomplete')!;
    });

    test('_isValidPath', () => {
      assert.isFalse(element._isValidPath(''));
      assert.isFalse(element._isValidPath('test/'));
      assert.isFalse(element._isValidPath('/'));
      assert.isTrue(element._isValidPath('test/path.cpp'));
      assert.isTrue(element._isValidPath('test.js'));
    });

    test('open', () => {
      assert.isFalse(hideDialogStub.called);
      MockInteractions.tap(queryAndAssert(element, '#open'));
      element.patchNum = 1 as PatchSetNum;
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(hideDialogStub.called);
        assert.isTrue(element.$.openDialog.disabled);
        assert.isFalse(queryStub.called);
        // Setup _focused manually - in headless mode Chrome sometimes don't
        // setup focus. flush and/or flushAsynchronousOperations don't help
        openAutoComplete._focused = true;
        openAutoComplete.noDebounce = true;
        openAutoComplete.text = 'src/test.cpp';
        assert.isTrue(queryStub.called);
        assert.isFalse(element.$.openDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.openDialog, 'gr-button[primary]')
        );
        assert.isTrue(editDiffStub.called);
        assert.isTrue(navStub.called);
        assert.deepEqual(editDiffStub.lastCall.args, [
          element.change,
          'src/test.cpp',
          element.patchNum,
        ]);
        assert.isTrue(closeDialogSpy.called);
      });
    });

    test('cancel', () => {
      MockInteractions.tap(queryAndAssert(element, '#open'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.openDialog.disabled);
        openAutoComplete.noDebounce = true;
        openAutoComplete.text = 'src/test.cpp';
        assert.isFalse(element.$.openDialog.disabled);
        MockInteractions.tap(queryAndAssert(element.$.openDialog, 'gr-button'));
        assert.isFalse(editDiffStub.called);
        assert.isFalse(navStub.called);
        assert.isTrue(closeDialogSpy.called);
        assert.equal(element._path, '');
      });
    });
  });

  suite('delete button CUJ', () => {
    let navStub: sinon.SinonStub;
    let deleteStub: sinon.SinonStub;
    let deleteAutocomplete: GrAutocomplete;

    setup(() => {
      navStub = sinon.stub(GerritNav, 'navigateToChange');
      deleteStub = stubRestApi('deleteFileInChangeEdit');
      deleteAutocomplete =
        element.$.deleteDialog!.querySelector('gr-autocomplete')!;
    });

    test('delete', () => {
      deleteStub.returns(Promise.resolve({ok: true}));
      MockInteractions.tap(queryAndAssert(element, '#delete'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.deleteDialog.disabled);
        assert.isFalse(queryStub.called);
        // Setup _focused manually - in headless mode Chrome sometimes don't
        // setup focus. flush and/or flushAsynchronousOperations don't help
        deleteAutocomplete._focused = true;
        deleteAutocomplete.noDebounce = true;
        deleteAutocomplete.text = 'src/test.cpp';
        assert.isTrue(queryStub.called);
        assert.isFalse(element.$.deleteDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.deleteDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(deleteStub.called);

        return deleteStub.lastCall.returnValue.then(() => {
          assert.equal(element._path, '');
          assert.isTrue(navStub.called);
          assert.isTrue(closeDialogSpy.called);
        });
      });
    });

    test('delete fails', () => {
      deleteStub.returns(Promise.resolve({ok: false}));
      MockInteractions.tap(queryAndAssert(element, '#delete'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.deleteDialog.disabled);
        assert.isFalse(queryStub.called);
        // Setup _focused manually - in headless mode Chrome sometimes don't
        // setup focus. flush and/or flushAsynchronousOperations don't help
        deleteAutocomplete._focused = true;
        deleteAutocomplete.noDebounce = true;
        deleteAutocomplete.text = 'src/test.cpp';
        assert.isTrue(queryStub.called);
        assert.isFalse(element.$.deleteDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.deleteDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(deleteStub.called);

        return deleteStub.lastCall.returnValue.then(() => {
          assert.isFalse(navStub.called);
          assert.isFalse(closeDialogSpy.called);
        });
      });
    });

    test('cancel', () => {
      MockInteractions.tap(queryAndAssert(element, '#delete'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.deleteDialog.disabled);
        element.$.deleteDialog!.querySelector('gr-autocomplete')!.text =
          'src/test.cpp';
        assert.isFalse(element.$.deleteDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.deleteDialog, 'gr-button')
        );
        assert.isFalse(navStub.called);
        assert.isTrue(closeDialogSpy.called);
        assert.equal(element._path, '');
      });
    });
  });

  suite('rename button CUJ', () => {
    let navStub: sinon.SinonStub;
    let renameStub: sinon.SinonStub;
    let renameAutocomplete: GrAutocomplete;

    setup(() => {
      navStub = sinon.stub(GerritNav, 'navigateToChange');
      renameStub = stubRestApi('renameFileInChangeEdit');
      renameAutocomplete =
        element.$.renameDialog!.querySelector('gr-autocomplete')!;
    });

    test('rename', () => {
      renameStub.returns(Promise.resolve({ok: true}));
      MockInteractions.tap(queryAndAssert(element, '#rename'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.renameDialog.disabled);
        assert.isFalse(queryStub.called);
        // Setup _focused manually - in headless mode Chrome sometimes don't
        // setup focus. flush and/or flushAsynchronousOperations don't help
        renameAutocomplete._focused = true;
        renameAutocomplete.noDebounce = true;
        renameAutocomplete.text = 'src/test.cpp';
        assert.isTrue(queryStub.called);
        assert.isTrue(element.$.renameDialog.disabled);

        element.$.newPathIronInput.bindValue = 'src/test.newPath';

        assert.isFalse(element.$.renameDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.renameDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(renameStub.called);

        return renameStub.lastCall.returnValue.then(() => {
          assert.equal(element._path, '');
          assert.isTrue(navStub.called);
          assert.isTrue(closeDialogSpy.called);
        });
      });
    });

    test('rename fails', () => {
      renameStub.returns(Promise.resolve({ok: false}));
      MockInteractions.tap(queryAndAssert(element, '#rename'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.renameDialog.disabled);
        assert.isFalse(queryStub.called);
        // Setup _focused manually - in headless mode Chrome sometimes don't
        // setup focus. flush and/or flushAsynchronousOperations don't help
        renameAutocomplete._focused = true;
        renameAutocomplete.noDebounce = true;
        renameAutocomplete.text = 'src/test.cpp';
        assert.isTrue(queryStub.called);
        assert.isTrue(element.$.renameDialog.disabled);

        element.$.newPathIronInput.bindValue = 'src/test.newPath';

        assert.isFalse(element.$.renameDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.renameDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(renameStub.called);

        return renameStub.lastCall.returnValue.then(() => {
          assert.isFalse(navStub.called);
          assert.isFalse(closeDialogSpy.called);
        });
      });
    });

    test('cancel', () => {
      MockInteractions.tap(queryAndAssert(element, '#rename'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        assert.isTrue(element.$.renameDialog.disabled);
        element.$.renameDialog!.querySelector('gr-autocomplete')!.text =
          'src/test.cpp';
        element.$.newPathIronInput.bindValue = 'src/test.newPath';
        assert.isFalse(element.$.renameDialog.disabled);
        MockInteractions.tap(
          queryAndAssert(element.$.renameDialog, 'gr-button')
        );
        assert.isFalse(navStub.called);
        assert.isTrue(closeDialogSpy.called);
        assert.equal(element._path, '');
        assert.equal(element._newPath, '');
      });
    });
  });

  suite('restore button CUJ', () => {
    let navStub: sinon.SinonStub;
    let restoreStub: sinon.SinonStub;

    setup(() => {
      navStub = sinon.stub(GerritNav, 'navigateToChange');
      restoreStub = stubRestApi('restoreFileInChangeEdit');
    });

    test('restore hidden by default', () => {
      assert.isTrue(
        queryAndAssert(element, '#restore').classList!.contains('invisible')!
      );
    });

    test('restore', () => {
      restoreStub.returns(Promise.resolve({ok: true}));
      element._path = 'src/test.cpp';
      MockInteractions.tap(queryAndAssert(element, '#restore'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        MockInteractions.tap(
          queryAndAssert(element.$.restoreDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(restoreStub.called);
        assert.equal(restoreStub.lastCall.args[1], 'src/test.cpp');
        return restoreStub.lastCall.returnValue.then(() => {
          assert.equal(element._path, '');
          assert.isTrue(navStub.called);
          assert.isTrue(closeDialogSpy.called);
        });
      });
    });

    test('restore fails', () => {
      restoreStub.returns(Promise.resolve({ok: false}));
      element._path = 'src/test.cpp';
      MockInteractions.tap(queryAndAssert(element, '#restore'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        MockInteractions.tap(
          queryAndAssert(element.$.restoreDialog, 'gr-button[primary]')
        );
        flush();

        assert.isTrue(restoreStub.called);
        assert.equal(restoreStub.lastCall.args[1], 'src/test.cpp');
        return restoreStub.lastCall.returnValue.then(() => {
          assert.isFalse(navStub.called);
          assert.isFalse(closeDialogSpy.called);
        });
      });
    });

    test('cancel', () => {
      element._path = 'src/test.cpp';
      MockInteractions.tap(queryAndAssert(element, '#restore'));
      return showDialogSpy.lastCall.returnValue.then(() => {
        MockInteractions.tap(
          queryAndAssert(element.$.restoreDialog, 'gr-button')
        );
        assert.isFalse(navStub.called);
        assert.isTrue(closeDialogSpy.called);
        assert.equal(element._path, '');
      });
    });
  });

  suite('save file upload', () => {
    let navStub: sinon.SinonStub;
    let fileStub: sinon.SinonStub;

    setup(() => {
      navStub = sinon.stub(GerritNav, 'navigateToChange');
      fileStub = stubRestApi('saveFileUploadChangeEdit');
    });

    test('_handleUploadConfirm', () => {
      fileStub.returns(Promise.resolve({ok: true}));

      element.change = {
        ...createChange(),
        _number: 1 as NumericChangeId,
        project: 'project' as RepoName,
        revisions: {
          abcd: {
            ...createRevision(1),
            _number: 1 as PatchSetNum,
          },
          efgh: {
            ...createRevision(2),
            _number: 2 as PatchSetNum,
          },
        },
        current_revision: 'efgh' as CommitId,
      };

      element._handleUploadConfirm('test.php', 'base64').then(() => {
        assert.isTrue(navStub.calledWithExactly(1 as NumericChangeId));
      });
    });
  });

  test('openOpenDialog', done => {
    element.openOpenDialog('test/path.cpp').then(() => {
      assert.isFalse(element.$.openDialog.hasAttribute('hidden'));
      assert.equal(
        element.$.openDialog!.querySelector('gr-autocomplete')!.text,
        'test/path.cpp'
      );
      done();
    });
  });

  test('_getDialogFromEvent', () => {
    const spy = sinon.spy(element, '_getDialogFromEvent');
    element.addEventListener('tap', element._getDialogFromEvent);

    MockInteractions.tap(element.$.openDialog);
    flush();
    assert.equal(spy!.lastCall!.returnValue!.id, 'openDialog');

    MockInteractions.tap(element.$.deleteDialog);
    flush();
    assert.equal(spy!.lastCall!.returnValue!.id, 'deleteDialog');

    MockInteractions.tap(
      element.$.deleteDialog!.querySelector('gr-autocomplete')!
    );
    flush();
    assert.equal(spy!.lastCall!.returnValue!.id, 'deleteDialog');

    MockInteractions.tap(element);
    flush();
    assert.notOk(spy!.lastCall!.returnValue);
  });
});
