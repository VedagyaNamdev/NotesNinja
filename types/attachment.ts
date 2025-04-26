export interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: string | Date;
  userId: string;
}

export interface AttachmentWithData extends Attachment {
  data: Blob | ArrayBuffer | null;
}

export interface CreateAttachmentData {
  file: File;
  userId: string;
} 