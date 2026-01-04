import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const agendaService = {
  getAgenda: async (uid: string, date: string, classId: string) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      const snap = await getDoc(doc(db, "agendas", docId));
      return snap.exists() ? snap.data() : null;
    } catch (e) { return null; }
  },

  saveAgenda: async (uid: string, date: string, classId: string, p: any) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      await setDoc(doc(db, "agendas", docId), {
        teacherId: uid, date, classId, themeId: p.themeId, 
        layout: p.layout, scheduleType: p.scheduleType,
        content: p.agenda, updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) { return false; }
  },

  saveTeacherSettings: async (uid: string, s: any) => {
    try {
      await setDoc(doc(db, "teacherSettings", uid), s, { merge: true });
      return true;
    } catch (e) { return false; }
  },

  getTeacherSettings: async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "teacherSettings", uid));
      return snap.exists() ? snap.data() : null;
    } catch (e) { return null; }
  }
};