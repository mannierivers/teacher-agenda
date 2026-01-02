import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const agendaService = {
  // GET: Fetches the document and returns null if not found
  getAgenda: async (uid: string, date: string, classId: string) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      const docRef = doc(db, "agendas", docId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      console.error("Fetch error:", error);
      return null;
    }
  },

  // SAVE: Explicitly separates metadata from lesson content
  saveAgenda: async (uid: string, date: string, classId: string, payload: { agenda: any, layout: any, themeId: string }) => {
    try {
      const docId = `${uid}_${date}_class_${classId}`;
      const docRef = doc(db, "agendas", docId);
      
      await setDoc(docRef, {
        teacherId: uid,
        date: date,
        classId: classId,
        themeId: payload.themeId,
        layout: payload.layout,
        // The lesson data is nested here so it doesn't mix with settings
        content: payload.agenda, 
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Save error:", error);
      return false;
    }
  }
};