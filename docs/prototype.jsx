import React, { useState } from 'react';
import { ChevronRight, Settings, Plus, MessageCircle, Send, Heart, MessageSquare, Share2, Copy, Check, Flame, TrendingUp, Award, Users, PlayCircle, BookOpen, User, Home, MoreVertical, Search, Upload, Filter, BarChart3, Target, Zap, Shield, Lock, Unlock, Trophy, Gift, Link2 } from 'lucide-react';

// Mock data (declared outside component to avoid temporal dead zone)
const initialCommunityMessages = [
  { id: 1, user: 'Coach Marcus', avatar: '👨‍🏫', belt: 'Black', message: 'Who\'s coming to the open mat today?', timestamp: '2:30 PM', reactions: { '🔥': 4, '💪': 2 }, replies: 3 },
  { id: 2, user: 'Jamie Chen', avatar: '🏋️', belt: 'Purple', message: 'Just landed my first armbar escape sequence! Feeling stoked', timestamp: '2:15 PM', reactions: { '🎉': 8, '💯': 5 }, replies: 2 },
  { id: 3, user: 'Training Grounds', avatar: '🏢', belt: 'Gym', message: 'New rolling footage library added! Check out the competition prep section', timestamp: '1:45 PM', reactions: { '📺': 6 }, replies: 1 }
];

const initialJournalData = [
  { id: 1, date: 'Mar 26', class: 'Intermediate BJJ', exploration: 'Triangle choke variations', challenge: 'Keeping elbows tight when defending', worked: 'De la Riva guard sweeps', takeaways: 'Pressure is key; weight distribution matters', next: 'Focus on grip strength' },
  { id: 2, date: 'Mar 24', class: 'Muay Thai Conditioning', exploration: 'Teep kick distance management', challenge: 'Footwork coordination', worked: 'Low kick combos', takeaways: 'Breathing rhythm improves power', next: 'Work on switch stances' }
];

const TrainingGroundsApp = () => {
  // Navigation state
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [userRole, setUserRole] = useState('member'); // member or coach
  const [selectedChannel, setSelectedChannel] = useState('announcements');
  const [videoFilter, setVideoFilter] = useState('all');
  const [messages, setMessages] = useState(initialCommunityMessages);
  const [newMessage, setNewMessage] = useState('');
  const [journalEntries, setJournalEntries] = useState(initialJournalData);
  const [newJournalEntry, setNewJournalEntry] = useState({ exploration: '', challenge: '', worked: '', takeaways: '', next: '' });
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mock data
  const userData = {
    name: 'Alex Rivera',
    avatar: '🥋',
    level: 12,
    xp: { current: 2340, max: 3000 },
    streak: 23,
    streakFrozen: false,
    joinDate: 'Jan 2022',
    belt: 'Blue',
    beltColor: '#4A90E2',
    stripes: 3,
    referralCode: 'ALEX2024',
    referrals: { invited: 5, trial: 3, signed: 2, active30: 2 }
  };

  const badgesData = {
    Attendance: [
      { id: 1, name: 'First Class', icon: '🎯', description: 'Attended your first class', earned: true, date: 'Jan 15, 2022' },
      { id: 2, name: '7-Day Warrior', icon: '🔥', description: '7-day training streak', earned: true, date: 'Feb 3, 2022' },
      { id: 3, name: '100-Day Legend', icon: '👑', description: '100 consecutive training days', earned: true, date: 'Jun 12, 2022' },
      { id: 4, name: 'Year Strong', icon: '⭐', description: '1 year of training', earned: false }
    ],
    Discipline: [
      { id: 5, name: 'BJJ Enthusiast', icon: '🥋', description: 'Complete 50 BJJ classes', earned: true, date: 'Dec 1, 2022' },
      { id: 6, name: 'Muay Master', icon: '🥊', description: 'Complete 50 Muay Thai classes', earned: true, date: 'Apr 22, 2023' },
      { id: 7, name: 'Wrestler', icon: '💪', description: 'Complete 25 wrestling classes', earned: false }
    ],
    Competition: [
      { id: 8, name: 'First Match', icon: '🏆', description: 'Enter your first competition', earned: true, date: 'Sep 10, 2023' },
      { id: 9, name: 'Podium', icon: '🥇', description: 'Win your first match', earned: true, date: 'Nov 5, 2023' }
    ]
  };

  const weeklyTraining = {
    Mon: 'hot',
    Tue: 'light',
    Wed: 'medium',
    Thu: 'hot',
    Fri: 'empty',
    Sat: 'medium',
    Sun: 'empty'
  };

  const todayClasses = [
    { id: 1, name: 'Fundamentals BJJ', time: '5:00 PM', coach: 'Coach Sarah', level: 'All Levels', checkedIn: false },
    { id: 2, name: 'Advanced Muay Thai', time: '6:30 PM', coach: 'Coach Marcus', level: 'Intermediate+', checkedIn: false },
    { id: 3, name: 'Open Mat', time: '8:00 PM', coach: 'Self-Directed', level: 'All Levels', checkedIn: false }
  ];

  const videoLibrary = [
    { id: 1, title: 'Armbar from Guard Position', coach: 'Coach Sarah', duration: '8:23', views: 1240, category: 'Game Demos', thumbnail: '🎥' },
    { id: 2, title: 'Wrestling Takedown Clinic', coach: 'Coach Marcus', duration: '15:45', views: 892, category: 'Coach Insights', thumbnail: '🎥' },
    { id: 3, title: 'Competition: Cruz vs Anderson Round 2', coach: 'Member Highlight', duration: '6:12', views: 2150, category: 'Live Rounds', thumbnail: '🎥' },
    { id: 4, title: 'Triangle Escape Sequence', coach: 'Coach Sarah', duration: '5:30', views: 567, category: 'Game Demos', thumbnail: '🎥' },
    { id: 5, title: 'Muay Thai Clinch Drills', coach: 'Coach Marcus', duration: '12:15', views: 743, category: 'Coach Insights', thumbnail: '🎥' },
    { id: 6, title: 'Ryan vs James - Full Match', coach: 'Member Highlight', duration: '14:30', views: 1890, category: 'Live Rounds', thumbnail: '🎥' }
  ];

  const leaderboardData = [
    { rank: 1, name: 'Sarah Chen', xp: 4280, level: 15, league: 'Diamond' },
    { rank: 2, name: 'Coach Marcus', xp: 4050, level: 14, league: 'Diamond' },
    { rank: 3, name: 'Alex Rivera', xp: 2340, level: 12, league: 'Gold' },
    { rank: 4, name: 'Jamie Park', xp: 2100, level: 11, league: 'Gold' },
    { rank: 5, name: 'Mike Johnson', xp: 1890, level: 10, league: 'Silver' }
  ];

  const skillRadarData = {
    'Standup': 65,
    'Ground Game': 78,
    'Takedowns': 55,
    'Submissions': 82,
    'Defense': 70
  };

  const goals = [
    { id: 1, name: 'Complete 50 Classes This Year', current: 38, max: 50, category: 'Attendance' },
    { id: 2, name: 'Master Triangle Variations', current: 8, max: 10, category: 'Technical' },
    { id: 3, name: 'Win First Competition', current: 1, max: 1, category: 'Competition' }
  ];

  const competitionHistory = [
    { id: 1, date: 'Nov 5, 2023', opponent: 'James Wilson', discipline: 'BJJ - Gi', result: 'Win', score: '2-0' },
    { id: 2, date: 'Sep 10, 2023', opponent: 'Michael Torres', discipline: 'BJJ - No-Gi', result: 'Loss', score: '0-3' }
  ];

  // Helper functions
  const navigateToScreen = (screen, tab = 'profile') => {
    setCurrentScreen(screen);
    setActiveTab(tab);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        user: userData.name,
        avatar: userData.avatar,
        belt: userData.belt,
        message: newMessage,
        timestamp: 'now',
        reactions: {},
        replies: 0
      };
      setMessages([message, ...messages]);
      setNewMessage('');
    }
  };

  const handleAddJournalEntry = () => {
    if (newJournalEntry.exploration.trim()) {
      const entry = {
        id: journalEntries.length + 1,
        date: 'Today',
        class: 'Class Name',
        ...newJournalEntry
      };
      setJournalEntries([entry, ...journalEntries]);
      setNewJournalEntry({ exploration: '', challenge: '', worked: '', takeaways: '', next: '' });
      setShowJournalForm(false);
    }
  };

  const copyReferralCode = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Color mapping
  const heatmapColor = (intensity) => {
    const colorMap = {
      empty: '#2A2A2A',
      light: '#3E5C76',
      medium: '#7A8E8A',
      hot: '#C9A87C'
    };
    return colorMap[intensity] || '#2A2A2A';
  };

  const getLeagueColor = (league) => {
    const leagueColors = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#C9A87C',
      'Diamond': '#00D4FF'
    };
    return leagueColors[league] || '#C9A87C';
  };

  // Screen Components
  const DashboardScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ color: '#FAFAF8', fontSize: '28px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.06em' }}>Welcome, {userData.name.split(' ')[0]}</h1>
            <p style={{ color: '#B0B5B8', fontSize: '14px', margin: '4px 0 0' }}>Mar 27, 2026</p>
          </div>
          <div style={{ fontSize: '36px' }}>{userData.avatar}</div>
        </div>
      </div>

      {/* Streak & XP */}
      <div style={{ padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Streak Card */}
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Flame size={20} color="#C9A87C" fill="#C9A87C" />
            <p style={{ color: '#C9A87C', fontSize: '14px', fontWeight: '700', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Streak</p>
          </div>
          <p style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>{userData.streak} Days</p>
          <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>On Fire! 🔥</p>
        </div>

        {/* XP Card */}
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={20} color="#C9A87C" fill="#C9A87C" />
            <p style={{ color: '#C9A87C', fontSize: '14px', fontWeight: '700', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Level</p>
          </div>
          <p style={{ color: '#FAFAF8', fontSize: '20px', fontWeight: '700', margin: '0' }}>Lvl {userData.level}</p>
          <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '4px 0 0' }}>{userData.xp.current.toLocaleString()} / {userData.xp.max.toLocaleString()} XP</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ backgroundColor: '#2A2A2A', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ backgroundColor: '#C9A87C', height: '100%', width: `${(userData.xp.current / userData.xp.max) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        <p style={{ color: '#B0B5B8', fontSize: '12px', marginTop: '6px', margin: '0' }}>78% to next level</p>
      </div>

      {/* Weekly Heatmap */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly Activity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {Object.entries(weeklyTraining).map(([day, intensity]) => (
            <div key={day} style={{ textAlign: 'center' }}>
              <div style={{ backgroundColor: heatmapColor(intensity), width: '100%', paddingTop: '100%', borderRadius: '8px', position: 'relative', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.06)' }} />
              <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0', fontWeight: '500' }}>{day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'Classes', value: '127' },
            { label: 'Streak', value: '23d' },
            { label: 'Wk XP', value: '420' },
            { label: 'Rank', value: '#3' }
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#FAFAF8', fontSize: '16px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>{stat.value}</p>
              <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Classes */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Classes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {todayClasses.map((cls) => (
            <div key={cls.id} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>{cls.name}</h4>
                <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0', display: 'flex', gap: '8px' }}>
                  <span>{cls.time}</span>
                  <span>•</span>
                  <span>{cls.coach}</span>
                </p>
              </div>
              <button style={{ backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check In</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Badge */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Badge Earned</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '2px solid #C9A87C', textAlign: 'center' }}>
          <p style={{ fontSize: '36px', margin: '0 0 8px' }}>👑</p>
          <h4 style={{ color: '#C9A87C', fontSize: '14px', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>100-Day Legend</h4>
          <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0', lineHeight: '1.4' }}>You've achieved 100 consecutive training days!</p>
        </div>
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header with Profile */}
      <div style={{ backgroundColor: '#2A2A2A', padding: '32px 16px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{userData.avatar}</div>
        <h1 style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0 0 8px', fontFamily: 'Bebas Neue, sans-serif' }}>{userData.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: userData.beltColor, borderRadius: '4px' }} />
          <p style={{ color: '#C9A87C', fontSize: '14px', fontWeight: '600', margin: '0' }}>{userData.belt} Belt • {userData.stripes} Stripes</p>
        </div>
        <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0' }}>Member since {userData.joinDate}</p>
      </div>

      {/* Training Stats Summary */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '🥋', label: 'Total Classes', value: '127' },
            { icon: '🔥', label: 'Longest Streak', value: '45 days' },
            { icon: '🏆', label: 'Competitions', value: '2' },
            { icon: '⭐', label: 'Badges Earned', value: '18' }
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '24px', margin: '0 0 8px' }}>{stat.icon}</p>
              <p style={{ color: '#FAFAF8', fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discipline Pie Chart (simplified) */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Training Breakdown</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { discipline: 'BJJ (Gi)', classes: '52', percent: '41%', color: '#4A90E2' },
            { discipline: 'BJJ (No-Gi)', classes: '38', percent: '30%', color: '#7B68EE' },
            { discipline: 'Muay Thai', classes: '25', percent: '20%', color: '#FF6B6B' },
            { discipline: 'Wrestling', classes: '12', percent: '9%', color: '#FFA500' }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? '12px' : '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{item.discipline}</p>
                <span style={{ color: '#B0B5B8', fontSize: '12px' }}>{item.classes} classes • {item.percent}</span>
              </div>
              <div style={{ backgroundColor: '#1E1E1E', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: item.color, height: '100%', width: item.percent }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Belt Progression Timeline */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Belt Progression</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { belt: 'White', date: 'Jan 2022', current: true },
            { belt: 'Blue', date: 'Jun 2022', current: true },
            { belt: 'Purple', date: 'TBD', current: false }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 2 ? '12px' : '0', position: 'relative' }}>
              <div style={{ textAlign: 'center', minWidth: '40px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: item.current ? '#C9A87C' : '#2A2A2A', border: `2px solid ${item.current ? '#C9A87C' : '#B0B5B8'}`, borderRadius: '50%', margin: '0 auto' }} />
                {i < 2 && <div style={{ width: '2px', height: '20px', backgroundColor: '#B0B5B8', margin: '4px auto' }} />}
              </div>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '600', margin: '0' }}>{item.belt} Belt</p>
                <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0' }}>{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earned Badges</h3>
          <button onClick={() => navigateToScreen('rewards')} style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#C9A87C', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View All</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { icon: '🎯', name: 'First Class' },
            { icon: '🔥', name: '7-Day Warrior' },
            { icon: '👑', name: '100-Day Legend' },
            { icon: '🥋', name: 'BJJ Enthusiast' },
            { icon: '🥊', name: 'Muay Master' },
            { icon: '🏆', name: 'First Match' }
          ].map((badge, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '28px', margin: '0 0 6px' }}>{badge.icon}</p>
              <p style={{ color: '#FAFAF8', fontSize: '11px', fontWeight: '600', margin: '0', lineHeight: '1.3' }}>{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Competition History */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Competition History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {competitionHistory.map((comp) => (
            <div key={comp.id} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>vs {comp.opponent}</p>
                <span style={{ color: comp.result === 'Win' ? '#7ADB5C' : '#FF6B6B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{comp.result}</span>
              </div>
              <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0 0 4px' }}>{comp.discipline}</p>
              <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0', display: 'flex', gap: '8px' }}>
                <span>{comp.date}</span>
                <span>•</span>
                <span>Score: {comp.score}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Stats */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Referral Stats</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invited</p>
            <p style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>{userData.referrals.invited}</p>
          </div>
          <div>
            <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active (30d)</p>
            <p style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>{userData.referrals.active30}</p>
          </div>
        </div>
        <button onClick={() => navigateToScreen('referrals')} style={{ width: '100%', marginTop: '12px', backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View Full Referral Program</button>
      </div>

      {/* Coach Toggle */}
      {userRole === 'member' && (
        <div style={{ padding: '0 16px 20px' }}>
          <button onClick={() => setUserRole('coach')} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#C9A87C', borderRadius: '6px', padding: '12px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Switch to Coach Mode</button>
        </div>
      )}
    </div>
  );

  const CommunityHubScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px', display: 'flex', flexDirection: 'column' }}>
      {/* Channel Selector */}
      <div style={{ backgroundColor: '#2A2A2A', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
          {['announcements', 'general-chat', 'bjj', 'muay-thai', 'rolling-footage', 'competition-prep'].map((channel) => (
            <button
              key={channel}
              onClick={() => setSelectedChannel(channel)}
              style={{
                backgroundColor: selectedChannel === channel ? '#C9A87C' : 'transparent',
                color: selectedChannel === channel ? '#1E1E1E' : '#B0B5B8',
                border: selectedChannel === channel ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                letterSpacing: '0.06em'
              }}
            >
              #{channel.replace('-', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '28px' }}>{msg.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{msg.user}</p>
                  {msg.belt !== 'Gym' && <div style={{ width: '10px', height: '10px', backgroundColor: userData.beltColor, borderRadius: '2px' }} />}
                  <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{msg.timestamp}</p>
                </div>
                <p style={{ color: '#FAFAF8', fontSize: '13px', margin: '0', lineHeight: '1.4' }}>{msg.message}</p>
              </div>
            </div>
            {Object.keys(msg.reactions).length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginLeft: '38px', marginTop: '8px', flexWrap: 'wrap' }}>
                {Object.entries(msg.reactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    style={{
                      backgroundColor: 'rgba(201, 168, 124, 0.1)',
                      border: '1px solid rgba(201, 168, 124, 0.3)',
                      borderRadius: '12px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center'
                    }}
                  >
                    <span>{emoji}</span>
                    <span style={{ color: '#B0B5B8', fontSize: '11px' }}>{count}</span>
                  </button>
                ))}
              </div>
            )}
            {msg.replies > 0 && (
              <button style={{ backgroundColor: 'transparent', border: 'none', color: '#C9A87C', marginLeft: '38px', marginTop: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {msg.replies} {msg.replies === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div style={{ padding: '12px 16px', backgroundColor: '#2A2A2A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Say something..."
            style={{
              flex: 1,
              backgroundColor: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#FAFAF8',
              fontSize: '13px'
            }}
          />
          <button onClick={handleSendMessage} style={{ backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const VideoLibraryScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          placeholder="Search videos..."
          style={{
            flex: 1,
            backgroundColor: '#2A2A2A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '10px 12px',
            color: '#FAFAF8',
            fontSize: '13px'
          }}
        />
        <button style={{ backgroundColor: '#2A2A2A', color: '#C9A87C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Filter size={16} />
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', display: 'flex', gap: '12px', overflowX: 'auto' }}>
        {['all', 'Game Demos', 'Live Rounds', 'Coach Insights', 'Member Highlights'].map((category) => (
          <button
            key={category}
            onClick={() => setVideoFilter(category)}
            style={{
              backgroundColor: 'transparent',
              borderBottom: videoFilter === category ? '3px solid #C9A87C' : 'none',
              color: videoFilter === category ? '#FAFAF8' : '#B0B5B8',
              border: 'none',
              padding: '12px 0',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Upload Button */}
      <div style={{ padding: '16px' }}>
        <button style={{ width: '100%', backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Upload size={16} />
          Submit Rolling Footage
        </button>
      </div>

      {/* Video Grid */}
      <div style={{ padding: '0 16px 20px', display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {videoLibrary.map((video) => (
          <div
            key={video.id}
            style={{
              backgroundColor: '#2A2A2A',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer'
            }}
          >
            <div style={{ backgroundColor: '#1A1A1A', padding: '60px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}>
              {video.thumbnail}
              <PlayCircle size={32} color="#C9A87C" style={{ position: 'absolute' }} />
            </div>
            <div style={{ padding: '12px' }}>
              <h4 style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 6px' }}>{video.title}</h4>
              <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0 0 6px', display: 'flex', gap: '8px' }}>
                <span>{video.coach}</span>
                <span>•</span>
                <span>{video.duration}</span>
                <span>•</span>
                <span>{video.views} views</span>
              </p>
              <span style={{ backgroundColor: 'rgba(201, 168, 124, 0.1)', color: '#C9A87C', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{video.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const JournalScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Today's Reflection Prompt */}
      {!showJournalForm && (
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '18px', border: '2px solid #C9A87C' }}>
            <h3 style={{ color: '#C9A87C', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Reflection</h3>
            <p style={{ color: '#FAFAF8', fontSize: '14px', margin: '0 0 16px', fontStyle: 'italic', lineHeight: '1.6' }}>"What did you discover about your training today? What challenged you? What will you focus on next?"</p>
            <button onClick={() => setShowJournalForm(true)} style={{ width: '100%', backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Write Reflection
            </button>
          </div>
        </div>
      )}

      {/* Journal Form */}
      {showJournalForm && (
        <div style={{ padding: '16px 16px 20px' }}>
          <h3 style={{ color: '#FAFAF8', fontSize: '16px', fontWeight: '700', margin: '0 0 16px', fontFamily: 'Bebas Neue, sans-serif' }}>New Journal Entry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'exploration', label: 'What did I explore today?', placeholder: 'Describe the techniques or concepts you worked on...' },
              { key: 'challenge', label: 'What felt challenging?', placeholder: 'What was difficult or required focus?...' },
              { key: 'worked', label: 'What seemed to work?', placeholder: 'What did you execute well?...' },
              { key: 'takeaways', label: '1-2 key takeaways', placeholder: 'What did you learn?...' },
              { key: 'next', label: 'What do I want to explore next?', placeholder: 'Next focus area...' }
            ].map((field) => (
              <div key={field.key}>
                <label style={{ color: '#FAFAF8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                <textarea
                  value={newJournalEntry[field.key]}
                  onChange={(e) => setNewJournalEntry({ ...newJournalEntry, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    backgroundColor: '#2A2A2A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#FAFAF8',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>
            ))}
            <label style={{ color: '#B0B5B8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ cursor: 'pointer' }} />
              Share with coach
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddJournalEntry}
                style={{
                  flex: 1,
                  backgroundColor: '#C9A87C',
                  color: '#1E1E1E',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Save Entry
              </button>
              <button
                onClick={() => { setShowJournalForm(false); setNewJournalEntry({ exploration: '', challenge: '', worked: '', takeaways: '', next: '' }); }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#B0B5B8',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Entries */}
      {!showJournalForm && (
        <div style={{ padding: '0 16px 20px' }}>
          <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Past Entries</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {journalEntries.map((entry) => (
              <div key={entry.id} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{entry.date}</p>
                    <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📌 {entry.class}</p>
                  </div>
                  <button style={{ backgroundColor: 'transparent', border: 'none', color: '#B0B5B8', cursor: 'pointer', padding: '4px' }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
                <p style={{ color: '#FAFAF8', fontSize: '12px', margin: '0', lineHeight: '1.4' }}>{entry.exploration}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '8px 0 0', fontStyle: 'italic' }}>"...{entry.takeaways.substring(0, 50)}..."</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const RewardsAndBadgesScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>Rewards & Badges</h1>
      </div>

      {/* Category Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', display: 'flex', gap: '12px', overflowX: 'auto' }}>
        {Object.keys(badgesData).map((category) => (
          <button
            key={category}
            style={{
              backgroundColor: 'transparent',
              color: '#B0B5B8',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '12px 0',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {badgesData.Attendance.map((badge) => (
            <div
              key={badge.id}
              style={{
                backgroundColor: '#2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                border: badge.earned ? '2px solid #C9A87C' : '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
                opacity: badge.earned ? 1 : 0.6
              }}
            >
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>{badge.icon}</p>
              <h4 style={{ color: '#FAFAF8', fontSize: '12px', fontWeight: '600', margin: '0 0 4px' }}>{badge.name}</h4>
              <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '0 0 6px', lineHeight: '1.3' }}>{badge.description}</p>
              {badge.earned && <p style={{ color: '#C9A87C', fontSize: '10px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earned {badge.date}</p>}
              {!badge.earned && <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Locked</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Streak Milestones */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Streak Milestones</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { milestone: '7-Day Streak', reward: 'Unlock: 7-Day Warrior Badge', achieved: true },
            { milestone: '30-Day Streak', reward: 'Reward: +500 XP', achieved: true },
            { milestone: '100-Day Streak', reward: 'Reward: Training Grounds Hoodie', achieved: true },
            { milestone: '365-Day Streak', reward: 'Reward: Lifetime Ambassador Status', achieved: false }
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>{item.milestone}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{item.reward}</p>
              </div>
              {item.achieved ? <Trophy size={20} color="#C9A87C" /> : <Lock size={20} color="#B0B5B8" />}
            </div>
          ))}
        </div>
      </div>

      {/* XP Breakdown */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>How to Earn XP</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { action: 'Attend a class', xp: '+50 XP' },
            { action: 'Check in early', xp: '+25 XP' },
            { action: 'Complete journal entry', xp: '+30 XP' },
            { action: 'Earn a badge', xp: '+100 XP' },
            { action: 'Win competition match', xp: '+200 XP' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 4 ? '10px' : '0', paddingBottom: i < 4 ? '10px' : '0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <p style={{ color: '#FAFAF8', fontSize: '13px', margin: '0' }}>{item.action}</p>
              <p style={{ color: '#C9A87C', fontSize: '13px', fontWeight: '600', margin: '0' }}>{item.xp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly Leaderboard</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {leaderboardData.map((entry) => (
            <div key={entry.rank} style={{ padding: '12px 14px', borderBottom: entry.rank < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#1E1E1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A87C', fontWeight: '700' }}>{entry.rank}</div>
                <div>
                  <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{entry.name}</p>
                  <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>Level {entry.level}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{entry.xp} XP</p>
                <span style={{ backgroundColor: 'rgba(201, 168, 124, 0.1)', color: getLeagueColor(entry.league), fontSize: '10px', padding: '2px 6px', borderRadius: '3px', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{entry.league}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProgressTrackingScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>Progress Tracking</h1>
      </div>

      {/* Skill Radar (simplified) */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skill Development</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {Object.entries(skillRadarData).map(([skill, level]) => (
            <div key={skill} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{skill}</p>
                <span style={{ color: '#C9A87C', fontSize: '12px', fontWeight: '700' }}>{level}%</span>
              </div>
              <div style={{ backgroundColor: '#1E1E1E', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#C9A87C', height: '100%', width: `${level}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Goals */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Goals</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {goals.map((goal) => (
            <div key={goal.id} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>{goal.name}</h4>
                  <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{goal.category}</p>
                </div>
                <p style={{ color: '#C9A87C', fontSize: '13px', fontWeight: '700', margin: '0' }}>{goal.current}/{goal.max}</p>
              </div>
              <div style={{ backgroundColor: '#1E1E1E', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#C9A87C', height: '100%', width: `${(goal.current / goal.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Log */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { date: 'Mar 26', class: 'Intermediate BJJ', intensity: '⭐⭐⭐⭐', xp: 75 },
            { date: 'Mar 25', class: 'Muay Thai Conditioning', intensity: '⭐⭐⭐⭐⭐', xp: 95 },
            { date: 'Mar 24', class: 'Open Mat', intensity: '⭐⭐⭐', xp: 60 },
            { date: 'Mar 23', class: 'Wrestling Fundamentals', intensity: '⭐⭐⭐⭐', xp: 80 }
          ].map((session, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>{session.class}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{session.date} • Intensity: {session.intensity}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#C9A87C', fontSize: '13px', fontWeight: '700' }}>+{session.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ReferralProgramScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0 0 8px', fontFamily: 'Bebas Neue, sans-serif' }}>Referral Program</h1>
        <p style={{ color: '#B0B5B8', fontSize: '12px', margin: '0' }}>Bring your friends and earn rewards</p>
      </div>

      {/* Referral Code */}
      <div style={{ padding: '20px 16px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Referral Code</h3>
        <div style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '16px', border: '2px solid #C9A87C', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code</p>
            <p style={{ color: '#FAFAF8', fontSize: '20px', fontWeight: '700', margin: '0', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{userData.referralCode}</p>
          </div>
          <button onClick={copyReferralCode} style={{ backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', height: '44px' }}>
            {copiedCode ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Referral Stats */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Impact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Invited', value: userData.referrals.invited },
            { label: 'Active (30d)', value: userData.referrals.active30 }
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#FAFAF8', fontSize: '20px', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Bebas Neue, sans-serif' }}>{stat.value}</p>
              <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reward Tiers */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reward Tiers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { refs: 1, reward: 'TG Merch Credit', progress: 1 },
            { refs: 3, reward: 'Training Grounds Hoodie', progress: 0 },
            { refs: 5, reward: 'Free Month', progress: 0 },
            { refs: 10, reward: 'Ambassador Status', progress: 0 }
          ].map((tier, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>Refer {tier.refs} Friend{tier.refs !== 1 ? 's' : ''}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{tier.reward}</p>
              </div>
              {tier.progress === 1 ? <Unlock size={20} color="#C9A87C" /> : <Lock size={20} color="#B0B5B8" />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', backgroundColor: 'rgba(201, 168, 124, 0.1)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(201, 168, 124, 0.2)' }}>
          <p style={{ color: '#C9A87C', fontSize: '12px', margin: '0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>2 / 3 until next reward</p>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#C9A87C', height: '100%', width: '66%' }} />
          </div>
        </div>
      </div>

      {/* Referral Pipeline */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Referral Pipeline</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '4px' }}>
          {[
            { stage: 'Invited', count: 5, icon: '📧' },
            { stage: 'Trial', count: 3, icon: '🎯' },
            { stage: 'Signed', count: 2, icon: '✅' },
            { stage: 'Active 30d', count: 2, icon: '🔥' }
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{step.icon}</div>
              <p style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 2px' }}>{step.count}</p>
              <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.stage}</p>
            </div>
          ))}
        </div>

        {/* Sample Referrals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: 'Jordan Smith', status: 'Active 30 Days', date: '3 months ago' },
            { name: 'Casey Lee', status: 'Trial Booked', date: '2 weeks ago' },
            { name: 'Morgan Davis', status: 'Trial Booked', date: '1 week ago' }
          ].map((ref, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '12px', fontWeight: '600', margin: '0' }}>{ref.name}</p>
                <p style={{ color: '#B0B5B8', fontSize: '10px', margin: '0' }}>{ref.date}</p>
              </div>
              <span style={{ backgroundColor: 'rgba(201, 168, 124, 0.1)', color: '#C9A87C', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ref.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share Buttons */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share Your Code</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button style={{ backgroundColor: '#2A2A2A', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAF8', borderRadius: '6px', padding: '12px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Share2 size={14} />
            SMS
          </button>
          <button style={{ backgroundColor: '#2A2A2A', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAF8', borderRadius: '6px', padding: '12px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Share2 size={14} />
            Email
          </button>
        </div>
      </div>
    </div>
  );

  const CoachesCornerScreen = () => (
    <div style={{ backgroundColor: '#1E1E1E', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ color: '#FAFAF8', fontSize: '24px', fontWeight: '700', margin: '0', fontFamily: 'Bebas Neue, sans-serif' }}>Coaches Corner</h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', display: 'flex', gap: '16px' }}>
        {['Session Planner', 'Game Builder', 'Templates', 'Student Reviews'].map((tab) => (
          <button key={tab} style={{ backgroundColor: 'transparent', border: 'none', color: '#B0B5B8', borderBottom: '3px solid transparent', padding: '12px 0', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Session Planner */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Create New Class Plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Class Name', placeholder: 'e.g., Advanced Guard Escapes' },
            { label: 'Duration', placeholder: 'e.g., 60 minutes' },
            { label: 'Level', placeholder: 'Beginner / Intermediate / Advanced' }
          ].map((field, i) => (
            <div key={i}>
              <label style={{ color: '#FAFAF8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{field.label}</label>
              <input
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  backgroundColor: '#2A2A2A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '10px',
                  color: '#FAFAF8',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
          <button style={{ width: '100%', backgroundColor: '#C9A87C', color: '#1E1E1E', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Create Class Plan
          </button>
        </div>
      </div>

      {/* Saved Templates */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Class Templates</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'Fundamentals BJJ (60 min)', classes: 'Used 12 times' },
            { name: 'Muay Thai Conditioning (45 min)', classes: 'Used 8 times' },
            { name: 'Advanced Wrestling (75 min)', classes: 'Used 5 times' }
          ].map((template, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>{template.name}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{template.classes}</p>
              </div>
              <button style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#C9A87C', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Use</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Student Journals */}
      <div style={{ padding: '0 16px 20px' }}>
        <h3 style={{ color: '#FAFAF8', fontSize: '14px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student Journals (Shared with You)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { student: 'Jamie Chen', class: 'Advanced BJJ', exploration: 'Triangle escape techniques', date: 'Today' },
            { student: 'Alex Rivera', class: 'Fundamentals', exploration: 'De la Riva guard sweeps', date: 'Yesterday' }
          ].map((journal, i) => (
            <div key={i} style={{ backgroundColor: '#2A2A2A', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ color: '#FAFAF8', fontSize: '13px', fontWeight: '600', margin: '0' }}>{journal.student}</p>
                <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0' }}>{journal.date}</p>
              </div>
              <p style={{ color: '#B0B5B8', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{journal.class}</p>
              <p style={{ color: '#FAFAF8', fontSize: '12px', margin: '0', fontStyle: 'italic' }}>{journal.exploration}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Main render logic
  let screenToRender;

  switch (currentScreen) {
    case 'dashboard':
      screenToRender = <DashboardScreen />;
      break;
    case 'profile':
      screenToRender = <ProfileScreen />;
      break;
    case 'community':
      screenToRender = <CommunityHubScreen />;
      break;
    case 'video':
      screenToRender = <VideoLibraryScreen />;
      break;
    case 'journal':
      screenToRender = <JournalScreen />;
      break;
    case 'rewards':
      screenToRender = <RewardsAndBadgesScreen />;
      break;
    case 'progress':
      screenToRender = <ProgressTrackingScreen />;
      break;
    case 'referrals':
      screenToRender = <ReferralProgramScreen />;
      break;
    case 'coaches':
      screenToRender = <CoachesCornerScreen />;
      break;
    default:
      screenToRender = <DashboardScreen />;
  }

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#FAFAF8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* App Container */}
      <div style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: '#1E1E1E', minHeight: '100vh', position: 'relative' }}>
        {screenToRender}

        {/* Bottom Navigation */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            maxWidth: '430px',
            backgroundColor: '#2A2A2A',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 100
          }}
        >
          {[
            { id: 'home', icon: Home, label: 'Home', screen: 'dashboard' },
            { id: 'community', icon: MessageCircle, label: 'Community', screen: 'community' },
            { id: 'video', icon: PlayCircle, label: 'Video', screen: 'video' },
            { id: 'journal', icon: BookOpen, label: 'Journal', screen: 'journal' },
            { id: 'profile', icon: User, label: 'Profile', screen: 'profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setCurrentScreen(tab.screen); setActiveTab(tab.id); }}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#C9A87C' : '#B0B5B8',
                fontSize: '11px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Navigation from Profile */}
        {activeTab === 'profile' && (
          <div style={{ position: 'fixed', bottom: '80px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Rewards', screen: 'rewards' },
              { label: 'Progress', screen: 'progress' },
              { label: 'Referrals', screen: 'referrals' }
            ].map((quick) => (
              <button
                key={quick.screen}
                onClick={() => setCurrentScreen(quick.screen)}
                style={{
                  backgroundColor: '#C9A87C',
                  color: '#1E1E1E',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                {quick.label}
              </button>
            ))}
            {userRole === 'coach' && (
              <button
                onClick={() => setCurrentScreen('coaches')}
                style={{
                  backgroundColor: '#C9A87C',
                  color: '#1E1E1E',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                Coach Mode
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingGroundsApp;
