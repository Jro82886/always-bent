// /mocks/chat.ts
export const MOCK_ROOMS = [
  { id:'inlet', name:'Inlet Chat', unread:2, online:7 },
  { id:'tuna', name:'Tuna Chat', unread:0, online:21 },
  { id:'offshore', name:'Offshore Chat', unread:1, online:9 },
  { id:'inshore', name:'Inshore Chat', unread:0, online:5 },
];
export const MOCK_MESSAGES = Array.from({length:12}).map((_,i)=>({
  id:String(i), roomId:'inlet', userId:i%3?'u1':'u2',
  author:i%3?'Captain Amy':'Captain Joe',
  text:i%4? 'Birds working east of the point.' : '@Amanda tide just turned low.',
  createdAtIso:new Date(Date.now()-i*600000).toISOString(),
}));
export const MOCK_PRESENCE = [
  { userId:'u1', name:'Captain Amy', avatarUrl:'/a.png', online:true },
  { userId:'u2', name:'Captain Joe', avatarUrl:'/b.png', online:true },
  { userId:'u3', name:'Sam', avatarUrl:'/c.png', online:false },
];
