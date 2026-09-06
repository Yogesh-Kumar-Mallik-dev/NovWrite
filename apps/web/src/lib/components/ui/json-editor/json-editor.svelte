<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { basicSetup, EditorView } from 'codemirror';
  import { EditorState, Compartment } from '@codemirror/state';
  import { json } from '@codemirror/lang-json';
  import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
  import { tags as t } from '@lezer/highlight';
  import { cn } from '$lib/utils';
  import { themeStore } from '$lib/stores/themeStore.svelte';

  interface Props {
    value?: string;
    class?: string;
    height?: string;
    readonly?: boolean;
    onchange?: (val: string) => void;
  }

  let {
    value = $bindable(''),
    class: className = '',
    height = '500px',
    readonly = false,
    onchange,
  }: Props = $props();

  let containerEl = $state<HTMLDivElement | null>(null);
  let view: EditorView | null = null;
  let isUpdatingFromProp = false;

  const themeConfig = new Compartment();
  const readOnlyConfig = new Compartment();

  // Custom Highlight Styles matching NovWrite modern design tokens
  const novwriteHighlightStyle = HighlightStyle.define([
    { tag: t.propertyName, color: '#38bdf8', fontWeight: '600' }, // Cyan property keys
    { tag: t.string, color: '#34d399' }, // Emerald string values
    { tag: t.number, color: '#fb923c' }, // Orange numeric values
    { tag: t.bool, color: '#f43f5e', fontWeight: 'bold' }, // Rose booleans
    { tag: t.null, color: '#a855f7', fontWeight: 'bold' }, // Purple null
    { tag: t.punctuation, color: '#94a3b8' }, // Slate brackets & commas
    { tag: t.bracket, color: '#cbd5e1' }, // Brackets
    { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
    { tag: t.invalid, color: '#ef4444', textDecoration: 'underline' },
  ]);

  function getEditorTheme(isDark: boolean) {
    return EditorView.theme(
      {
        '&': {
          height: height || '100%',
          fontSize: '12px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          backgroundColor: 'transparent',
          color: 'var(--foreground)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          lineHeight: '1.6',
          fontFamily: 'inherit',
        },
        '.cm-content': {
          padding: '12px 0',
          caretColor: 'var(--primary)',
        },
        '&.cm-focused': {
          outline: 'none',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: 'var(--primary)',
          borderLeftWidth: '2px',
        },
        '.cm-gutters': {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)',
          color: 'var(--muted-foreground)',
          borderRight: '1px solid var(--border)',
          paddingRight: '4px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          color: 'var(--foreground)',
          fontWeight: 'bold',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
        },
        '.cm-selectionMatch': {
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.2)',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.35) !important' : 'rgba(56, 189, 248, 0.25) !important',
        },
        '.cm-matchingBracket, .cm-nonmatchingBracket': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
          color: '#38bdf8 !important',
          fontWeight: 'bold',
        },
      },
      { dark: isDark }
    );
  }

  onMount(() => {
    if (!containerEl) return;

    const isDark = themeStore.mode === 'dark';

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingFromProp) {
        const newDoc = update.state.doc.toString();
        value = newDoc;
        onchange?.(newDoc);
      }
    });

    const state = EditorState.create({
      doc: value || '',
      extensions: [
        basicSetup,
        json(),
        syntaxHighlighting(novwriteHighlightStyle),
        EditorView.lineWrapping,
        themeConfig.of(getEditorTheme(isDark)),
        readOnlyConfig.of(EditorState.readOnly.of(readonly)),
        updateListener,
      ],
    });

    view = new EditorView({
      state,
      parent: containerEl,
    });
  });

  // Sync external value changes to CodeMirror document
  $effect(() => {
    const currentVal = value;
    if (view && currentVal !== undefined) {
      const editorText = view.state.doc.toString();
      if (currentVal !== editorText) {
        isUpdatingFromProp = true;
        view.dispatch({
          changes: { from: 0, to: editorText.length, insert: currentVal },
        });
        isUpdatingFromProp = false;
      }
    }
  });

  // Sync theme changes
  $effect(() => {
    const isDark = themeStore.mode === 'dark';
    if (view) {
      view.dispatch({
        effects: themeConfig.reconfigure(getEditorTheme(isDark)),
      });
    }
  });

  // Sync readonly changes
  $effect(() => {
    if (view) {
      view.dispatch({
        effects: readOnlyConfig.reconfigure(EditorState.readOnly.of(readonly)),
      });
    }
  });

  onDestroy(() => {
    if (view) {
      view.destroy();
      view = null;
    }
  });
</script>

<div
  class={cn(
    'relative w-full rounded-lg border border-border bg-card/60 backdrop-blur-xs overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition shadow-xs',
    className
  )}
>
  <div bind:this={containerEl} class="w-full h-full"></div>
</div>
