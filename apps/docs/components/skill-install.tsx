'use client';

import { useId, useState } from 'react';

import { CodeBlock, SegmentedControl } from '@velobitsio/ui';

import { SKILL_FILES, SKILL_NAME } from '@/lib/generated/skill';

/**
 * The install picker on `/docs/skill`.
 *
 * Four decisions the reader has to make before a command is correct , which agent,
 * this project or the whole machine, and on Windows or not , and every combination
 * lands somewhere different. Printing all of them as prose was six code blocks
 * where five are wrong for any given reader.
 *
 * ## The commands are built, not typed
 *
 * The reference filenames come from `lib/generated/skill.ts`, written by
 * `scripts/build-docs-data.ts` from `skills/velobits-ui/`. A `curl` loop has to
 * name each file, so a hand-written list here is a five-file skill with a
 * four-file install command the day someone adds a reference.
 *
 * ## Every block is a `CodeBlock`, and every block is copyable
 *
 * Including the multi-line scripts. These are meant to be pasted, not read, and a
 * seven-line snippet a reader has to select by hand is the one they will get wrong.
 */

const ORIGIN = 'https://ui.velobits.dev';
const SKILL_BASE = `${ORIGIN}/skills/${SKILL_NAME}`;

/** `references/frameworks.md` → `frameworks`, which is what a shell loop wants. */
const REFERENCE_NAMES = SKILL_FILES.filter((file) => file.startsWith('references/')).map((file) =>
  file.replace('references/', '').replace(/\.md$/, ''),
);

interface ScriptSpec {
  /** Where the files go, POSIX form. `$HOME` is substituted per shell. */
  dir: string;
  /** The entry point: its filename at the origin, and the name it lands under. */
  entry: { from: string; to: string };
  /** Where the reference files land, relative to `dir`. */
  referenceDir: string;
  /** Appends a pointer to a file the agent already reads, e.g. `AGENTS.md`. */
  appendTo?: string;
}

interface Recipe {
  /** One line, in prose: where this combination puts things. */
  lands: string;
  /**
   * The shadcn one-liner, where one exists.
   *
   * `item` is the namespaced form, which is what to type: `@velobits` is a
   * registered namespace, and shadcn's public index maps it to a URL TEMPLATE
   * (`https://ui.velobits.dev/r/{name}.json`), not to a list of items, so a name
   * absent from our own index still resolves. `url` is the same item spelled out,
   * for a CLI too old to know about the index or a machine that cannot reach it.
   */
  cli?: { item: string; url: string };
  /** Fetches the files with no CLI and no config. */
  script?: ScriptSpec;
  /** For a target that is a text box rather than a path. */
  paste?: string;
  notes: string[];
}

const POINTER = `Before writing or reviewing UI, read the VeloBits skill`;

const RECIPES: Record<string, Recipe> = {
  'claude:project': {
    lands: `.claude/skills/${SKILL_NAME}/`,
    cli: { item: '@velobits/skill', url: `${ORIGIN}/r/skill.json` },
    script: {
      dir: `.claude/skills/${SKILL_NAME}`,
      entry: { from: 'SKILL.md', to: 'SKILL.md' },
      referenceDir: 'references',
    },
    notes: [
      'Claude Code loads project skills from `.claude/skills/`, so a new session picks it up with nothing else to configure.',
      'Commit the folder. It is guidance about a dependency, so it belongs beside the dependency, and then every agent anyone points at the repo starts from the same rules.',
      'In a monorepo, run it from the workspace that should own the file, or pass `--cwd apps/web`.',
    ],
  },
  'claude:global': {
    lands: `~/.claude/skills/${SKILL_NAME}/`,
    script: {
      dir: `$HOME/.claude/skills/${SKILL_NAME}`,
      entry: { from: 'SKILL.md', to: 'SKILL.md' },
      referenceDir: 'references',
    },
    notes: [
      'No CLI form here: the shadcn CLI resolves its targets against a project root, so it cannot write outside one.',
      'User skills apply to every project on the machine and are invisible to your teammates. Prefer the project install for anything a team shares.',
    ],
  },
  'cursor:project': {
    lands: `.cursor/rules/${SKILL_NAME}.mdc`,
    cli: { item: '@velobits/skill-cursor', url: `${ORIGIN}/r/skill-cursor.json` },
    script: {
      dir: '.cursor/rules',
      entry: { from: `${SKILL_NAME}.mdc`, to: `${SKILL_NAME}.mdc` },
      referenceDir: SKILL_NAME,
    },
    notes: [
      'Cursor reads `.mdc` and ignores a plain `.md` in that directory, so the entry point ships with Cursor frontmatter instead of ours: same content, `alwaysApply: false`, matched on its description.',
      `The reference files land in \`.cursor/rules/${SKILL_NAME}/\` as plain \`.md\`, deliberately outside the rules system. They are meant to be opened on demand, by path, which the entry point tells the agent to do.`,
      'Reload the window afterwards so Cursor re-reads the directory.',
    ],
  },
  'cursor:global': {
    lands: 'Cursor Settings → Rules → User Rules',
    paste: `${POINTER} at ${SKILL_BASE}/SKILL.md, and the reference files it links.`,
    notes: [
      'Cursor keeps global rules as plain text in Settings, not as a file, so there is nothing to install: paste a pointer and let the agent fetch the rest.',
      'A pointer is weaker than the files. Project rules are the install that actually carries the content, so use this only for machines where you want a default.',
    ],
  },
  'agents:project': {
    lands: `AGENTS.md, with the files in .agents/${SKILL_NAME}/`,
    script: {
      dir: `.agents/${SKILL_NAME}`,
      entry: { from: 'SKILL.md', to: 'SKILL.md' },
      referenceDir: 'references',
      appendTo: 'AGENTS.md',
    },
    notes: [
      'Codex, and anything else that reads `AGENTS.md`, takes one file. So the skill lands next to it and `AGENTS.md` gets a pointer, which is what keeps the instructions one thing to update rather than two.',
      'There is no standard location for the files themselves. `.agents/` is a choice, not a convention; move them wherever your team keeps agent documentation and fix the pointer.',
    ],
  },
  'agents:global': {
    lands: `~/.codex/AGENTS.md, with the files in ~/.agents/${SKILL_NAME}/`,
    script: {
      dir: `$HOME/.agents/${SKILL_NAME}`,
      entry: { from: 'SKILL.md', to: 'SKILL.md' },
      referenceDir: 'references',
      appendTo: '$HOME/.codex/AGENTS.md',
    },
    notes: [
      'Codex reads `$CODEX_HOME/AGENTS.md` (`~/.codex` by default) before any project file. Other tools with a global instruction file take the same two steps against their own path.',
      'Global instructions apply to every repository you open, including ones that have never heard of VeloBits, so keep the pointer short and let the skill carry the detail.',
    ],
  },
};

function bashScript({ dir, entry, referenceDir, appendTo }: ScriptSpec): string {
  const lines = [
    `base=${SKILL_BASE}`,
    `dir=${dir.includes('$HOME') ? `"${dir}"` : dir}`,
    `mkdir -p "$dir/${referenceDir}"`,
    `curl -sSfL "$base/${entry.from}" -o "$dir/${entry.to}"`,
    `for f in ${REFERENCE_NAMES.join(' ')}; do`,
    `  curl -sSfL "$base/references/$f.md" -o "$dir/${referenceDir}/$f.md"`,
    'done',
  ];

  if (appendTo) {
    lines.push(
      '',
      // `>>`, and a heading, so an AGENTS.md that already says something keeps
      // saying it. Never `>`.
      `printf '\\n## VeloBits UI\\n\\n${POINTER} at %s/${entry.to}.\\n' "$dir" >> ${appendTo.includes('$HOME') ? `"${appendTo}"` : appendTo}`,
    );
  }

  return lines.join('\n');
}

/*
 * Forward slashes and `$HOME` are left exactly as they are: PowerShell resolves
 * both, and rewriting them to `\` and `$env:USERPROFILE` would make the snippet
 * Windows-only, which PowerShell is not. Single quotes for a literal path, double
 * quotes only where `$HOME` has to expand.
 */
function powershellScript({ dir, entry, referenceDir, appendTo }: ScriptSpec): string {
  const quote = (path: string) => (path.includes('$HOME') ? `"${path}"` : `'${path}'`);
  const lines = [
    `$base = '${SKILL_BASE}'`,
    `$dir = ${quote(dir)}`,
    `New-Item -ItemType Directory -Force "$dir/${referenceDir}" | Out-Null`,
    `Invoke-WebRequest "$base/${entry.from}" -OutFile "$dir/${entry.to}"`,
    `${REFERENCE_NAMES.map((name) => `'${name}'`).join(',')} | ForEach-Object {`,
    `  Invoke-WebRequest "$base/references/$_.md" -OutFile "$dir/${referenceDir}/$_.md"`,
    '}',
  ];

  if (appendTo) {
    lines.push(
      '',
      `Add-Content ${quote(appendTo)} "\`n## VeloBits UI\`n\`n${POINTER} at $dir/${entry.to}."`,
    );
  }

  return lines.join('\n');
}

const AGENTS = [
  { value: 'claude', label: 'Claude Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'agents', label: 'AGENTS.md' },
];

const SCOPES = [
  { value: 'project', label: 'This project' },
  { value: 'global', label: 'This machine' },
];

const SHELLS = [
  { value: 'bash', label: 'bash' },
  { value: 'powershell', label: 'PowerShell' },
];

function Choice({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  // `aria-labelledby` rather than `aria-label`: the caption is already on screen,
  // and a duplicate name is a second string to keep in step with it.
  const id = useId();

  return (
    <div className="space-y-1.5">
      <p id={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <SegmentedControl
        aria-labelledby={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
      />
    </div>
  );
}

export function SkillInstall() {
  const [agent, setAgent] = useState('claude');
  const [scope, setScope] = useState('project');
  const [shell, setShell] = useState('bash');

  const recipe = RECIPES[`${agent}:${scope}`]!;
  const script = recipe.script
    ? shell === 'bash'
      ? bashScript(recipe.script)
      : powershellScript(recipe.script)
    : null;

  return (
    <div className="my-6 space-y-5 rounded-lg border border-border bg-bg2 p-4">
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <Choice label="Agent" value={agent} onValueChange={setAgent} options={AGENTS} />
        <Choice label="Install for" value={scope} onValueChange={setScope} options={SCOPES} />
        {script && <Choice label="Shell" value={shell} onValueChange={setShell} options={SHELLS} />}
      </div>

      <p className="text-sm text-muted-foreground">
        Lands in <code className="font-mono text-[0.85em] text-fg">{recipe.lands}</code>
      </p>

      {recipe.cli && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            With the shadcn CLI, in a project that has a{' '}
            <code className="font-mono text-[0.9em]">components.json</code>
          </p>
          <CodeBlock variant="terminal" wrap copyable label="install command">
            {`npx shadcn@latest add ${recipe.cli.item}`}
          </CodeBlock>
          <p className="text-xs text-muted-foreground">
            Nothing to configure: <code className="font-mono text-[0.9em]">@velobits</code> is a
            registered namespace. On a CLI older than v3, or anywhere that cannot reach
            shadcn&rsquo;s index, name the file instead:{' '}
            <code className="font-mono text-[0.9em]">{recipe.cli.url}</code>
          </p>
        </div>
      )}

      {script && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {recipe.cli ? 'Or with no CLI and no config' : 'Fetch the files'}
          </p>
          <CodeBlock variant="terminal" copyable label="install script">
            {script}
          </CodeBlock>
        </div>
      )}

      {recipe.paste && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Paste this in</p>
          <CodeBlock variant="terminal" wrap copyable label="rule text">
            {recipe.paste}
          </CodeBlock>
        </div>
      )}

      <ul className="list-disc space-y-1.5 ps-5 text-sm text-muted-foreground">
        {recipe.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
