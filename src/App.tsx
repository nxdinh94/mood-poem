import { useState, useEffect, useRef } from 'react'
import './App.css'
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import happyIcon from './assets/emotion.png';
import logo from './assets/logo.jpg';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

type Mood = 'angry' | 'sad' | 'neutral' | 'content' | 'happy';

interface Poem {
  id: string;
  content: string;
  author: string;
  tags?: string[]; // Optional
}

interface DailyPoem {
  date: string;
  poemId: string;
  mood: Mood;
}

interface WeekMood {
  date: string;
  day: string;
  mood: Mood | null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [showWeekMoodPanel, setShowWeekMoodPanel] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMoodToday, setHasMoodToday] = useState(false);
  const [moodLoaded, setMoodLoaded] = useState(false); // Track if mood has been loaded from DB
  const [weekMoods, setWeekMoods] = useState<WeekMood[]>([]);
  const [weekMoodsLoading, setWeekMoodsLoading] = useState(false);

  // Refs cho các panel để detect click outside
  const moodSelectorRef = useRef<HTMLDivElement>(null);
  const weekMoodPanelRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Function để lấy random poem từ Firestore (bất kỳ mood nào)
  const getRandomPoem = async (): Promise<Poem | null> => {
    try {
      const poemsRef = collection(db, "poem-poem");
      const querySnapshot = await getDocs(poemsRef);
      
      if (querySnapshot.empty) {
        console.log("No poems found in database");
        return null;
      }

      const poems = querySnapshot.docs.map(doc => doc.data() as Poem);
      const randomIndex = Math.floor(Math.random() * poems.length);
      return poems[randomIndex];
    } catch (error) {
      console.error("Error fetching poems:", error);
      return null;
    }
  };

  // Function để load poem của ngày hôm nay
  const loadTodayPoem = async (userId?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (userId) {
        // Check xem đã có poem cho ngày hôm nay chưa
        const dailyPoemRef = doc(db, "user-mood-poem", userId, "daily-poems", today);
        const dailyPoemDoc = await getDoc(dailyPoemRef);
        
        if (dailyPoemDoc.exists()) {
          const dailyData = dailyPoemDoc.data() as DailyPoem;
          // Load poem đã lưu từ ngày hôm nay
          const poemRef = doc(db, "poem-poem", dailyData.poemId);
          const poemDoc = await getDoc(poemRef);
          if (poemDoc.exists()) {
            setCurrentPoem(poemDoc.data() as Poem);
            if (dailyData.mood) {
              setCurrentMood(dailyData.mood);
            }
            return;
          }
        }
      }
      
      // Nếu chưa có poem hoặc chưa login, lấy random poem mới
      const poem = await getRandomPoem();
      if (poem) {
        setCurrentPoem(poem);
        
        // Lưu poem của ngày hôm nay nếu user đã login
        if (userId) {
          const dailyPoemRef = doc(db, "user-mood-poem", userId, "daily-poems", today);
          await setDoc(dailyPoemRef, {
            date: today,
            poemId: poem.id,
            mood: currentMood // Lưu mood hiện tại (nếu có)
          });
        }
      }
    } catch (error) {
      console.error("Error loading today's poem:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function để load mood của 7 ngày qua
  const loadWeekMoods = async (userId: string) => {
    setWeekMoodsLoading(true);
    try {
      const moods: WeekMood[] = [];
      const today = new Date();
      
      // Lấy mood của 7 ngày (từ 6 ngày trước đến hôm nay)
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Lấy tên ngày trong tuần
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        
        // Load mood từ Firestore
        const moodRef = doc(db, "user-mood-poem", userId, "moods", dateString);
        const moodDoc = await getDoc(moodRef);
        
        moods.push({
          date: dateString,
          day: dayName,
          mood: moodDoc.exists() ? (moodDoc.data().mood as Mood) : null
        });
      }
      
      setWeekMoods(moods);
    } catch (error) {
      console.error("Error loading week moods:", error);
    } finally {
      setWeekMoodsLoading(false);
    }
  };

  // Handle click outside để đóng các panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check mood selector
      if (showMoodSelector && moodSelectorRef.current && !moodSelectorRef.current.contains(target)) {
        // Kiểm tra xem có phải click vào mood button không
        const moodButton = document.querySelector('.mood-button');
        if (moodButton && !moodButton.contains(target)) {
          setShowMoodSelector(false);
        }
      }
      
      // Check week mood panel
      if (showWeekMoodPanel && weekMoodPanelRef.current && !weekMoodPanelRef.current.contains(target)) {
        // Kiểm tra xem có phải click vào dropdown item không
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        let clickedDropdownItem = false;
        dropdownItems.forEach(item => {
          if (item.contains(target)) {
            clickedDropdownItem = true;
          }
        });
        if (!clickedDropdownItem) {
          setShowWeekMoodPanel(false);
        }
      }
      
      // Check user dropdown
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        const userInfo = document.querySelector('.user-info');
        if (userInfo && !userInfo.contains(target)) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoodSelector, showWeekMoodPanel, showUserDropdown]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setShowLoginPanel(false);
        
        // Chỉ load mood lần đầu tiên, không load lại khi đã có
        if (!moodLoaded) {
          try {
            const today = new Date().toISOString().split('T')[0];
            const moodRef = doc(db, "user-mood-poem", user.uid, "moods", today);
            const moodDoc = await getDoc(moodRef);
            
            if (moodDoc.exists()) {
              const moodData = moodDoc.data();
              const savedMood = moodData.mood as Mood;
              setCurrentMood(savedMood);
              setHasMoodToday(true);
            } else {
              setCurrentMood(null);
              setHasMoodToday(false);
            }
            
            setMoodLoaded(true); // Mark as loaded
            
            // Load poem của ngày hôm nay (không phụ thuộc mood)
            await loadTodayPoem(user.uid);
            
            // Load week moods ngay khi user login để sẵn sàng hiển thị
            await loadWeekMoods(user.uid);
          } catch (error) {
            console.error("Error loading mood:", error);
            setLoading(false);
          }
        } else {
          // Mood đã được load, chỉ load poem
          await loadTodayPoem(user.uid);
        }
      } else {
        // Chưa login, reset mood
        setCurrentMood(null);
        setHasMoodToday(false);
        setMoodLoaded(false); // Reset khi logout
        setWeekMoods([]); // Reset week moods
        // Vẫn hiển thị poem random
        await loadTodayPoem();
      }
    });

    return () => unsubscribe();
  }, [moodLoaded]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Lưu user data vào Firestore collection "user-poem"
      const userRef = doc(db, "user-poem", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Tạo mới user nếu chưa tồn tại
        await setDoc(userRef, {
          name: user.displayName || '',
          email: user.email || '',
          photoUrl: user.photoURL || '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update lastLogin nếu user đã tồn tại
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
      }
      
      // Refresh page sau khi login
      window.location.reload();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Refresh page sau khi logout
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMoodSelect = async (mood: Mood) => {
    setCurrentMood(mood);
    setHasMoodToday(true);
    setShowMoodSelector(false);
    setMoodLoaded(true); // Mark as loaded sau khi user chọn mood

    // Lưu mood vào Firestore nếu user đã đăng nhập (không đổi poem)
    if (user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Lưu mood
        const moodRef = doc(db, "user-mood-poem", user.uid, "moods", today);
        const moodDoc = await getDoc(moodRef);
        
        if (!moodDoc.exists()) {
          await setDoc(moodRef, {
            mood: mood,
            note: '',
            updatedAt: serverTimestamp()
          });
        } else {
          await updateDoc(moodRef, {
            mood: mood,
            updatedAt: serverTimestamp()
          });
        }

        // Update mood trong daily-poems (không tạo poem mới)
        const dailyPoemRef = doc(db, "user-mood-poem", user.uid, "daily-poems", today);
        const dailyPoemDoc = await getDoc(dailyPoemRef);
        
        if (dailyPoemDoc.exists()) {
          await updateDoc(dailyPoemRef, {
            mood: mood
          });
        }
      } catch (error) {
        console.error("Error saving mood:", error);
      }
    }
  };

  const handleAskMood = () => {
    if (!user) {
      setShowLoginPanel(true);
    } else {
      setShowMoodSelector(!showMoodSelector);
    }
  };

  const handleShowWeekMood = () => {
    if (!user) {
      setShowLoginPanel(true);
    } else {
      setShowWeekMoodPanel(!showWeekMoodPanel);
      setShowUserDropdown(false); // Đóng dropdown khi mở week mood panel
    }
  };

  const handleToggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const moodEmojis: Record<Mood, string> = {
    angry: '😠',
    sad: '😢',
    neutral: '😐',
    content: '🙂',
    happy: '😄'
  };

  const moodLabels: Record<Mood, string> = {
    angry: 'Tức giận',
    sad: 'Buồn',
    neutral: 'Bình thường',
    content: 'Hài lòng',
    happy: 'Vui vẻ'
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <button className="mood-button" onClick={handleAskMood}>
          {!user || !hasMoodToday ? (
            <img src={happyIcon} alt="mood" className="mood-icon" />
          ) : (
            currentMood && moodEmojis[currentMood]
          )}
        </button>
        
        <div className="auth-section">
          {user ? (
            <div className="user-profile-container">
              <div className="user-info" onClick={handleToggleUserDropdown}>
                <img src={user.photoURL || ''} alt="Profile" className="user-avatar" />
                <span className="user-name">{user.displayName}</span>
                <span className="dropdown-arrow">{showUserDropdown ? '▲' : '▼'}</span>
              </div>
              
              {showUserDropdown && (
                <div className="user-dropdown" ref={userDropdownRef}>
                  <button onClick={handleShowWeekMood} className="dropdown-item">
                    Theo dõi Mood
                  </button>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowLoginPanel(true)} className="login-button">
              Đăng nhập
            </button>
          )}
        </div>
      </nav>

      {/* Mood Selector */}
      {showMoodSelector && (
        <div className="mood-selector" ref={moodSelectorRef}>
          <h3>Bạn cảm thấy thế nào?</h3>
          <div className="mood-options">
            {(Object.keys(moodEmojis) as Mood[]).map((mood) => (
              <button
                key={mood}
                className={`mood-option ${currentMood === mood ? 'active' : ''}`}
                onClick={() => handleMoodSelect(mood)}
              >
                <span className="mood-emoji">{moodEmojis[mood]}</span>
                <span className="mood-label">{moodLabels[mood]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week Mood Panel */}
      {showWeekMoodPanel && (
        <div className="week-mood-panel" ref={weekMoodPanelRef}>
          <h3>Tâm trạng tuần qua</h3>
          <div className="week-mood-grid">
            {weekMoodsLoading ? (
              // Hiển thị 7 skeleton items khi đang load
              Array.from({ length: 7 }).map((_, index) => (
                <div key={`loading-${index}`} className="week-mood-item loading">
                  <div className="week-day">...</div>
                  <div className="week-mood-emoji">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Hiển thị data khi đã load xong
              weekMoods.map((dayMood) => (
                <div key={dayMood.date} className="week-mood-item">
                  <div className="week-day">{dayMood.day}</div>
                  <div className="week-mood-emoji">
                    {dayMood.mood ? moodEmojis[dayMood.mood] : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Login Panel */}
      {showLoginPanel && !user && (
        <div className="login-panel-overlay" onClick={() => setShowLoginPanel(false)}>
          <div className="login-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowLoginPanel(false)}>×</button>
            <h2>Chào mừng bạn!</h2>
            <p>Vui lòng đăng nhập để chọn tâm trạng và nhận những bài thơ phù hợp</p>
            <button onClick={handleLogin} className="google-login-button">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Poem Display */}
      <main className="poem-container">
        <div className="poem-wrapper">
          <img src={logo} alt="Logo" className="logo-image" />
          {loading ? (
            <div className="poem-content">
              <p className="loading-text">Đang tải...</p>
            </div>
          ) : currentPoem ? (
            <div className="poem-content">
              <pre className="poem-text">{currentPoem.content}</pre>
              <p className="poem-author">— {currentPoem.author}</p>
            </div>
          ) : (
            <div className="poem-content">
              <p className="poem-text">Không có bài thơ nào cho tâm trạng này.</p>
              <p className="poem-author">Vui lòng thử tâm trạng khác.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
