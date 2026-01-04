export type ScheduleType = 'A' | 'B' | 'B-Late' | 'B-Assembly' | 'B-Early' | 'C' | 'NONE';

export const getLunchTier = (room: string): { tier: 1 | 2; recognized: boolean } => {
  const r = room.trim().toLowerCase();
  if (!r) return { tier: 2, recognized: false };
  const isFirst = r === '117' || r.includes('west') || r.includes('gym') || r.includes('weight') || ['2', '7', '8', '9'].includes(r.charAt(0));
  return { tier: isFirst ? 1 : 2, recognized: true };
};

export const getScheduleDetails = (type: ScheduleType, room: string) => {
  const { tier } = getLunchTier(room);
  
  // Linear Timeline Builder
  const schedules: Record<string, any> = {
    'A': {
      title: "Schedule A",
      timeline: [
        { label: "Period 1", time: "8:10 - 9:30" },
        { label: "Period 2", time: "9:40 - 11:00" },
        ...(tier === 1 
          ? [{ label: "1st LUNCH", time: "11:00 - 11:30", isLunch: true }, { label: "Period 3", time: "11:40 - 1:00" }]
          : [{ label: "Period 3", time: "11:10 - 12:30" }, { label: "2nd LUNCH", time: "12:30 - 1:00", isLunch: true }]),
        { label: "Period 4", time: "1:10 - 2:30" }
      ]
    },
    'B': {
      title: "Schedule B",
      timeline: [
        { label: "Period 5", time: "8:10 - 9:30" },
        { label: "Community", time: "9:40 - 11:00" },
        ...(tier === 1 
          ? [{ label: "1st LUNCH", time: "11:00 - 11:30", isLunch: true }, { label: "Period 6", time: "11:40 - 1:00" }]
          : [{ label: "Period 6", time: "11:10 - 12:30" }, { label: "2nd LUNCH", time: "12:30 - 1:00", isLunch: true }]),
        { label: "Period 7", time: "1:10 - 2:30" }
      ]
    },
    'B-Late': {
      title: "Late Arrival",
      timeline: [
        { label: "Faculty", time: "7:30 - 9:30" },
        { label: "Period 5", time: "9:40 - 11:00" },
        ...(tier === 1 
          ? [{ label: "1st LUNCH", time: "11:00 - 11:30", isLunch: true }, { label: "Period 6", time: "11:40 - 1:00" }]
          : [{ label: "Period 6", time: "11:10 - 12:30" }, { label: "2nd LUNCH", time: "12:30 - 1:00", isLunch: true }]),
        { label: "Period 7", time: "1:10 - 2:30" }
      ]
    },
    'B-Assembly': {
      title: "Assembly",
      timeline: [
        { label: "Period 5", time: "8:10 - 9:30" },
        { label: "Period 7", time: "9:40 - 11:00" },
        ...(tier === 1 
          ? [{ label: "1st LUNCH", time: "11:00 - 11:30", isLunch: true }, { label: "Period 6", time: "11:40 - 1:00" }]
          : [{ label: "Period 6", time: "11:10 - 12:30" }, { label: "2nd LUNCH", time: "12:30 - 1:00", isLunch: true }]),
        { label: "HR/Assembly", time: "1:10 - 2:30" }
      ]
    },
    'B-Early': {
      title: "Early Dismiss",
      timeline: [
        { label: "Period 5", time: "8:10 - 9:30" },
        { label: "Period 7", time: "9:40 - 11:00" },
        { label: "Period 6", time: "11:10 - 12:30" },
        { label: "Dismissal", time: "12:30", isLunch: true }
      ]
    },
    'C': {
      title: "Schedule C",
      timeline: [
        { label: "Period 1", time: "8:10 - 9:00" },
        { label: "Period 2", time: "9:05 - 9:50" },
        { label: "Period 3", time: "9:55 - 10:40" },
        ...(tier === 1 
          ? [{ label: "1st LUNCH", time: "10:40 - 11:15", isLunch: true }, { label: "Period 4", time: "11:20 - 12:05" }]
          : [{ label: "Period 4", time: "10:45 - 11:30" }, { label: "2nd LUNCH", time: "11:30 - 12:05", isLunch: true }]),
        { label: "Period 5", time: "12:10 - 12:55" },
        { label: "Period 6", time: "1:00 - 1:45" },
        { label: "Period 7", time: "1:50 - 2:35" }
      ]
    },
    'NONE': {
      title: "No School / Break",
      timeline: [{ label: "Status", time: "Campus Closed", isLunch: true }]
    }
  };

  return schedules[type] || schedules['NONE'];
};