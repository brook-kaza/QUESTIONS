import { Question } from '@/types/question';

export const INITIAL_SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'demo-1',
    content: 'በዘመናችን ወጣቶች በመንፈሳዊ ህይወት እና በዘመናዊ ቴክኖሎጂ ተጽዕኖ መካከል ሚዛናቸውን እንዴት መጠበቅ ይችላሉ?',
    author_name: 'ዳዊት ተክሌ',
    category: 'ለወጣቶች',
    is_answered: false,
    is_starred: true,
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'demo-2',
    content: 'በቤተሰብ ውስጥ አለመግባባቶች ሲፈጠሩ በክርስቲያናዊ ፍቅርና ትዕግሥት እንዴት መፍታት ይቻላል?',
    author_name: 'አዳነች በቀለ',
    category: 'ለቤተሰብ',
    is_answered: false,
    is_starred: false,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'demo-3',
    content: 'አባቶቻችን በፈተና ወቅት ያሳዩት ጽናት ለዛሬው ትውልድ ምን ዓይነት ትምህርት ይሰጣል? እባክዎ የምክረ አበው ማጠቃለያ ያካፍሉን።',
    author_name: 'አይታወቅም',
    category: 'ለአባቶች',
    is_answered: false,
    is_starred: true,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'demo-4',
    content: 'የዚህ ዝግጅት ቀጣይ ክፍለ ጊዜ መቼ ነው የሚካሄደው? እንዲሁም መጽሐፉን ከየት ማግኘት እንችላለን?',
    author_name: 'ተስፋዬ ወልደማርያም',
    category: 'ጠቅላላ',
    is_answered: true,
    is_starred: false,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
];

