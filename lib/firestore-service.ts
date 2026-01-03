import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const agendaService = {
  // 1. Fetch Agenda with legacy fallback
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
  saveTeacherSettings: async (uid: string, settings: any) => {
  try {
    const docRef = doc(db, "teacherSettings", uid);
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving teacher settings:", error);
    return false;
  }
},

// 2. Updated fetch to get all settings at once
getTeacherSettings: async (uid: string) => {
  try {
    const docRef = doc(db, "teacherSettings", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    return null;
  }
},

  // 2. Save Agenda (Strictly separating Lesson Content from Metadata)
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
        content: payload.agenda, // Nested lesson data
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  // 3. Save Teacher Classroom Mappings (e.g., P1 -> Science Course ID)
  saveClassroomMappings: async (uid: string, mappings: any) => {
    try {
      const docRef = doc(db, "teacherSettings", uid);
      await setDoc(docRef, { classroomMappings: mappings }, { merge: true });
      return true;
    } catch (error) {
      return false;
    }
  },

  // 4. Fetch Teacher Classroom Mappings
  getClassroomMappings: async (uid: string) => {
    try {
      const docRef = doc(db, "teacherSettings", uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data().classroomMappings : {};
    } catch (error) {
      return {};
    }
  }
};