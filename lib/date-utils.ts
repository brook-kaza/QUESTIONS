export function formatAmharicTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 45) {
      return 'አሁን';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `ከ ${diffInMinutes} ደቂቃ በፊት`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `ከ ${diffInHours} ሰዓት በፊት`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'ትናንት';
    }
    if (diffInDays < 7) {
      return `ከ ${diffInDays} ቀን በፊት`;
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'ጥቂት ደቂቃ በፊት';
  }
}

