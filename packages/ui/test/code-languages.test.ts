import { afterEach, describe, expect, it } from 'vitest';

import {
  CODE_LANGUAGES,
  codeLanguageLabel,
  registerCodeLanguages,
  resetCodeLanguages,
  resolveCodeLanguage,
  toCodeVariants,
} from '../../../registry/velobits/lib/code-languages';

/**
 * The registry is MODULE-LEVEL mutable state , deliberately, so configuring it
 * costs a call at app entry rather than a provider every consumer must remember.
 * The price is exactly this: a registration made in one test is still there in
 * the next file vitest loads into the same worker. Resetting after each case is
 * what keeps `code-block.test.tsx` from inheriting a Python that only this file
 * ever asked for.
 */
afterEach(resetCodeLanguages);

describe('resolveCodeLanguage', () => {
  it('resolves a built-in to its shipped definition', () => {
    expect(resolveCodeLanguage('ts')).toEqual({
      id: 'ts',
      label: 'TypeScript',
      shortLabel: 'TS',
      grammar: 'tsx',
      extension: '.tsx',
    });
  });

  it('lets a registration WIN over a built-in of the same id', () => {
    /**
     * The documented precedence, and the supported way to restyle one of ours ,
     * e.g. giving `ts` TypeScript's own blue. It is a separate Map rather than a
     * write into `CODE_LANGUAGES` precisely so this direction is stated instead
     * of being whichever module happened to run last.
     */
    registerCodeLanguages([
      { id: 'ts', label: 'TypeScript', shortLabel: '.ts', accent: '#3178c6' },
    ]);
    expect(resolveCodeLanguage('ts').accent).toBe('#3178c6');
    expect(resolveCodeLanguage('ts').shortLabel).toBe('.ts');
  });

  it('never mutates the shipped record, so the override is reversible', () => {
    registerCodeLanguages([{ id: 'ts', label: 'Nonsense' }]);
    expect(CODE_LANGUAGES['ts']!.label).toBe('TypeScript');
    resetCodeLanguages();
    expect(resolveCodeLanguage('ts').label).toBe('TypeScript');
  });

  it('synthesises a usable definition for an unknown id instead of throwing', () => {
    /**
     * A missing entry is a LABELLING problem, not a rendering one: the block
     * still has code and still has to show it. So the id becomes its own label
     * , the selector reads `graphql` rather than going blank , and the only
     * things lost are the abbreviation and the accent.
     */
    expect(resolveCodeLanguage('graphql')).toEqual({ id: 'graphql', label: 'graphql' });
    expect(resolveCodeLanguage('graphql').shortLabel).toBeUndefined();
    expect(resolveCodeLanguage('graphql').accent).toBeUndefined();
  });

  it('reads custom before built-in before fallback, in that order', () => {
    expect(resolveCodeLanguage('py').label).toBe('py'); // fallback
    registerCodeLanguages([{ id: 'py', label: 'Python', shortLabel: 'PY' }]);
    expect(resolveCodeLanguage('py').label).toBe('Python'); // custom
    expect(resolveCodeLanguage('json').label).toBe('JSON'); // built-in, untouched
  });
});

describe('codeLanguageLabel', () => {
  it('prefers the short label, because the selector is a corner control', () => {
    expect(codeLanguageLabel('ts')).toBe('TS');
    expect(codeLanguageLabel('bash')).toBe('sh');
  });

  it('falls back to the full label when there is no short one', () => {
    registerCodeLanguages([{ id: 'elixir', label: 'Elixir' }]);
    expect(codeLanguageLabel('elixir')).toBe('Elixir');
  });

  it('prints the raw id for a language nobody registered', () => {
    expect(codeLanguageLabel('zig')).toBe('zig');
  });
});

describe('toCodeVariants', () => {
  it('passes an array through, order intact', () => {
    const variants = [
      { language: 'ts', code: 'const a = 1;' },
      { language: 'js', code: 'var a = 1;', html: '<span>var a = 1;</span>' },
    ];
    expect(toCodeVariants(variants)).toEqual(variants);
  });

  it('expands the record form in declaration order', () => {
    /**
     * Order is not cosmetic here , the FIRST entry is the block's default, which
     * is the whole mechanism by which a block keeps its own language. Object key
     * order carries it for the record form, so it is asserted rather than
     * assumed.
     */
    expect(toCodeVariants({ ts: 'const a = 1;', js: 'var a = 1;' })).toEqual([
      { language: 'ts', code: 'const a = 1;' },
      { language: 'js', code: 'var a = 1;' },
    ]);
  });

  it('treats absence as an empty list rather than as a failure', () => {
    expect(toCodeVariants(undefined)).toEqual([]);
    expect(toCodeVariants([])).toEqual([]);
    expect(toCodeVariants({})).toEqual([]);
  });

  it('carries no html for the record form, which has nowhere to put it', () => {
    const [first] = toCodeVariants({ bash: 'curl -s https://api.example.com' });
    expect(first!.html).toBeUndefined();
  });
});

describe('registerCodeLanguages / resetCodeLanguages', () => {
  it('registers several at once and drops all of them on reset', () => {
    registerCodeLanguages([
      { id: 'py', label: 'Python', shortLabel: 'PY', accent: '#3776ab' },
      { id: 'go', label: 'Go', shortLabel: 'GO' },
    ]);
    expect(codeLanguageLabel('py')).toBe('PY');
    expect(codeLanguageLabel('go')).toBe('GO');

    resetCodeLanguages();
    expect(codeLanguageLabel('py')).toBe('py');
    expect(codeLanguageLabel('go')).toBe('go');
  });

  it('lets a later registration replace an earlier one of the same id', () => {
    registerCodeLanguages([{ id: 'py', label: 'Python 2' }]);
    registerCodeLanguages([{ id: 'py', label: 'Python 3' }]);
    expect(resolveCodeLanguage('py').label).toBe('Python 3');
  });

  it('is a no-op on an empty list', () => {
    registerCodeLanguages([]);
    expect(resolveCodeLanguage('ts').label).toBe('TypeScript');
  });
});
