// lib/agenda-service.ts
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// This creates the unique ID for every class/day combo
export const getAgendaId = (date: string, classId: string) => {
  return `${date}_${classId}`;
};

// Function to fetch the agenda
export const fetchAgenda = async (date: string, classId: string) => {
  const id = getAgendaId(date, classId);
  const docRef = doc(db, "agendas", id);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return null; // Logic in UI will then show blank boxes
};