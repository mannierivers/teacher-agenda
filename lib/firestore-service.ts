import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const agendaService = {
  // Generate the consistent ID we use for documents
  getDocId: (uid: string, date: string, classId: string) => {
    return `${uid}_${date}_${classId}`;
  },

  // Fetch a single agenda
  getAgenda: async (uid: string, date: string, classId: string) => {
    const docId = agendaService.getDocId(uid, date, classId);
    const docRef = doc(db, "agendas", docId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  // Save an agenda (full overwrite or create)
  saveAgenda: async (uid: string, date: string, classId: string, data: any) => {
    const docId = agendaService.getDocId(uid, date, classId);
    const docRef = doc(db, "agendas", docId);
    
    return await setDoc(docRef, {
      ...data,
      teacherId: uid,
      date: date,
      classId: classId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};