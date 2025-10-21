# 🎭 Mood Poem - Firestore Database Setup

## 📊 Database Structure

### 1. **user-poem** Collection
Lưu thông tin user khi đăng nhập
```
user-poem/
  └── {userId}/
      ├── name: string
      ├── email: string
      ├── photoUrl: string
      ├── createdAt: timestamp
      └── lastLogin: timestamp
```

### 2. **user-mood-poem** Collection
Lưu mood của user theo ngày (subcollection)
```
user-mood-poem/
  └── {userId}/
      └── moods/
          └── {2025-10-21}/
              ├── mood: "happy" | "sad" | "neutral" | "angry" | "content"
              ├── note: string
              └── updatedAt: timestamp
```

### 3. **poem-poem** Collection
Lưu tất cả poems
```
poem-poem/
  └── {poemId}/
      ├── id: string
      ├── content: string
      ├── author: string
      ├── createdAt: timestamp
      └── tags: string[]
```

## 🚀 Setup Instructions

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Seed Poems (chỉ chạy 1 lần)
Trong file `src/App.tsx`, uncomment 2 dòng này:
```typescript
import { seedPoems } from './utils/seedPoems';

// Trong component App
useEffect(() => { seedPoems(db); }, []);
```

Sau đó:
1. Save file và reload trang
2. Check console để xem poems đã được seed
3. Comment lại 2 dòng đó để không seed lại

## 🔐 Security Rules

**user-poem**: Chỉ user đó mới đọc/ghi được data của mình
**user-mood-poem**: Chỉ user đó mới đọc/ghi được mood của mình
**poem-poem**: Ai cũng đọc được, chỉ authenticated user mới ghi được

## 📝 How It Works

### Khi user login:
1. Lưu/update thông tin user vào `user-poem/{userId}`
2. Load mood của ngày hôm nay từ `user-mood-poem/{userId}/moods/{today}`
3. Hiển thị poem tương ứng với mood đã lưu

### Khi user chọn mood:
1. Lưu/update mood vào `user-mood-poem/{userId}/moods/{today}`
2. User có thể thay đổi mood nhiều lần trong ngày
3. Mỗi lần thay đổi sẽ update `updatedAt`

### Xem data trên Firebase Console:
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project: my-first-firebase-project-0904
3. Vào Firestore Database
4. Xem 3 collections: user-poem, user-mood-poem, poem-poem

## 🎯 Next Steps (Optional)

1. **Thêm nhiều poems hơn** vào `src/utils/seedPoems.ts`
2. **Thêm note field** để user có thể ghi chú về mood
3. **Hiển thị lịch sử mood** theo tháng/năm
4. **Analytics** để xem mood trends
