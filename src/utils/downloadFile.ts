// src/utils/downloadFile.ts

export function downloadFile(fileUrl: string, fileName: string, fileType?: string) {
    if (!fileUrl) {
      alert('File tidak tersedia!');
      return;
    }
  
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  
    if (fileUrl.startsWith('data:')) {
      try {
        const [header, base64Data] = fileUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : fileType || guessMimeType(fileName);
  
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        triggerDownload(blob, fileName);
        return;
      } catch (err) {
        console.error('Gagal konversi data URL:', err);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }
  
    try {
      const mime = fileType || guessMimeType(fileName);
      const byteCharacters = atob(fileUrl);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      triggerDownload(blob, fileName);
    } catch (err) {
      console.error('Download error:', err);
      alert('Gagal download file. File mungkin rusak.');
    }
  }
  
  function triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  
  function guessMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      zip: 'application/zip',
    };
    return map[ext] || 'application/octet-stream';
  }