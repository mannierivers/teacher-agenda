export type ScheduleType = 'A' | 'B' | 'B-Late' | 'B-Assembly' | 'B-Early' | 'C' | 'NONE';

export const getLunchTier = (room: string): { tier: 1 | 2; recognized: boolean } => {
  const r = room.trim().toLowerCase();
  if (!r) return { tier: 2, recognized: false };
  // 1st Lunch: 117, 200s, 700s, 800s, 900s, West Campus, Gym, Weight Room
  const firstLunch = r === '117' || r.includes('west') || r.includes('gym') || r.includes('weight') || ['2', '7', '8', '9'].includes(r.charAt(0));
  return { tier: firstLunch ? 1 : 2, recognized: true };
};

export const getScheduleDetails = (type: ScheduleType, room: string) => {
  const { tier } = getLunchTier(room);
  
  const schedules: Record<string, any> = {
    'A': { title: "Schedule A (Lunch in 3rd)", periods: [{ label: "Per 1", time: "8:10-9:30" }, { label: "Per 2", time: "9:40-11:00" }], lunch: tier === 1 ? { label: "1st LUNCH", time: "11:00-11:30" } : { label: "2nd LUNCH", time: "12:30-1:00" }, splitClass: tier === 1 ? { label: "Per 3", time: "11:40-1:00" } : { label: "Per 3", time: "11:10-12:30" }, final: { label: "Per 4", time: "1:10-2:30" }},
    'B': { title: "Schedule B (Lunch in 6th)", periods: [{ label: "Per 5", time: "8:10-9:30" }, { label: "Community", time: "9:40-11:00" }], lunch: tier === 1 ? { label: "1st LUNCH", time: "11:00-11:30" } : { label: "2nd LUNCH", time: "12:30-1:00" }, splitClass: tier === 1 ? { label: "Per 6", time: "11:40-1:00" } : { label: "Per 6", time: "11:10-12:30" }, final: { label: "Per 7", time: "1:10-2:30" }},
    'B-Late': { title: "Student Late Arrival", periods: [{ label: "Faculty", time: "7:30-9:30" }, { label: "Per 5", time: "9:40-11:00" }], lunch: tier === 1 ? { label: "1st LUNCH", time: "11:00-11:30" } : { label: "2nd LUNCH", time: "12:30-1:00" }, splitClass: tier === 1 ? { label: "Per 6", time: "11:40-1:00" } : { label: "Per 6", time: "11:10-12:30" }, final: { label: "Per 7", time: "1:10-2:30" }},
    'B-Assembly': { title: "Schedule B (Assembly)", periods: [{ label: "Per 5", time: "8:10-9:30" }, { label: "Per 7", time: "9:40-11:00" }], lunch: tier === 1 ? { label: "1st LUNCH", time: "11:00-11:30" } : { label: "2nd LUNCH", time: "12:30-1:00" }, splitClass: tier === 1 ? { label: "Per 6", time: "11:40-1:00" } : { label: "Per 6", time: "11:10-12:30" }, final: { label: "Assembly", time: "1:10-2:30" }},
    'B-Early': { title: "B (Early Dismissal)", periods: [{ label: "Per 5", time: "8:10-9:30" }, { label: "Per 7", time: "9:40-11:00" }, { label: "Per 6", time: "11:10-12:30" }], lunch: null, splitClass: null, final: null },
    'C': { title: "Schedule C (45m)", periods: [{ label: "Per 1", time: "8:10-9:00" }, { label: "Per 2", time: "9:05-9:50" }, { label: "Per 3", time: "9:55-10:40" }], lunch: tier === 1 ? { label: "1st LUNCH", time: "10:40-11:15" } : { label: "2nd LUNCH", time: "11:30-12:05" }, splitClass: tier === 1 ? { label: "Per 4", time: "11:20-12:05" } : { label: "Per 4", time: "10:45-11:30" }, final: { label: "P5-7", time: "12:10-2:35" }},
    'NONE': { title: "No School / Break", periods: [{ label: "Campus Status", time: "Closed" }], lunch: null, splitClass: null, final: null }
  };

  return schedules[type] || schedules['NONE'];
};