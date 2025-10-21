# 🎭 Mood Poem - Quick Start Guide

## 🚀 Bước 1: Seed Poems vào Firestore

1. Mở file `src/App.tsx`
2. **Uncomment 2 dòng này:**

```typescript
import { seedPoems } from './utils/seedPoems'; // Bỏ comment

// Trong function App(), uncomment dòng này:
useEffect(() => { seedPoems(db); }, []);
```

3. **Save file** và reload trang trong browser
4. Mở **Console** (F12) để xem kết quả:
```
✅ Seeded poem: angry-1
✅ Seeded poem: sad-1
✅ Seeded poem: neutral-1
✅ Seeded poem: content-1
✅ Seeded poem: happy-1
🎉 All poems seeded successfully!
```

5. **Comment lại 2 dòng đó** để không seed lại mỗi lần reload

---

## 🎯 Bước 2: Deploy Firestore Rules

Mở terminal và chạy:
```bash
firebase deploy --only firestore:rules
```

---

## ✅ Bước 3: Test App

1. **Reload trang** - bạn sẽ thấy 1 poem ngẫu nhiên
2. **Login với Google** (optional)
3. **Chọn mood** → mood được lưu nhưng poem KHÔNG đổi
4. **Reload trang** → poem giống y hệt ngày hôm nay!
5. **Đợi sang ngày mai** → poem sẽ thay đổi thành poem mới

---

## 📊 Kiểm tra Database

Vào Firebase Console → Firestore Database:

### Collection: `poem-poem`
```
angry-1, sad-1, neutral-1, content-1, happy-1
```

### Collection: `user-mood-poem`
```
{userId}/
  ├── moods/
  │    └── 2025-10-21: { mood, note, updatedAt }
  └── daily-poems/
       └── 2025-10-21: { date, poemId, mood }
```

---

## 🎨 Tính năng

- ✅ **1 poem ngẫu nhiên mỗi ngày**: Mỗi ngày 1 poem khác nhau (KHÔNG phụ thuộc mood)
- ✅ **Lưu mood**: User vẫn có thể chọn và lưu mood của ngày
- ✅ **Poem cố định trong ngày**: Dù reload bao nhiêu lần, poem vẫn giữ nguyên
- ✅ **Poem mới mỗi ngày**: Sang ngày mới = poem mới
- ✅ **Không login vẫn xem được**: Guest xem được poem (nhưng không lưu)

---

## 🔧 Troubleshooting

**Lỗi: "No poems found in database"**
→ Chưa seed poems. Làm theo Bước 1.

**Lỗi: "Permission denied"**
→ Chưa deploy rules. Làm theo Bước 2.

**Poem không đổi**
→ Đây là tính năng! Mỗi ngày chỉ 1 poem. Đợi ngày mai sẽ có poem mới.

**Muốn poem đổi theo mood?**
→ Tính năng hiện tại: poem không phụ thuộc mood, chỉ đổi mỗi ngày.

