import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const agendaService = {
  // Fetch specific lesson agenda
  getAgenda: async (uid: string, date: string, classId: string) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      const docRef = doc(db, "agendas", docId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      return null;
    }
  },

  // Save lesson agenda with Metadata isolation
  saveAgenda: async (uid: string, date: string, classId: string, payload: { agenda: any, layout: any, themeId: string, scheduleType: string }) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      const docRef = doc(db, "agendas", docId);
      await setDoc(docRef, {
        teacherId: uid,
        date: date,
        classId: classId,
        themeId: payload.themeId,
        layout: payload.layout,
        scheduleType: payload.scheduleType,
        content: payload.agenda, 
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Save Global Teacher Settings (Room #, Classroom Mappings, Section Names)
  saveTeacherSettings: async (uid: string, settings: any) => {
    try {
      const docRef = doc(db, "teacherSettings", uid);
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Retrieve Global Settings
  getTeacherSettings: async (uid: string) => {
    try {
      const docRef = doc(db, "teacherSettings", uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      return null;
    }
  }
};