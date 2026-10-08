/**
 * Utility untuk menentukan cara preview file
 * Mendukung: PDF, Image, Word (.doc/.docx), Excel, PowerPoint
 */

export type PreviewType = 'pdf' | 'image' | 'office' | 'unsupported';

export interface PreviewInfo {
  type: PreviewType;
  url: string | null;
  canPreview: boolean;
  isDataUrl: boolean;
}

export const isDataUrl = (url: string): boolean => {
  return typeof url === 'string' && url.startsWith('data:');
};

export const isPublicUrl = (url: string): boolean => {
  return (
    typeof url === 'string' &&
    (url.startsWith('http://') || url.startsWith('https://'))
  );
};

export const getExtension = (fileName: string): string => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

export const getPreviewInfo = (
  fileUrl: string,
  fileName: string,
  fileType?: string
): PreviewInfo => {
  const ext = getExtension(fileName);
  const isData = isDataUrl(fileUrl);
  const isPublic = isPublicUrl(fileUrl);

  // === PDF ===
  if (ext === 'pdf' || fileType === 'application/pdf') {
    return {
      type: 'pdf',
      url: fileUrl,
      canPreview: true,
      isDataUrl: isData,
    };
  }

  // === Image ===
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  if (imageExts.includes(ext) || fileType?.startsWith('image/')) {
    return {
      type: 'image',
      url: fileUrl,
      canPreview: true,
      isDataUrl: isData,
    };
  }

  // === Office (Word, Excel, PPT) ===
  const officeExts = [
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'odt', 'ods', 'odp', 'rtf',
  ];
  if (officeExts.includes(ext)) {
    if (isPublic) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      return {
        type: 'office',
        url: officeViewerUrl,
        canPreview: true,
        isDataUrl: false,
      };
    }
    return {
      type: 'office',
      url: null,
      canPreview: false,
      isDataUrl: isData,
    };
  }

  return {
    type: 'unsupported',
    url: null,
    canPreview: false,
    isDataUrl: isData,
  };
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};