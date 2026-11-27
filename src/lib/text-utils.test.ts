import { describe, expect, it } from 'vitest';
import { applyLineOperation, convertCase, slugify, splitWords, textStats } from './text-utils';

describe('splitWords', () => {
  it('splits identifiers and phrases', () => {
    expect(splitWords('parseHTTPResponse_v2')).toEqual(['parse', 'http', 'response', 'v2']);
    expect(splitWords('  hello-world.foo bar ')).toEqual(['hello', 'world', 'foo', 'bar']);
    expect(splitWords('Grüße aus Köln')).toEqual(['grüße', 'aus', 'köln']);
  });
});

describe('convertCase', () => {
  const src = 'user account ID';
  it.each([
    ['camel', 'userAccountId'],
    ['pascal', 'UserAccountId'],
    ['snake', 'user_account_id'],
    ['constant', 'USER_ACCOUNT_ID'],
    ['kebab', 'user-account-id'],
    ['train', 'User-Account-Id'],
    ['dot', 'user.account.id'],
    ['path', 'user/account/id'],
    ['lower', 'user account id'],
    ['upper', 'USER ACCOUNT ID'],
    ['swap', 'USER ACCOUNT id'],
  ] as const)('%s', (style, expected) => {
    expect(convertCase(src, style)).toBe(expected);
  });

  it('handles title and sentence case', () => {
    expect(convertCase('the lord OF the rings', 'title')).toBe('The Lord of the Rings');
    expect(convertCase('HELLO there. how ARE you? fine!', 'sentence')).toBe('Hello there. How are you? Fine!');
  });

  it('converts each line separately', () => {
    expect(convertCase('first_name\nlast_name', 'camel')).toBe('firstName\nlastName');
  });
});

describe('slugify', () => {
  it('creates URL slugs', () => {
    expect(slugify('  Héllo, Wörld! 2024 ')).toBe('hello-world-2024');
  });
});

describe('applyLineOperation', () => {
  it('sorts, dedupes and reshapes lines', () => {
    expect(applyLineOperation('b\na\nB', 'sort-asc')).toBe('a\nb\nB');
    expect(applyLineOperation('item10\nitem2\nitem1', 'sort-natural')).toBe('item1\nitem2\nitem10');
    expect(applyLineOperation('a\nb\na', 'dedupe')).toBe('a\nb');
    expect(applyLineOperation('a\n\n  \nb', 'remove-empty')).toBe('a\nb');
    expect(applyLineOperation('a\nb', 'number')).toBe('1. a\n2. b');
    expect(applyLineOperation('a\n b \n', 'join')).toBe('a, b');
    expect(applyLineOperation('a, b,,c', 'split-commas')).toBe('a\nb\nc');
    expect(applyLineOperation('1\n2\n3', 'shuffle', () => 0)).toBe('2\n3\n1');
  });
});

describe('textStats', () => {
  it('counts characters, words, lines and bytes', () => {
    const s = textStats("Hello world. It's 2024!\n\nNew paragraph 👋");
    expect(s.words).toBe(6);
    expect(s.lines).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.sentences).toBe(3);
    expect(s.characters).toBe(40);
    expect(s.bytes).toBe(43);
    expect(textStats('')).toMatchObject({ words: 0, lines: 0, characters: 0 });
  });
});
