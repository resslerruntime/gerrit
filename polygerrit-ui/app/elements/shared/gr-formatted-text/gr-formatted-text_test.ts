/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
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
import './gr-formatted-text';
import {
  GrFormattedText,
  Block,
  ListBlock,
  TextBlock,
  QuoteBlock,
} from './gr-formatted-text';

const basicFixture = fixtureFromElement('gr-formatted-text');

suite('gr-formatted-text tests', () => {
  let element: GrFormattedText;

  function assertTextBlock(block: Block, type: string, text: string) {
    assert.equal(block.type, type);
    const textBlock = block as TextBlock;
    assert.equal(textBlock.text, text);
  }

  function assertListBlock(block: Block, items: string[]) {
    assert.equal(block.type, 'list');
    const listBlock = block as ListBlock;
    assert.deepEqual(listBlock.items, items);
  }

  function assertQuoteBlock(block: Block): QuoteBlock {
    assert.equal(block.type, 'quote');
    return block as QuoteBlock;
  }

  setup(() => {
    element = basicFixture.instantiate();
  });

  test('parse empty', () => {
    assert.lengthOf(element._computeBlocks(''), 0);
  });

  test('parse simple', () => {
    const comment = 'Para1';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'paragraph', comment);
  });

  test('parse multiline para', () => {
    const comment = 'Para 1\nStill para 1';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'paragraph', comment);
  });

  test('parse para break without special blocks', () => {
    const comment = 'Para 1\n\nPara 2\n\nPara 3';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'paragraph', comment);
  });

  test('parse quote', () => {
    const comment = '> Quote text';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    const quoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(quoteBlock.blocks[0], 'paragraph', 'Quote text');
  });

  test('parse quote lead space', () => {
    const comment = ' > Quote text';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    const quoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(quoteBlock.blocks[0], 'paragraph', 'Quote text');
  });

  test('parse multiline quote', () => {
    const comment = '> Quote line 1\n> Quote line 2\n > Quote line 3\n';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    const quoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(
      quoteBlock.blocks[0],
      'paragraph',
      'Quote line 1\nQuote line 2\nQuote line 3'
    );
  });

  test('parse pre', () => {
    const comment = '    Four space indent.';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'pre', comment);
  });

  test('parse one space pre', () => {
    const comment = ' One space indent.\n Another line.';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'pre', comment);
  });

  test('parse tab pre', () => {
    const comment = '\tOne tab indent.\n\tAnother line.\n  Yet another!';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'pre', comment);
  });

  test('parse star list', () => {
    const comment = '* Item 1\n* Item 2\n* Item 3';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertListBlock(result[0], ['Item 1', 'Item 2', 'Item 3']);
  });

  test('parse dash list', () => {
    const comment = '- Item 1\n- Item 2\n- Item 3';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertListBlock(result[0], ['Item 1', 'Item 2', 'Item 3']);
  });

  test('parse mixed list', () => {
    const comment = '- Item 1\n* Item 2\n- Item 3\n* Item 4';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertListBlock(result[0], ['Item 1', 'Item 2', 'Item 3', 'Item 4']);
  });

  test('parse mixed block types', () => {
    const comment =
      'Paragraph\nacross\na\nfew\nlines.' +
      '\n\n' +
      '> Quote\n> across\n> not many lines.' +
      '\n\n' +
      'Another paragraph' +
      '\n\n' +
      '* Series\n* of\n* list\n* items' +
      '\n\n' +
      'Yet another paragraph' +
      '\n\n' +
      '\tPreformatted text.' +
      '\n\n' +
      'Parting words.';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 7);
    assertTextBlock(
      result[0],
      'paragraph',
      'Paragraph\nacross\na\nfew\nlines.\n'
    );

    const quoteBlock = assertQuoteBlock(result[1]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(
      quoteBlock.blocks[0],
      'paragraph',
      'Quote\nacross\nnot many lines.'
    );

    assertTextBlock(result[2], 'paragraph', 'Another paragraph\n');
    assertListBlock(result[3], ['Series', 'of', 'list', 'items']);
    assertTextBlock(result[4], 'paragraph', 'Yet another paragraph\n');
    assertTextBlock(result[5], 'pre', '\tPreformatted text.');
    assertTextBlock(result[6], 'paragraph', 'Parting words.');
  });

  test('bullet list 1', () => {
    const comment = 'A\n\n* line 1';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'A\n');
    assertListBlock(result[1], ['line 1']);
  });

  test('bullet list 2', () => {
    const comment = 'A\n\n* line 1\n* 2nd line';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'A\n');
    assertListBlock(result[1], ['line 1', '2nd line']);
  });

  test('bullet list 3', () => {
    const comment = 'A\n* line 1\n* 2nd line\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertListBlock(result[1], ['line 1', '2nd line']);
    assertTextBlock(result[2], 'paragraph', 'B');
  });

  test('bullet list 4', () => {
    const comment = '* line 1\n* 2nd line\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertListBlock(result[0], ['line 1', '2nd line']);
    assertTextBlock(result[1], 'paragraph', 'B');
  });

  test('bullet list 5', () => {
    const comment =
      'To see this bug, you have to:\n' +
      '* Be on IMAP or EAS (not on POP)\n' +
      '* Be very unlucky\n';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'To see this bug, you have to:');
    assertListBlock(result[1], [
      'Be on IMAP or EAS (not on POP)',
      'Be very unlucky',
    ]);
  });

  test('bullet list 6', () => {
    const comment =
      'To see this bug,\n' +
      'you have to:\n' +
      '* Be on IMAP or EAS (not on POP)\n' +
      '* Be very unlucky\n';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'To see this bug,\nyou have to:');
    assertListBlock(result[1], [
      'Be on IMAP or EAS (not on POP)',
      'Be very unlucky',
    ]);
  });

  test('dash list 1', () => {
    const comment = 'A\n- line 1\n- 2nd line';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertListBlock(result[1], ['line 1', '2nd line']);
  });

  test('dash list 2', () => {
    const comment = 'A\n- line 1\n- 2nd line\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertListBlock(result[1], ['line 1', '2nd line']);
    assertTextBlock(result[2], 'paragraph', 'B');
  });

  test('dash list 3', () => {
    const comment = '- line 1\n- 2nd line\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertListBlock(result[0], ['line 1', '2nd line']);
    assertTextBlock(result[1], 'paragraph', 'B');
  });

  test('nested list will NOT be recognized', () => {
    // will be rendered as two separate lists
    const comment = '- line 1\n  - line with indentation\n- line 2';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertListBlock(result[0], ['line 1']);
    assertTextBlock(result[1], 'pre', '  - line with indentation');
    assertListBlock(result[2], ['line 2']);
  });

  test('pre format 1', () => {
    const comment = 'A\n  This is pre\n  formatted';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertTextBlock(result[1], 'pre', '  This is pre\n  formatted');
  });

  test('pre format 2', () => {
    const comment = 'A\n  This is pre\n  formatted\n\nbut this is not';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertTextBlock(result[1], 'pre', '  This is pre\n  formatted');
    assertTextBlock(result[2], 'paragraph', 'but this is not');
  });

  test('pre format 3', () => {
    const comment = 'A\n  Q\n    <R>\n  S\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertTextBlock(result[0], 'paragraph', 'A');
    assertTextBlock(result[1], 'pre', '  Q\n    <R>\n  S');
    assertTextBlock(result[2], 'paragraph', 'B');
  });

  test('pre format 4', () => {
    const comment = '  Q\n    <R>\n  S\n\nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'pre', '  Q\n    <R>\n  S');
    assertTextBlock(result[1], 'paragraph', 'B');
  });

  test('pre format 5', () => {
    const comment = '  Q\n    <R>\n  S\n \nB';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'pre', '  Q\n    <R>\n  S');
    assertTextBlock(result[1], 'paragraph', ' \nB');
  });

  test('quote 1', () => {
    const comment = "> I'm happy with quotes!!";
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    const quoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(
      quoteBlock.blocks[0],
      'paragraph',
      "I'm happy with quotes!!"
    );
  });

  test('quote 2', () => {
    const comment = "> I'm happy\n > with quotes!\n\nSee above.";
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    const quoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(
      quoteBlock.blocks[0],
      'paragraph',
      "I'm happy\nwith quotes!"
    );
    assertTextBlock(result[1], 'paragraph', 'See above.');
  });

  test('quote 3', () => {
    const comment = 'See this said:\n > a quoted\n > string block\n\nOK?';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 3);
    assertTextBlock(result[0], 'paragraph', 'See this said:');
    const quoteBlock = assertQuoteBlock(result[1]);
    assert.lengthOf(quoteBlock.blocks, 1);
    assertTextBlock(
      quoteBlock.blocks[0],
      'paragraph',
      'a quoted\nstring block'
    );
    assertTextBlock(result[2], 'paragraph', 'OK?');
  });

  test('nested quotes', () => {
    const comment = ' > > prior\n > \n > next\n';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    const outerQuoteBlock = assertQuoteBlock(result[0]);
    assert.lengthOf(outerQuoteBlock.blocks, 2);
    const nestedQuoteBlock = assertQuoteBlock(outerQuoteBlock.blocks[0]);
    assert.lengthOf(nestedQuoteBlock.blocks, 1);
    assertTextBlock(nestedQuoteBlock.blocks[0], 'paragraph', 'prior');
    assertTextBlock(outerQuoteBlock.blocks[1], 'paragraph', 'next');
  });

  test('code 1', () => {
    const comment = '```\n// test code\n```';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'code', '// test code');
  });

  test('code 2', () => {
    const comment = 'test code\n```// test code```';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'test code');
    assertTextBlock(result[1], 'code', '// test code');
  });

  test('not a code block', () => {
    const comment = 'test code\n```// test code';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 1);
    assertTextBlock(result[0], 'paragraph', 'test code\n```// test code');
  });

  test('not a code block 2', () => {
    const comment = 'test code\n```\n// test code';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'test code');
    assertTextBlock(result[1], 'paragraph', '```\n// test code');
  });

  test('not a code block 3', () => {
    const comment = 'test code\n```';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 2);
    assertTextBlock(result[0], 'paragraph', 'test code');
    assertTextBlock(result[1], 'paragraph', '```');
  });

  test('mix all 1', () => {
    const comment =
      ' bullets:\n- bullet 1\n- bullet 2\n\ncode example:\n' +
      '```// test code```\n\n> reference is here';
    const result = element._computeBlocks(comment);
    assert.lengthOf(result, 5);
    assert.equal(result[0].type, 'pre');
    assert.equal(result[1].type, 'list');
    assert.equal(result[2].type, 'paragraph');
    assert.equal(result[3].type, 'code');
    assert.equal(result[4].type, 'quote');
  });
});
