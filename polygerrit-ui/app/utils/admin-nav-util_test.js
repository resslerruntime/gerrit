/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
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

import '../test/common-test-setup-karma.js';
import {getAdminLinks} from './admin-nav-util.js';

suite('gr-admin-nav-behavior tests', () => {
  let capabilityStub;
  let menuLinkStub;

  setup(() => {
    capabilityStub = sinon.stub();
    menuLinkStub = sinon.stub().returns([]);
  });

  const testAdminLinks = (account, options, expected, done) => {
    getAdminLinks(account,
        capabilityStub,
        menuLinkStub,
        options)
        .then(res => {
          assert.equal(expected.totalLength, res.links.length);
          assert.equal(res.links[0].name, 'Repositories');
          // Repos
          if (expected.groupListShown) {
            assert.equal(res.links[1].name, 'Groups');
          }

          if (expected.pluginListShown) {
            assert.equal(res.links[2].name, 'Plugins');
            assert.isNotOk(res.links[2].subsection);
          }

          if (expected.projectPageShown) {
            assert.isOk(res.links[0].subsection);
            assert.equal(res.links[0].subsection.children.length, 6);
          } else {
            assert.isNotOk(res.links[0].subsection);
          }
          // Groups
          if (expected.groupPageShown) {
            assert.isOk(res.links[1].subsection);
            assert.equal(res.links[1].subsection.children.length,
                expected.groupSubpageLength);
          } else if ( expected.totalLength > 1) {
            assert.isNotOk(res.links[1].subsection);
          }

          if (expected.pluginGeneratedLinks) {
            for (const link of expected.pluginGeneratedLinks) {
              const linkMatch = res.links
                  .find(l => (l.url === link.url && l.name === link.text));
              assert.isTrue(!!linkMatch);

              // External links should open in new tab.
              if (link.url[0] !== '/') {
                assert.equal(linkMatch.target, '_blank');
              } else {
                assert.isNotOk(linkMatch.target);
              }
            }
          }

          // Current section
          if (expected.projectPageShown || expected.groupPageShown) {
            assert.isOk(res.expandedSection);
            assert.isOk(res.expandedSection.children);
          } else {
            assert.isNotOk(res.expandedSection);
          }
          if (expected.projectPageShown) {
            assert.equal(res.expandedSection.name, 'my-repo');
            assert.equal(res.expandedSection.children.length, 6);
          } else if (expected.groupPageShown) {
            assert.equal(res.expandedSection.name, 'my-group');
            assert.equal(res.expandedSection.children.length,
                expected.groupSubpageLength);
          }
          done();
        });
  };

  suite('logged out', () => {
    let account;
    let expected;

    setup(() => {
      expected = {
        groupListShown: false,
        groupPageShown: false,
        pluginListShown: false,
      };
    });

    test('without a specific repo or group', done => {
      let options;
      expected = Object.assign(expected, {
        totalLength: 1,
        projectPageShown: false,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('with a repo', done => {
      const options = {repoName: 'my-repo'};
      expected = Object.assign(expected, {
        totalLength: 1,
        projectPageShown: true,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('with plugin generated links', done => {
      let options;
      const generatedLinks = [
        {text: 'internal link text', url: '/internal/link/url'},
        {text: 'external link text', url: 'http://external/link/url'},
      ];
      menuLinkStub.returns(generatedLinks);
      expected = Object.assign(expected, {
        totalLength: 3,
        projectPageShown: false,
        pluginGeneratedLinks: generatedLinks,
      });
      testAdminLinks(account, options, expected, done);
    });
  });

  suite('no plugin capability logged in', () => {
    const account = {
      name: 'test-user',
    };
    let expected;

    setup(() => {
      expected = {
        totalLength: 2,
        pluginListShown: false,
      };
      capabilityStub.returns(Promise.resolve({}));
    });

    test('without a specific project or group', done => {
      let options;
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupListShown: true,
        groupPageShown: false,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('with a repo', done => {
      const account = {
        name: 'test-user',
      };
      const options = {repoName: 'my-repo'};
      expected = Object.assign(expected, {
        projectPageShown: true,
        groupListShown: true,
        groupPageShown: false,
      });
      testAdminLinks(account, options, expected, done);
    });
  });

  suite('view plugin capability logged in', () => {
    const account = {
      name: 'test-user',
    };
    let expected;

    setup(() => {
      capabilityStub.returns(Promise.resolve({viewPlugins: true}));
      expected = {
        totalLength: 3,
        groupListShown: true,
        pluginListShown: true,
      };
    });

    test('without a specific repo or group', done => {
      let options;
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupPageShown: false,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('with a repo', done => {
      const options = {repoName: 'my-repo'};
      expected = Object.assign(expected, {
        projectPageShown: true,
        groupPageShown: false,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('admin with internal group', done => {
      const options = {
        groupId: 'a15262',
        groupName: 'my-group',
        groupIsInternal: true,
        isAdmin: true,
        groupOwner: false,
      };
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupPageShown: true,
        groupSubpageLength: 2,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('group owner with internal group', done => {
      const options = {
        groupId: 'a15262',
        groupName: 'my-group',
        groupIsInternal: true,
        isAdmin: false,
        groupOwner: true,
      };
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupPageShown: true,
        groupSubpageLength: 2,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('non owner or admin with internal group', done => {
      const options = {
        groupId: 'a15262',
        groupName: 'my-group',
        groupIsInternal: true,
        isAdmin: false,
        groupOwner: false,
      };
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupPageShown: true,
        groupSubpageLength: 1,
      });
      testAdminLinks(account, options, expected, done);
    });

    test('admin with external group', done => {
      const options = {
        groupId: 'a15262',
        groupName: 'my-group',
        groupIsInternal: false,
        isAdmin: true,
        groupOwner: true,
      };
      expected = Object.assign(expected, {
        projectPageShown: false,
        groupPageShown: true,
        groupSubpageLength: 0,
      });
      testAdminLinks(account, options, expected, done);
    });
  });

  suite('view plugin screen with plugin capability', () => {
    const account = {
      name: 'test-user',
    };
    let expected;

    setup(() => {
      capabilityStub.returns(Promise.resolve({pluginCapability: true}));
      expected = {};
    });

    test('with plugin with capabilities', done => {
      let options;
      const generatedLinks = [
        {text: 'without capability', url: '/without'},
        {text: 'with capability',
          url: '/with',
          capability: 'pluginCapability'},
      ];
      menuLinkStub.returns(generatedLinks);
      expected = Object.assign(expected, {
        totalLength: 4,
        pluginGeneratedLinks: generatedLinks,
      });
      testAdminLinks(account, options, expected, done);
    });
  });

  suite('view plugin screen without plugin capability', () => {
    const account = {
      name: 'test-user',
    };
    let expected;

    setup(() => {
      capabilityStub.returns(Promise.resolve({}));
      expected = {};
    });

    test('with plugin with capabilities', done => {
      let options;
      const generatedLinks = [
        {text: 'without capability', url: '/without'},
        {text: 'with capability',
          url: '/with',
          capability: 'pluginCapability'},
      ];
      menuLinkStub.returns(generatedLinks);
      expected = Object.assign(expected, {
        totalLength: 3,
        pluginGeneratedLinks: [generatedLinks[0]],
      });
      testAdminLinks(account, options, expected, done);
    });
  });
});

