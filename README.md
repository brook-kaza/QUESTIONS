# ምክረ አበው — የቀጥታ ጥያቄና መልስ ማሰባሰቢያ ድረ-ገጽ (Mikre Abew Q&A)

ለ **"ምክረ አበው"** ዝግጅት የተዘጋጀ ፈጣን፣ ቀላል እና ለስልኮች ምቹ የሆነ የቀጥታ ጥያቄና መልስ መሰብሰቢያ እና የመድረክ ዳሽቦርድ ድረ-ገጽ። 

ይህ መተግበሪያ በ **Next.js (App Router)**፣ **Tailwind CSS**፣ **TypeScript** እና **Supabase Realtime** የተገነባ ሲሆን ሙሉ ይዘቱ በ**አማርኛ ቋንቋ** የተዘጋጀ ነው።

---

## 🌟 ዋና ዋና ገጽታዎች (Features)

### 1. የሕዝብ ጥያቄ ማቅረቢያ ገጽ (`/`):
- **ርዕስ:** "ምክረ አበው - የጥያቄ ማቅረቢያ"
- **ንዑስ ርዕስ:** "ጥያቄዎች በዝግጅቱ ላይ በቀጥታ በመድረክ መልስ ያገኛሉ።"
- **የጥያቄ ዘርፍ መራጭ:**
  - `ጠቅላላ (General)`
  - `ለአባቶች (For Elders/Fathers)`
  - `ለወጣቶች (For Youths)`
  - `ለቤተሰብ (For Families)`
- **ቀላል ቅጽ:**
  - ጥያቄ መፃፊያ ሳጥን (ቢያንስ 10 ፊደላት) ከቀጥታ ቆጣሪ ጋር
  - የስም መሙያ (አማራጭ — ካልተሞላ በራስ-ሰር "አይታወቅም" ይሆናል)
  - የላኪ ቁልፍ ("ጥያቄ ላክ" / "እየላከ ነው...")
  - ስኬታማ መልዕክትና የበዓል ኮንፌቲ ("ጥያቄዎ ገብቷል! በመድረክ ይመለሳል።")

### 2. የአስተባባሪዎች እና የመድረክ ዳሽቦርድ (`/admin`):
- **የተጠበቀ መግቢያ:** በፈጣን ፒን ኮድ (`ADMIN_PIN`፣ መደበኛ `2223`) ወይም በሱፓቤዝ መለያ (Supabase Auth)።
- **የቀጥታ ስርጭት (Supabase Realtime Sync):** ተሳታፊዎች ከስልካቸው የላኩት ጥያቄ ገጹን ዳግም መጫን (refresh) ሳያስፈልግ በቅጽበት በዳሽቦርዱ ላይ ይወጣል።
- **የድምፅ ማሳወቂያ (Audio Chime):** አዲስ ጥያቄ ሲገባ የሚሰማ ለስላሳ የድምፅ ማሳወቂያ (ማብሪያ/ማጥፊያ ያለው)።
- **የማጣሪያ ክፍሎች (Filter Tabs):**
  - "ሁሉም (All)"
  - "ያነበቡት / ያልተመለሱ (Unread/Pending)"
  - "ኮከብ የተደረገባቸው (Starred)"
  - "መልስ የተሰጠባቸው (Answered)"
- **የዘርፍ እና የፍለጋ ማጣሪያ:** በዘርፍ መለየት እና በጽሁፍ ወይም በስም መፈለጊያ።
- **የእያንዳንዱ ጥያቄ መቆጣጠሪያዎች:**
  - `መልስ ተሰጥቷል` (ምልክት ሲደረግበት ደብዘዝ ይላል / ተሰርዞ ወደታች ይወርዳል)
  - `አስፈላጊ (Star/Highlight)` (ቅድሚያ የሚሰጣቸውን ጥያቄዎች በወርቃማ ፍንጣቂ ከላይ ያሰልፋል)
  - `ቅዳ` እና `ሰርዝ`
- **የመድረክ አቀራረብ ሁነታ (Presenter Mode):**
  - ለመድረክ መሪዎች፣ ለታብሌቶች ወይም በመድረክ ስክሪን ላይ ለማሳየት የተዘጋጀ ከፍተኛ ንፅፅር (High Contrast Dark Mode)።
  - ትላልቅና ግልጽ የአማርኛ ፊደላት (ከ 10-15 ሜትር ርቀት በግልጽ የሚነበብ)።
  - የቁልፍ ሰሌዳ አቋራጮች (`←` / `→` ለመቀያየር፣ `S` ለኮከብ፣ `Space` ለመመለስ፣ `Esc` ለመውጣት)።
  - ሙሉ ስክሪን (Fullscreen) ማድረጊያ።

---

## 🗄️ የሱፓቤዝ (Supabase) አወቃቀር እና ዳታቤዝ

### 1. የዳታቤዝ ሰንጠረዥ (`questions`)
በ [`supabase/schema.sql`](file:///c:/Users/lenovo/quesions/supabase/schema.sql) ውስጥ የሚገኘውን ሙሉ የ SQL ኮድ በ Supabase SQL Editor ውስጥ ኮፒ በማድረግ **Run** ይበሉ።

```sql
-- የጥያቄዎች ሰንጠረዥ
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_name TEXT DEFAULT 'አይታወቅም',
    category TEXT DEFAULT 'ጠቅላላ',
    is_answered BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- ህዝቡ ጥያቄ እንዲልክ መፍቀድ (INSERT)
CREATE POLICY "Public can submit questions"
ON public.questions FOR INSERT TO anon, authenticated
WITH CHECK (char_length(trim(content)) >= 10);

-- አድሚኖች ሙሉ መረጃ እንዲያዩ እና እንዲያሻሽሉ መፍቀድ
CREATE POLICY "Authorized admins can view questions"
ON public.questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authorized admins can update questions"
ON public.questions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- የቀጥታ ስርጭት (Supabase Realtime) ማብራት
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
```

> **ማስታወሻ:** በአስተባባሪዎች በኩል ያለ Supabase User አካውንት በፈጣን ፒን (PIN) ብቻ በክላይንት መጠቀም ከፈለጉ በ `supabase/schema.sql` ውስጥ የተጠቀሱትን ሁለት የ `anon` SELECT እና UPDATE ፖሊሲዎች ያብሩ።

---

## 🚀 በቨርሰል (Vercel) ላይ የማስተናገድ መመሪያ (Deployment Instructions)

### ደረጃ 1: ኮዱን ወደ GitHub መጫን
```bash
git add .
git commit -m "feat: Mikre Abew Amharic Q&A Application"
git push origin main
```

### ደረጃ 2: በ Vercel Dashboard ላይ ፕሮጀክቱን ማገናኘት
1. ወደ [vercel.com](https://vercel.com) በመግባት **Add New Project** የሚለውን ይጫኑ።
2. የ GitHub ማከማቻዎን (Repository) ይምረጡ።
3. **Environment Variables** በሚለው ክፍል የሚከተሉትን ያስገቡ፡

| Variable Name | Description | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | የሱፓቤዝ ፕሮጀክት አድራሻ | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | የሱፓቤዝ አኖኒመስ ቁልፍ | `eyJhbGciOi...` |
| `NEXT_PUBLIC_ADMIN_PIN` | ለአስተባባሪዎች የሚሰጥ ፒን ኮድ | `2223` |

4. **Deploy** የሚለውን ይጫኑ። በ 1 ደቂቃ ውስጥ ድረ-ገጹ በቀጥታ ይሰራጫል!

---

## 📱 በዝግጅቱ ወቅት ለፈጣን የስልክ ኔትወርክ (Cellular Optimization)

- **አነስተኛ የዳታ ፍጆታ:** አላስፈላጊ የሆኑ ከባባድ ፎቶዎች ወይም ቤተ-መጻሕፍት አልተካተቱም።
- **የስልክ ስክሪን ምቾት:** በ 320px ስልኮች ጀምሮ እስከ ትላልቅ ታብሌቶች ድረስ ያለምንም መጨናነቅ ይሰራል (Touch-friendly inputs & buttons)።
- **የከሸፈ ግንኙነት ጥበቃ:** የኔትወርክ መቆራረጥ በሚያጋጥምበት ወቅት ለተጠቃሚው ግልጽ የአማርኛ መልዕክት ይሰጣል።

---

## 💻 በአካባቢ ኮምፒውተር ላይ ለማስኬድ (Local Development)

```bash
# ፓኬጆችን መጫን
npm install

# የሙከራ ሰርቨሩን ማስጀመር
npm run dev
```

ከዚያ በብራውዘርዎ `http://localhost:3000` በመክፈት የጥያቄ ማቅረቢያውን፣ በ `http://localhost:3000/admin` ደግሞ የአስተባባሪዎችን ዳሽቦርድ መመልከት ይችላሉ።
