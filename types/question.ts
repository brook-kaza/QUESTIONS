export type QuestionCategory =
  | 'ጠቅላላ'
  | 'ለአባቶች'
  | 'ለወጣቶች'
  | 'ለቤተሰብ';

export const CATEGORIES: { id: QuestionCategory; label: string; description: string; icon: string }[] = [
  {
    id: 'ጠቅላላ',
    label: 'ጠቅላላ (General)',
    description: 'ለማንኛውም ርዕስ የሚሆን ጥያቄ',
    icon: 'Sparkles',
  },
  {
    id: 'ለአባቶች',
    label: 'ለአባቶች (For Elders/Fathers)',
    description: 'ለመንፈሳዊ እና የዕድሜ ባለጸጋ አባቶች',
    icon: 'Crown',
  },
  {
    id: 'ለወጣቶች',
    label: 'ለወጣቶች (For Youths)',
    description: 'ስለ ህይወት፣ ትምህርት እና የወጣቶች ተግዳሮቶች',
    icon: 'Users',
  },
  {
    id: 'ለቤተሰብ',
    label: 'ለቤተሰብ (For Families)',
    description: 'ስለ ትዳር፣ የልጆች አስተዳደግ እና የቤት ሰላም',
    icon: 'HeartHandshake',
  },
];

export interface Question {
  id: string;
  content: string;
  author_name: string;
  category: QuestionCategory | string;
  is_answered: boolean;
  is_starred: boolean;
  created_at: string;
}

export type FilterTab = 'all' | 'unread' | 'starred' | 'answered';

