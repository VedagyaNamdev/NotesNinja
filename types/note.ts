import { Attachment } from './attachment';

export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  keyTerms?: string | null;
  bullets?: string | null;
  favorite: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  userId: string;
  attachmentId?: string | null;
  attachment?: Attachment | null;
}

export interface NoteWithMetadata extends Note {
  tags?: string[];
} 