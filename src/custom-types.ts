import type { BaseEditor } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { HistoryEditor } from 'slate-history';

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export type ParagraphElement = {
  type: 'paragraph';
  align?: 'left' | 'center' | 'right' | 'justify';
  children: CustomText[];
};

export type HeadingElement = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: CustomText[];
};

export type SceneElement = {
  type: 'scene';
  children: CustomText[];
};

export type CustomElement = ParagraphElement | HeadingElement | SceneElement;

export type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
};

export type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
