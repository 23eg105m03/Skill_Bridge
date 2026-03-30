export interface MockUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  profileImage: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  status: 'active' | 'suspended';
}

export interface SwapRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  skillWanted: string;
  skillOffered: string;
  status: 'pending' | 'accepted' | 'rejected';
  date: string;
}

export interface Note {
  id: string;
  title: string;
  fileType: 'pdf' | 'image' | 'doc';
  ownerId: string;
  ownerName: string;
  sharedWith: string[];
  date: string;
}

export interface VoiceMsg {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  duration: number;
  date: string;
}

export const mockUsers: MockUser[] = [
  { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', bio: 'Data scientist and Python enthusiast', profileImage: '', skillsOffered: ['Python', 'Machine Learning', 'Data Analysis'], skillsWanted: ['React.js', 'UI Design'], rating: 4.9, status: 'active' },
  { id: '3', name: 'Marcus Williams', email: 'marcus@example.com', bio: 'Backend developer passionate about cloud computing', profileImage: '', skillsOffered: ['Node.js', 'AWS', 'Docker'], skillsWanted: ['TypeScript', 'GraphQL'], rating: 4.7, status: 'active' },
  { id: '4', name: 'Priya Patel', email: 'priya@example.com', bio: 'UX designer transitioning to full-stack', profileImage: '', skillsOffered: ['Figma', 'UI Design', 'User Research'], skillsWanted: ['React.js', 'Node.js'], rating: 4.6, status: 'active' },
  { id: '5', name: 'James Kim', email: 'james@example.com', bio: 'Mobile developer exploring AI', profileImage: '', skillsOffered: ['Swift', 'React Native', 'Flutter'], skillsWanted: ['Machine Learning', 'Python'], rating: 4.5, status: 'active' },
  { id: '6', name: 'Emma Davis', email: 'emma@example.com', bio: 'Frontend developer and accessibility advocate', profileImage: '', skillsOffered: ['CSS', 'Accessibility', 'JavaScript'], skillsWanted: ['Docker', 'AWS'], rating: 4.8, status: 'suspended' },
];

export const mockSwapRequests: SwapRequest[] = [
  { id: '1', senderId: '2', senderName: 'Sarah Chen', receiverId: '1', receiverName: 'Alex Johnson', skillWanted: 'React.js', skillOffered: 'Python', status: 'pending', date: '2026-03-14' },
  { id: '2', senderId: '4', senderName: 'Priya Patel', receiverId: '1', receiverName: 'Alex Johnson', skillWanted: 'TypeScript', skillOffered: 'UI Design', status: 'pending', date: '2026-03-13' },
  { id: '3', senderId: '1', senderName: 'Alex Johnson', receiverId: '3', receiverName: 'Marcus Williams', skillWanted: 'Node.js', skillOffered: 'React.js', status: 'accepted', date: '2026-03-10' },
];

export const mockNotes: Note[] = [
  { id: '1', title: 'React Hooks Deep Dive', fileType: 'pdf', ownerId: '1', ownerName: 'Alex Johnson', sharedWith: ['2'], date: '2026-03-12' },
  { id: '2', title: 'Python ML Basics', fileType: 'pdf', ownerId: '2', ownerName: 'Sarah Chen', sharedWith: ['1'], date: '2026-03-11' },
  { id: '3', title: 'UI Design Principles', fileType: 'image', ownerId: '4', ownerName: 'Priya Patel', sharedWith: ['1'], date: '2026-03-10' },
];

export const mockVoiceMessages: VoiceMsg[] = [
  { id: '1', senderId: '2', senderName: 'Sarah Chen', receiverId: '1', duration: 45, date: '2026-03-14' },
  { id: '2', senderId: '1', senderName: 'Alex Johnson', receiverId: '3', duration: 32, date: '2026-03-13' },
];

export function findMatches(userSkillsOffered: string[], userSkillsWanted: string[]) {
  return mockUsers.map(u => {
    const theyWantWeOffer = u.skillsWanted.filter(s => userSkillsOffered.includes(s));
    const weWantTheyOffer = u.skillsOffered.filter(s => userSkillsWanted.includes(s));
    const matchScore = theyWantWeOffer.length + weWantTheyOffer.length;
    const maxPossible = Math.max(1, u.skillsWanted.length + u.skillsOffered.length);
    return {
      user: u,
      matchPercentage: Math.min(100, Math.round((matchScore / maxPossible) * 100 * 2)),
      matchedSkillsTheyWant: theyWantWeOffer,
      matchedSkillsWeWant: weWantTheyOffer,
    };
  }).filter(m => m.matchPercentage > 0).sort((a, b) => b.matchPercentage - a.matchPercentage);
}
